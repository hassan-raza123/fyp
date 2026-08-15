import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit-log';
import {
  accumulateSurveyRatings,
  finaliseIndirectAttainment,
  weightedAverage,
  computePloScoresForOffering,
  savePloScores,
  aggregatePloScores,
  DEFAULT_PLO_THRESHOLD,
} from '@/lib/obe';
import { plo_status } from '@prisma/client';
import { authorize, canAccessProgram, forbiddenResponse } from '@/lib/authz';

interface ContributingCLO {
  cloId: number;
  cloCode: string;
  attainment: number | null;
  weight: number;
}

interface ContributingLLO {
  lloId: number;
  lloCode: string;
  attainment: number | null;
  weight: number;
}

interface PLOAttainment {
  ploId: number;
  ploCode: string;
  description: string;
  attainment: number;
  directAttainment: number;
  indirectAttainment: number | null;
  contributingClos: ContributingCLO[];
  contributingLlos: ContributingLLO[];
}


// ── GET: live calculation for display (not persisted) ───────────────────────
export async function GET(request: NextRequest) {
  try {
    // Programme-wide PLO attainment is an accreditation view of the cohort.
    const auth = await authorize(request, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId');
    const semesterId = searchParams.get('semesterId');

    if (!programId || !semesterId) {
      return NextResponse.json(
        { error: 'Program ID and Semester ID are required' },
        { status: 400 }
      );
    }

    const pid = Number(programId);
    if (Number.isNaN(pid)) {
      return NextResponse.json({ error: 'Invalid programId' }, { status: 400 });
    }
    if (!(await canAccessProgram(request, auth.user, pid))) {
      return forbiddenResponse();
    }
    const sid = Number(semesterId);

    // Fetch PLOs with CLO + LLO mapping attainments for the semester
    const plos = await prisma.plos.findMany({
      where: { programId: pid, status: plo_status.active },
      include: {
        cloMappings: {
          include: {
            clo: {
              include: {
                closAttainments: {
                  where: { courseOffering: { semesterId: sid } },
                  orderBy: { calculatedAt: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
        lloMappings: {
          include: {
            llo: {
              include: {
                llosAttainments: {
                  where: { courseOffering: { semesterId: sid } },
                  orderBy: { calculatedAt: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    // Direct attainment: weighted average of CLO + LLO attainments
    const directAttainmentByPlo = new Map<
      number,
      {
        attainment: number;
        contributingClos: ContributingCLO[];
        contributingLlos: ContributingLLO[];
      }
    >();

    for (const plo of plos) {
      const contributingClos: ContributingCLO[] = plo.cloMappings.map((mapping) => ({
        cloId: mapping.clo.id,
        cloCode: mapping.clo.code,
        attainment: mapping.clo.closAttainments[0]?.attainmentPercent ?? null,
        weight: mapping.weight,
      }));

      const contributingLlos: ContributingLLO[] = plo.lloMappings.map((mapping) => ({
        lloId: mapping.llo.id,
        lloCode: mapping.llo.code,
        attainment: mapping.llo.llosAttainments[0]?.attainmentPercent ?? null,
        weight: mapping.weight,
      }));

      // Only include CLOs/LLOs that have actually been calculated (attainment !== null)
      const allContributions = [
        ...contributingClos.filter((c) => c.attainment !== null).map((c) => ({ attainment: c.attainment as number, weight: c.weight })),
        ...contributingLlos.filter((l) => l.attainment !== null).map((l) => ({ attainment: l.attainment as number, weight: l.weight })),
      ];

      directAttainmentByPlo.set(plo.id, {
        attainment: weightedAverage(allContributions) ?? 0,
        contributingClos,
        contributingLlos,
      });
    }

    // Fetch course offerings with enrollment counts (needed for response rate validation)
    const courseOfferingsRaw = await prisma.courseofferings.findMany({
      where: {
        semesterId: sid,
        course: { programMappings: { some: { A: pid } } },
      },
      select: {
        id: true,
        sections: {
          where: { status: 'active' },
          select: {
            studentsections: {
              where: { status: 'active' },
              select: { studentId: true },
            },
          },
        },
      },
    });

    // Build enrolled-count per offering and total unique students
    const enrolledByOffering = new Map<number, number>(); // offeringId → enrolled count
    const allStudentIds = new Set<number>();
    for (const co of courseOfferingsRaw) {
      const students = new Set<number>();
      for (const section of co.sections) {
        for (const ss of section.studentsections) {
          students.add(ss.studentId);
          allStudentIds.add(ss.studentId);
        }
      }
      enrolledByOffering.set(co.id, students.size);
    }
    const totalStudents = allStudentIds.size;
    const offeringIds = courseOfferingsRaw.map((co) => co.id);

    // Fetch graduation criteria for weights + response rate threshold
    const graduationCriteria = await prisma.graduation_criteria.findUnique({
      where: { programId: pid },
      select: { directWeight: true, indirectWeight: true, minSurveyResponseRate: true },
    });
    const directWeight = graduationCriteria?.directWeight ?? 0.7;
    const indirectWeight = graduationCriteria?.indirectWeight ?? 0.3;
    const minSurveyResponseRate = graduationCriteria?.minSurveyResponseRate ?? 0.0;

    // Indirect attainment: course-exit surveys (filtered by response rate)
    const indirectByPlo = new Map<number, { sumPercent: number; count: number }>();

    if (offeringIds.length > 0) {
      const courseExitSurveys = await prisma.surveys.findMany({
        where: { courseOfferingId: { in: offeringIds }, status: 'closed' },
        include: {
          questions: {
            where: { ploId: { not: null } },
            select: {
              ploId: true,
              ratingScale: true,
              answers: { select: { ratingValue: true } },
            },
          },
          _count: { select: { responses: true } },
        },
      });

      // Skip surveys that don't meet the minimum response rate threshold
      const validCourseExitSurveys = courseExitSurveys.filter((s) => {
        if (minSurveyResponseRate <= 0) return true;
        const enrolled =
          s.courseOfferingId !== null
            ? (enrolledByOffering.get(s.courseOfferingId) ?? 0)
            : 0;
        if (enrolled === 0) return s._count.responses > 0;
        return s._count.responses / enrolled >= minSurveyResponseRate;
      });

      accumulateSurveyRatings(validCourseExitSurveys, indirectByPlo);
    }

    // Program-level surveys: program_exit, alumni, employer (filtered by response rate)
    const programLevelSurveys = await prisma.surveys.findMany({
      where: {
        programId: pid,
        status: 'closed',
        type: { in: ['program_exit', 'alumni', 'employer'] },
      },
      include: {
        questions: {
          where: { ploId: { not: null } },
          select: {
            ploId: true,
            ratingScale: true,
            answers: { select: { ratingValue: true } },
          },
        },
        _count: { select: { responses: true } },
      },
    });

    const validProgramSurveys = programLevelSurveys.filter((s) => {
      if (minSurveyResponseRate <= 0 || totalStudents === 0) return s._count.responses > 0;
      return s._count.responses / totalStudents >= minSurveyResponseRate;
    });

    accumulateSurveyRatings(validProgramSurveys, indirectByPlo);

    // Ratings are already normalised per question scale by accumulateSurveyRatings
    const indirectAttainmentByPloId = finaliseIndirectAttainment(indirectByPlo);

    // Combine direct + indirect and return
    const ploAttainments: PLOAttainment[] = plos.map((plo) => {
      const direct = directAttainmentByPlo.get(plo.id);
      const directAttainment = direct?.attainment ?? 0;
      const contributingClos = direct?.contributingClos ?? [];
      const contributingLlos = direct?.contributingLlos ?? [];
      const indirectAttainment = indirectAttainmentByPloId.get(plo.id) ?? null;

      const attainment =
        indirectAttainment !== null
          ? directWeight * directAttainment + indirectWeight * indirectAttainment
          : directAttainment;

      return {
        ploId: plo.id,
        ploCode: plo.code,
        description: plo.description,
        directAttainment,
        indirectAttainment,
        attainment,
        contributingClos,
        contributingLlos,
      };
    });

    return NextResponse.json(ploAttainments);
  } catch (error) {
    console.error('Error fetching PLO attainments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PLO attainments' },
      { status: 500 }
    );
  }
}

// ── POST: persist PLO attainments + per-student PLO scores ───────────────────
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!['admin', 'faculty', 'super_admin'].includes(auth.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { programId, semesterId } = body;

    if (!programId || !semesterId) {
      return NextResponse.json(
        { error: 'programId and semesterId are required' },
        { status: 400 }
      );
    }

    const pid = Number(programId);
    const sid = Number(semesterId);

    // Recomputing attainment writes `ploattainments` rows for the programme
    // named in the body — an accreditation figure for someone else's degree.
    if (!(await canAccessProgram(request, auth.user, pid))) {
      return forbiddenResponse();
    }

    // ── Fetch PLOs with CLO + LLO attainments ─────────────────────────────────
    const plos = await prisma.plos.findMany({
      where: { programId: pid, status: plo_status.active },
      include: {
        cloMappings: {
          include: {
            clo: {
              include: {
                closAttainments: {
                  where: { courseOffering: { semesterId: sid } },
                  orderBy: { calculatedAt: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
        lloMappings: {
          include: {
            llo: {
              include: {
                llosAttainments: {
                  where: { courseOffering: { semesterId: sid } },
                  orderBy: { calculatedAt: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    // ── Direct attainment per PLO ──────────────────────────────────────────────
    const directByPlo = new Map<number, number>();
    for (const plo of plos) {
      // Only include CLOs/LLOs that have actually been calculated
      const contributions = [
        ...plo.cloMappings
          .filter((m) => m.clo.closAttainments.length > 0)
          .map((m) => ({
            attainment: m.clo.closAttainments[0].attainmentPercent,
            weight: m.weight,
          })),
        ...plo.lloMappings
          .filter((m) => m.llo.llosAttainments.length > 0)
          .map((m) => ({
            attainment: m.llo.llosAttainments[0].attainmentPercent,
            weight: m.weight,
          })),
      ];
      const totalWeight = contributions.reduce((s, c) => s + c.weight, 0);
      const weightedSum = contributions.reduce((s, c) => s + c.attainment * c.weight, 0);
      directByPlo.set(plo.id, totalWeight > 0 ? weightedSum / totalWeight : 0);
    }

    // ── Fetch all course offerings (single query used for survey rates + ploscores) ──
    const allOfferings = await prisma.courseofferings.findMany({
      where: {
        semesterId: sid,
        course: { programMappings: { some: { A: pid } } },
      },
      include: {
        course: {
          select: {
            id: true,
            clos: {
              where: { status: 'active' },
              select: {
                id: true,
                ploMappings: { select: { ploId: true, weight: true } },
              },
            },
            llos: {
              where: { status: 'active' },
              select: {
                id: true,
                ploMappings: { select: { ploId: true, weight: true } },
              },
            },
          },
        },
        sections: {
          where: { status: 'active' },
          include: {
            studentsections: {
              where: { status: 'active' },
              select: { studentId: true },
            },
          },
        },
        assessments: {
          where: { status: { in: ['active', 'completed'] } },
          select: {
            id: true,
            assessmentItems: {
              select: { id: true, marks: true, cloId: true, lloId: true },
            },
          },
        },
      },
    });

    const offeringIds = allOfferings.map((o) => o.id);

    // ── Build enrolled count per offering + total unique students ──────────────
    const enrolledByOffering = new Map<number, number>(); // offeringId → enrolled student count
    const allStudentIds = new Set<number>();
    for (const offering of allOfferings) {
      const students = new Set<number>();
      for (const section of offering.sections) {
        for (const ss of section.studentsections) {
          students.add(ss.studentId);
          allStudentIds.add(ss.studentId);
        }
      }
      enrolledByOffering.set(offering.id, students.size);
    }
    const totalStudents = allStudentIds.size;

    // ── Graduation criteria: weights + PLO threshold + min survey response rate ─
    const graduationCriteria = await prisma.graduation_criteria.findUnique({
      where: { programId: pid },
      select: {
        directWeight: true,
        indirectWeight: true,
        minPloAttainmentPercent: true,
        minSurveyResponseRate: true,
      },
    });
    const directWeight = graduationCriteria?.directWeight ?? 0.7;
    const indirectWeight = graduationCriteria?.indirectWeight ?? 0.3;
    const ploThreshold = graduationCriteria?.minPloAttainmentPercent ?? 50;
    const minSurveyResponseRate = graduationCriteria?.minSurveyResponseRate ?? 0.0;

    // ── Indirect attainment: course-exit surveys filtered by response rate ─────
    const indirectByPlo = new Map<number, { sumPercent: number; count: number }>();

    if (offeringIds.length > 0) {
      const courseExitSurveys = await prisma.surveys.findMany({
        where: { courseOfferingId: { in: offeringIds }, status: 'closed' },
        include: {
          questions: {
            where: { ploId: { not: null } },
            select: {
              ploId: true,
              ratingScale: true,
              answers: { select: { ratingValue: true } },
            },
          },
          _count: { select: { responses: true } },
        },
      });

      // Only include surveys that meet the minimum response rate
      const validCourseExitSurveys = courseExitSurveys.filter((s) => {
        if (minSurveyResponseRate <= 0) return true;
        const enrolled =
          s.courseOfferingId !== null
            ? (enrolledByOffering.get(s.courseOfferingId) ?? 0)
            : 0;
        if (enrolled === 0) return s._count.responses > 0;
        return s._count.responses / enrolled >= minSurveyResponseRate;
      });

      accumulateSurveyRatings(validCourseExitSurveys, indirectByPlo);
    }

    // Program-level surveys: program_exit, alumni, employer
    const programLevelSurveys = await prisma.surveys.findMany({
      where: {
        programId: pid,
        status: 'closed',
        type: { in: ['program_exit', 'alumni', 'employer'] },
      },
      include: {
        questions: {
          where: { ploId: { not: null } },
          select: {
            ploId: true,
            ratingScale: true,
            answers: { select: { ratingValue: true } },
          },
        },
        _count: { select: { responses: true } },
      },
    });

    const validProgramSurveys = programLevelSurveys.filter((s) => {
      if (minSurveyResponseRate <= 0 || totalStudents === 0) return s._count.responses > 0;
      return s._count.responses / totalStudents >= minSurveyResponseRate;
    });

    accumulateSurveyRatings(validProgramSurveys, indirectByPlo);

    // ── Semester name (needed for ploscores records) ──────────────────────────
    const semesterRecord = await prisma.semesters.findUnique({
      where: { id: sid },
      select: { name: true },
    });
    const semesterName = semesterRecord?.name ?? '';

    // Ratings are normalised per question scale by accumulateSurveyRatings
    const indirectAttainmentByPloId = finaliseIndirectAttainment(indirectByPlo);

    // ── Per-student PLO scores ────────────────────────────────────────────────
    // Computed before the aggregate upsert so studentsAchieved comes from real
    // per-student data. Mapping weights are applied inside the shared helper.
    const allPloScoreRecords: Array<{
      studentId: number;
      ploId: number;
      obtainedMarks: number;
      totalMarks: number;
    }> = [];
    let ploScoresSaved = 0;

    try {
      for (const offering of allOfferings) {
        const records = await computePloScoresForOffering(offering);
        if (records.length === 0) continue;
        ploScoresSaved += await savePloScores(records, semesterName);
        allPloScoreRecords.push(...records);
      }
    } catch (scoreError) {
      console.error('[POST_PLO_ATTAINMENTS] ploscores calculation failed:', scoreError);
    }

    // ── Per-PLO cohort counts from those scores ───────────────────────────────
    // A student's PLO score aggregates marks across every contributing offering
    // rather than taking their best one, so a single strong course cannot mask
    // weak performance elsewhere.
    const scoresByStudent = new Map<
      number,
      Array<{ ploId: number; obtainedMarks: number; totalMarks: number }>
    >();
    for (const record of allPloScoreRecords) {
      const list = scoresByStudent.get(record.studentId) ?? [];
      list.push(record);
      scoresByStudent.set(record.studentId, list);
    }

    // ploId → { assessed, achieved }. `assessed` is the count of students who
    // actually have a score for THAT PLO — dividing by the whole cohort would
    // understate any PLO that only one course contributes to.
    const ploCohort = new Map<number, { assessed: number; achieved: number }>();
    for (const records of scoresByStudent.values()) {
      for (const [ploId, agg] of aggregatePloScores(records).entries()) {
        const entry = ploCohort.get(ploId) ?? { assessed: 0, achieved: 0 };
        entry.assessed += 1;
        if (agg.percentage >= ploThreshold) entry.achieved += 1;
        ploCohort.set(ploId, entry);
      }
    }


    // ── Upsert aggregate PLO attainment records ────────────────────────────────
    const saved = await Promise.all(
      plos.map((plo) => {
        const directAttainment = directByPlo.get(plo.id) ?? 0;
        const indirectAttainment = indirectAttainmentByPloId.get(plo.id) ?? null;

        const attainmentPercent =
          indirectAttainment !== null
            ? directWeight * directAttainment + indirectWeight * indirectAttainment
            : directAttainment;

        // Denominator is students assessed against THIS PLO, not the whole cohort
        const cohort = ploCohort.get(plo.id) ?? { assessed: 0, achieved: 0 };

        return prisma.ploattainments.upsert({
          where: {
            ploId_programId_semesterId: {
              ploId: plo.id,
              programId: pid,
              semesterId: sid,
            },
          },
          update: {
            attainmentPercent,
            directAttainment,
            indirectAttainment,
            totalStudents: cohort.assessed,
            studentsAchieved: cohort.achieved,
            threshold: ploThreshold,
            isAchieved: attainmentPercent >= ploThreshold,
            calculatedAt: new Date(),
            calculatedBy: auth.user!.userId,
            status: 'active',
          },
          create: {
            ploId: plo.id,
            programId: pid,
            semesterId: sid,
            attainmentPercent,
            directAttainment,
            indirectAttainment,
            totalStudents: cohort.assessed,
            studentsAchieved: cohort.achieved,
            threshold: ploThreshold,
            isAchieved: attainmentPercent >= ploThreshold,
            calculatedBy: auth.user!.userId,
          },
        });
      })
    );

    await writeAuditLog(request, auth.user, 'attainment.plo_calculate', {
      programId: pid,
      semesterId: sid,
      directWeight,
      indirectWeight,
      ploCount: saved.length,
      ploScoresSaved,
      results: saved.map((p) => ({
        ploId: p.ploId,
        attainmentPercent: p.attainmentPercent,
        directAttainment: p.directAttainment,
        indirectAttainment: p.indirectAttainment,
      })),
    });

    return NextResponse.json({
      success: true,
      message: `PLO attainments saved for ${saved.length} PLO(s). Student PLO scores saved: ${ploScoresSaved} record(s).`,
      data: saved,
    });
  } catch (error) {
    console.error('Error saving PLO attainments:', error);
    return NextResponse.json({ error: 'Failed to save PLO attainments' }, { status: 500 });
  }
}
