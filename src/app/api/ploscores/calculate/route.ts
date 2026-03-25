import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

/**
 * POST /api/ploscores/calculate
 *
 * Calculates and saves per-student PLO scores for every course offering
 * in a given program + semester. This populates the `ploscores` table which
 * the graduation tracker and student graduation-status routes depend on.
 *
 * Must be called AFTER CLO/LLO attainments have been calculated, because
 * it reads studentassessmentitemresults that are evaluated/published.
 *
 * Body: { programId: number, semesterId: number }
 */
export async function POST(request: NextRequest) {
  try {
    const { success, user, error } = await requireAuth(request);
    if (!success || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Admins only' }, { status: 403 });
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

    const semesterRecord = await prisma.semesters.findUnique({
      where: { id: sid },
      select: { name: true },
    });

    if (!semesterRecord) {
      return NextResponse.json({ error: 'Semester not found' }, { status: 404 });
    }

    const semesterName = semesterRecord.name;

    // Get all course offerings for this program + semester
    const courseOfferings = await prisma.courseofferings.findMany({
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
              include: {
                ploMappings: { select: { ploId: true, weight: true } },
              },
            },
            llos: {
              where: { status: 'active' },
              include: {
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

    let totalSaved = 0;

    for (const offering of courseOfferings) {
      // Build map: assessmentItemId → set of ploIds (via clo or llo mapping)
      const cloToPlos = new Map<number, number[]>();
      for (const clo of offering.course.clos) {
        cloToPlos.set(clo.id, clo.ploMappings.map((m) => m.ploId));
      }

      const lloToPlos = new Map<number, number[]>();
      for (const llo of offering.course.llos) {
        lloToPlos.set(llo.id, llo.ploMappings.map((m) => m.ploId));
      }

      // Collect all assessment items and their PLO mappings
      const itemToPlos = new Map<number, number[]>(); // itemId → ploIds
      const itemMarks = new Map<number, number>();     // itemId → max marks

      for (const assessment of offering.assessments) {
        for (const item of assessment.assessmentItems) {
          itemMarks.set(item.id, item.marks);
          const ploIds: number[] = [];
          if (item.cloId !== null) {
            const mapped = cloToPlos.get(item.cloId) ?? [];
            ploIds.push(...mapped);
          }
          if (item.lloId !== null) {
            const mapped = lloToPlos.get(item.lloId) ?? [];
            ploIds.push(...mapped);
          }
          if (ploIds.length > 0) {
            itemToPlos.set(item.id, ploIds);
          }
        }
      }

      if (itemToPlos.size === 0) continue; // No mapped items in this offering

      // Collect all unique student IDs enrolled in this offering's sections
      const studentIdSet = new Set<number>();
      for (const section of offering.sections) {
        for (const ss of section.studentsections) {
          studentIdSet.add(ss.studentId);
        }
      }

      if (studentIdSet.size === 0) continue;

      const studentIds = Array.from(studentIdSet);
      const allItemIds = Array.from(itemToPlos.keys());

      // Fetch student item results (evaluated or published only)
      const itemResults = await prisma.studentassessmentitemresults.findMany({
        where: {
          assessmentItemId: { in: allItemIds },
          studentResult: {
            studentId: { in: studentIds },
            status: { in: ['evaluated', 'published'] },
          },
        },
        select: {
          assessmentItemId: true,
          obtainedMarks: true,
          studentResult: { select: { studentId: true } },
        },
      });

      // Aggregate per student per PLO: { obtained, total }
      // Map key: `${studentId}_${ploId}`
      const scoreMap = new Map<string, { obtained: number; total: number }>();

      // First seed total marks from all mapped items for each student × PLO
      for (const studentId of studentIds) {
        for (const [itemId, ploIds] of itemToPlos.entries()) {
          const marks = itemMarks.get(itemId) ?? 0;
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
        const ploIds = itemToPlos.get(result.assessmentItemId) ?? [];
        for (const ploId of ploIds) {
          const key = `${studentId}_${ploId}`;
          const existing = scoreMap.get(key);
          if (existing) {
            existing.obtained += result.obtainedMarks;
          }
        }
      }

      // Upsert ploscores for each student × PLO combination that has total > 0
      const upsertOps: Promise<unknown>[] = [];
      for (const [key, score] of scoreMap.entries()) {
        if (score.total === 0) continue;
        const [studentIdStr, ploIdStr] = key.split('_');
        const studentId = Number(studentIdStr);
        const ploId = Number(ploIdStr);
        const percentage = Math.round((score.obtained / score.total) * 1000) / 10;

        upsertOps.push(
          prisma.ploscores.upsert({
            where: {
              studentId_courseOfferingId_ploId: {
                studentId,
                courseOfferingId: offering.id,
                ploId,
              },
            },
            update: {
              obtainedMarks: score.obtained,
              totalMarks: score.total,
              percentage,
              semesterName,
              calculatedAt: new Date(),
            },
            create: {
              studentId,
              courseOfferingId: offering.id,
              ploId,
              obtainedMarks: score.obtained,
              totalMarks: score.total,
              percentage,
              semesterName,
            },
          })
        );
      }

      await Promise.all(upsertOps);
      totalSaved += upsertOps.length;
    }

    return NextResponse.json({
      success: true,
      message: `PLO scores calculated and saved for ${totalSaved} student-PLO record(s) across ${courseOfferings.length} course offering(s).`,
      data: { totalSaved, courseOfferingsProcessed: courseOfferings.length },
    });
  } catch (error) {
    console.error('[POST_PLOSCORES_CALCULATE]', error);
    return NextResponse.json(
      { error: 'Failed to calculate PLO scores' },
      { status: 500 }
    );
  }
}
