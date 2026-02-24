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

// ── Shared helper: accumulate indirect ratings from a list of surveys ────────
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

    // Fetch PLOs with BOTH CLO and LLO mappings + their attainments for the semester
    const plos = await prisma.plos.findMany({
      where: {
        programId: Number(programId),
        status: plo_status.active,
      },
      include: {
        cloMappings: {
          include: {
            clo: {
              include: {
                closAttainments: {
                  where: {
                    courseOffering: {
                      semesterId: Number(semesterId),
                    },
                  },
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
                  where: {
                    courseOffering: {
                      semesterId: Number(semesterId),
                    },
                  },
                  orderBy: { calculatedAt: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    // --- DIRECT ATTAINMENT: weighted average of CLO + LLO attainments ---
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
      const directAttainment = totalWeight > 0 ? weightedSum / totalWeight : 0;

      directAttainmentByPlo.set(plo.id, {
        attainment: directAttainment,
        contributingClos,
        contributingLlos,
      });
    }

    // --- INDIRECT ATTAINMENT: course-exit surveys + program-level surveys ---
    const courseOfferings = await prisma.courseofferings.findMany({
      where: {
        semesterId: Number(semesterId),
        course: {
          programs: { some: { id: Number(programId) } },
        },
      },
      select: { id: true },
    });

    const offeringIds = courseOfferings.map((co) => co.id);
    const indirectByPlo = new Map<number, { sumRating: number; count: number }>();

    if (offeringIds.length > 0) {
      const courseExitSurveys = await prisma.surveys.findMany({
        where: {
          courseOfferingId: { in: offeringIds },
          status: 'closed',
        },
        include: {
          questions: {
            where: { ploId: { not: null } },
            include: { answers: { select: { ratingValue: true } } },
          },
          _count: { select: { responses: true } },
        },
      });
      accumulateSurveyRatings(courseExitSurveys, indirectByPlo);
    }

    // Program-level surveys: program_exit, alumni, employer
    const programLevelSurveys = await prisma.surveys.findMany({
      where: {
        programId: Number(programId),
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
    accumulateSurveyRatings(programLevelSurveys, indirectByPlo);

    // Convert indirect Map to percentage (rating/5 * 100)
    const indirectAttainmentByPloId = new Map<number, number>();
    for (const [ploId, data] of indirectByPlo.entries()) {
      const avgRating = data.count > 0 ? data.sumRating / data.count : 0;
      indirectAttainmentByPloId.set(ploId, Math.round((avgRating / 5) * 100 * 10) / 10);
    }

    // --- Fetch program-level direct/indirect weights ---
    const graduationCriteria = await prisma.graduation_criteria.findUnique({
      where: { programId: Number(programId) },
      select: { directWeight: true, indirectWeight: true },
    });
    const directWeight = graduationCriteria?.directWeight ?? 0.7;
    const indirectWeight = graduationCriteria?.indirectWeight ?? 0.3;

    // --- COMBINE ---
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

// POST - Persist PLO attainments + calculate individual student PLO scores (ploscores)
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

    // ── Fetch PLOs with CLO + LLO attainments ─────────────────────────────────
    const plos = await prisma.plos.findMany({
      where: { programId: Number(programId), status: plo_status.active },
      include: {
        cloMappings: {
          include: {
            clo: {
              include: {
                closAttainments: {
                  where: { courseOffering: { semesterId: Number(semesterId) } },
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
                  where: { courseOffering: { semesterId: Number(semesterId) } },
                  orderBy: { calculatedAt: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    // ── Direct attainment ─────────────────────────────────────────────────────
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

    // ── Indirect attainment: course-exit + program-level surveys ──────────────
    const courseOfferings = await prisma.courseofferings.findMany({
      where: {
        semesterId: Number(semesterId),
        course: { programs: { some: { id: Number(programId) } } },
      },
      select: { id: true },
    });
    const offeringIds = courseOfferings.map((co) => co.id);
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
      accumulateSurveyRatings(courseExitSurveys, indirectByPlo);
    }

    const programLevelSurveys = await prisma.surveys.findMany({
      where: {
        programId: Number(programId),
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
    accumulateSurveyRatings(programLevelSurveys, indirectByPlo);

    // ── Graduation criteria weights + PLO threshold ────────────────────────────
    const graduationCriteria = await prisma.graduation_criteria.findUnique({
      where: { programId: Number(programId) },
      select: { directWeight: true, indirectWeight: true, minPloAttainmentPercent: true },
    });
    const directWeight = graduationCriteria?.directWeight ?? 0.7;
    const indirectWeight = graduationCriteria?.indirectWeight ?? 0.3;
    const ploThreshold = graduationCriteria?.minPloAttainmentPercent ?? 50;

    // ── Count total enrolled students ─────────────────────────────────────────
    const enrolledStudentSections = await prisma.studentsections.findMany({
      where: {
        status: 'active',
        student: { programId: Number(programId) },
        section: { courseOffering: { semesterId: Number(semesterId) } },
      },
      select: { studentId: true },
    });
    const totalStudents = new Set(enrolledStudentSections.map((ss) => ss.studentId)).size;

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

        const studentsAchieved =
          totalStudents > 0 ? Math.round((attainmentPercent / 100) * totalStudents) : 0;

        return prisma.ploattainments.upsert({
          where: {
            ploId_programId_semesterId: {
              ploId: plo.id,
              programId: Number(programId),
              semesterId: Number(semesterId),
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
            programId: Number(programId),
            semesterId: Number(semesterId),
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

    // ── Calculate and save individual student PLO scores (ploscores) ──────────
    // The graduation tracker reads ploscores to determine per-student eligibility.
    let ploScoresSaved = 0;
    try {
      const semesterRecord = await prisma.semesters.findUnique({
        where: { id: Number(semesterId) },
        select: { name: true },
      });
      const semesterName = semesterRecord?.name ?? '';

      const allOfferings = await prisma.courseofferings.findMany({
        where: {
          semesterId: Number(semesterId),
          course: { programs: { some: { id: Number(programId) } } },
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

      for (const offering of allOfferings) {
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

        // Seed score map with total marks per student × PLO
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

        // Add obtained marks from actual results
        for (const result of itemResults) {
          const studentId = result.studentResult.studentId;
          for (const ploId of itemToPlos.get(result.assessmentItemId) ?? []) {
            const existing = scoreMap.get(`${studentId}_${ploId}`);
            if (existing) existing.obtained += result.obtainedMarks;
          }
        }

        // Upsert ploscores
        const upsertOps: Promise<unknown>[] = [];
        for (const [key, score] of scoreMap.entries()) {
          if (score.total === 0) continue;
          const [studentIdStr, ploIdStr] = key.split('_');
          const sId = Number(studentIdStr);
          const pId = Number(ploIdStr);
          const pct = Math.round((score.obtained / score.total) * 1000) / 10;
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
