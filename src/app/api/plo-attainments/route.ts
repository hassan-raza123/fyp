import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { plo_status } from '@prisma/client';

interface ContributingCLO {
  cloId: number;
  cloCode: string;
  attainment: number;
  weight: number;
}

interface ContributingLLO {
  lloId: number;
  lloCode: string;
  attainment: number;
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

// ── Helper: accumulate weighted survey ratings into indirectByPlo map ────────
function accumulateSurveyRatings(
  surveys: Array<{
    questions: Array<{ ploId: number | null; answers: Array<{ ratingValue: number | null }> }>;
    _count: { responses: number };
  }>,
  indirectByPlo: Map<number, { sumRating: number; count: number }>
) {
  for (const survey of surveys) {
    const responseCount = survey._count.responses;
    if (responseCount === 0) continue;
    for (const q of survey.questions) {
      if (!q.ploId) continue;
      const ratings = q.answers
        .filter((a) => a.ratingValue !== null)
        .map((a) => a.ratingValue as number);
      if (ratings.length === 0) continue;
      const avg = ratings.reduce((s, v) => s + v, 0) / ratings.length;
      const existing = indirectByPlo.get(q.ploId) ?? { sumRating: 0, count: 0 };
      indirectByPlo.set(q.ploId, {
        sumRating: existing.sumRating + avg * responseCount,
        count: existing.count + responseCount,
      });
    }
  }
}

// ── GET: live calculation for display (not persisted) ───────────────────────
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
        attainment: mapping.clo.closAttainments[0]?.attainmentPercent ?? 0,
        weight: mapping.weight,
      }));

      const contributingLlos: ContributingLLO[] = plo.lloMappings.map((mapping) => ({
        lloId: mapping.llo.id,
        lloCode: mapping.llo.code,
        attainment: mapping.llo.llosAttainments[0]?.attainmentPercent ?? 0,
        weight: mapping.weight,
      }));

      const allContributions = [
        ...contributingClos.map((c) => ({ attainment: c.attainment, weight: c.weight })),
        ...contributingLlos.map((l) => ({ attainment: l.attainment, weight: l.weight })),
      ];

      const totalWeight = allContributions.reduce((sum, c) => sum + c.weight, 0);
      const weightedSum = allContributions.reduce((sum, c) => sum + c.attainment * c.weight, 0);

      directAttainmentByPlo.set(plo.id, {
        attainment: totalWeight > 0 ? weightedSum / totalWeight : 0,
        contributingClos,
        contributingLlos,
      });
    }

    // Fetch course offerings with enrollment counts (needed for response rate validation)
    const courseOfferingsRaw = await prisma.courseofferings.findMany({
      where: {
        semesterId: sid,
        course: { programs: { some: { id: pid } } },
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
    const indirectByPlo = new Map<number, { sumRating: number; count: number }>();

    if (offeringIds.length > 0) {
      const courseExitSurveys = await prisma.surveys.findMany({
        where: { courseOfferingId: { in: offeringIds }, status: 'closed' },
        include: {
          questions: {
            where: { ploId: { not: null } },
            include: { answers: { select: { ratingValue: true } } },
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
          include: { answers: { select: { ratingValue: true } } },
        },
        _count: { select: { responses: true } },
      },
    });

    const validProgramSurveys = programLevelSurveys.filter((s) => {
      if (minSurveyResponseRate <= 0 || totalStudents === 0) return s._count.responses > 0;
      return s._count.responses / totalStudents >= minSurveyResponseRate;
    });

    accumulateSurveyRatings(validProgramSurveys, indirectByPlo);

    // Convert indirect map to percentage (avg_rating / 5 × 100)
    const indirectAttainmentByPloId = new Map<number, number>();
    for (const [ploId, data] of indirectByPlo.entries()) {
      const avgRating = data.count > 0 ? data.sumRating / data.count : 0;
      indirectAttainmentByPloId.set(ploId, Math.round((avgRating / 5) * 100 * 10) / 10);
    }

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
      const contributions = [
        ...plo.cloMappings.map((m) => ({
          attainment: m.clo.closAttainments[0]?.attainmentPercent ?? 0,
          weight: m.weight,
        })),
        ...plo.lloMappings.map((m) => ({
          attainment: m.llo.llosAttainments[0]?.attainmentPercent ?? 0,
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
        course: { programs: { some: { id: pid } } },
      },
      include: {
        course: {
          select: {
            id: true,
            clos: {
              where: { status: 'active' },
              include: { ploMappings: { select: { ploId: true } } },
            },
            llos: {
              where: { status: 'active' },
              include: { ploMappings: { select: { ploId: true } } },
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
    const indirectByPlo = new Map<number, { sumRating: number; count: number }>();

    if (offeringIds.length > 0) {
      const courseExitSurveys = await prisma.surveys.findMany({
        where: { courseOfferingId: { in: offeringIds }, status: 'closed' },
        include: {
          questions: {
            where: { ploId: { not: null } },
            include: { answers: { select: { ratingValue: true } } },
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
          include: { answers: { select: { ratingValue: true } } },
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

    // ── Calculate ploscores BEFORE ploattainments upsert ─────────────────────
    // We do this first so we can derive accurate studentsAchieved per PLO
    // from real per-student data instead of backwards-calculating from %.
    //
    // semesterBestPloScores tracks the best percentage each student achieved
    // for each PLO across all course offerings in this semester.
    const semesterBestPloScores = new Map<string, number>(); // `${studentId}_${ploId}` → best%
    let ploScoresSaved = 0;

    try {
      for (const offering of allOfferings) {
        // Build item → PLO mappings (via CLO or LLO)
        const cloToPlos = new Map<number, number[]>();
        for (const clo of offering.course.clos) {
          cloToPlos.set(clo.id, clo.ploMappings.map((m) => m.ploId));
        }
        const lloToPlos = new Map<number, number[]>();
        for (const llo of offering.course.llos) {
          lloToPlos.set(llo.id, llo.ploMappings.map((m) => m.ploId));
        }

        const itemToPlos = new Map<number, number[]>();
        const itemMarksMap = new Map<number, number>();
        for (const assessment of offering.assessments) {
          for (const item of assessment.assessmentItems) {
            itemMarksMap.set(item.id, item.marks);
            const ploIds: number[] = [];
            if (item.cloId !== null) ploIds.push(...(cloToPlos.get(item.cloId) ?? []));
            if (item.lloId !== null) ploIds.push(...(lloToPlos.get(item.lloId) ?? []));
            if (ploIds.length > 0) itemToPlos.set(item.id, ploIds);
          }
        }

        if (itemToPlos.size === 0) continue;

        const studentIdSet = new Set<number>();
        for (const section of offering.sections) {
          for (const ss of section.studentsections) {
            studentIdSet.add(ss.studentId);
          }
        }
        if (studentIdSet.size === 0) continue;

        const offeringStudentIds = Array.from(studentIdSet);
        const allItemIds = Array.from(itemToPlos.keys());

        const itemResults = await prisma.studentassessmentitemresults.findMany({
          where: {
            assessmentItemId: { in: allItemIds },
            studentResult: {
              studentId: { in: offeringStudentIds },
              status: { in: ['evaluated', 'published'] },
            },
          },
          select: {
            assessmentItemId: true,
            obtainedMarks: true,
            studentResult: { select: { studentId: true } },
          },
        });

        // Seed total marks per student × PLO
        const scoreMap = new Map<string, { obtained: number; total: number }>();
        for (const studentId of offeringStudentIds) {
          for (const [itemId, ploIds] of itemToPlos.entries()) {
            const marks = itemMarksMap.get(itemId) ?? 0;
            for (const ploId of ploIds) {
              const key = `${studentId}_${ploId}`;
              const existing = scoreMap.get(key) ?? { obtained: 0, total: 0 };
              existing.total += marks;
              scoreMap.set(key, existing);
            }
          }
        }

        // Add obtained marks from evaluated results
        for (const result of itemResults) {
          const studentId = result.studentResult.studentId;
          for (const ploId of itemToPlos.get(result.assessmentItemId) ?? []) {
            const existing = scoreMap.get(`${studentId}_${ploId}`);
            if (existing) existing.obtained += result.obtainedMarks;
          }
        }

        // Upsert ploscores + track semester-best per student × PLO
        const upsertOps: Promise<unknown>[] = [];
        for (const [key, score] of scoreMap.entries()) {
          if (score.total === 0) continue;
          const [studentIdStr, ploIdStr] = key.split('_');
          const sId = Number(studentIdStr);
          const pId = Number(ploIdStr);
          const pct = Math.round((score.obtained / score.total) * 1000) / 10;

          // Keep the best percentage across multiple offerings for the same PLO this semester
          const semKey = `${sId}_${pId}`;
          const existingBest = semesterBestPloScores.get(semKey) ?? -1;
          if (pct > existingBest) semesterBestPloScores.set(semKey, pct);

          upsertOps.push(
            prisma.ploscores.upsert({
              where: {
                studentId_courseOfferingId_ploId: {
                  studentId: sId,
                  courseOfferingId: offering.id,
                  ploId: pId,
                },
              },
              update: {
                obtainedMarks: score.obtained,
                totalMarks: score.total,
                percentage: pct,
                semesterName,
                calculatedAt: new Date(),
              },
              create: {
                studentId: sId,
                courseOfferingId: offering.id,
                ploId: pId,
                obtainedMarks: score.obtained,
                totalMarks: score.total,
                percentage: pct,
                semesterName,
              },
            })
          );
        }
        await Promise.all(upsertOps);
        ploScoresSaved += upsertOps.length;
      }
    } catch (scoreError) {
      console.error('[POST_PLO_ATTAINMENTS] ploscores calculation failed:', scoreError);
    }

    // ── Count studentsAchieved per PLO from actual per-student ploscores data ──
    // A student is counted as "achieved" for a PLO if their best score in any
    // course offering this semester meets the PLO attainment threshold.
    const studentsAchievedByPlo = new Map<number, number>(); // ploId → student count
    for (const [key, bestPct] of semesterBestPloScores.entries()) {
      const ploId = Number(key.split('_')[1]);
      if (bestPct >= ploThreshold) {
        studentsAchievedByPlo.set(ploId, (studentsAchievedByPlo.get(ploId) ?? 0) + 1);
      }
    }

    // ── Upsert aggregate PLO attainment records ────────────────────────────────
    const saved = await Promise.all(
      plos.map((plo) => {
        const directAttainment = directByPlo.get(plo.id) ?? 0;
        const indirectRaw = indirectByPlo.get(plo.id);
        const indirectAttainment =
          indirectRaw && indirectRaw.count > 0
            ? Math.round((indirectRaw.sumRating / indirectRaw.count / 5) * 100 * 10) / 10
            : null;

        const attainmentPercent =
          indirectAttainment !== null
            ? directWeight * directAttainment + indirectWeight * indirectAttainment
            : directAttainment;

        // Use actual student count derived from ploscores (not a backwards approximation)
        const studentsAchieved = studentsAchievedByPlo.get(plo.id) ?? 0;

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
            totalStudents,
            studentsAchieved,
            threshold: ploThreshold,
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
            totalStudents,
            studentsAchieved,
            threshold: ploThreshold,
            calculatedBy: auth.user!.userId,
          },
        });
      })
    );

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
