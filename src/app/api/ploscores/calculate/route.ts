import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/authz';
import { writeAuditLog } from '@/lib/audit-log';
import { computePloScoresForOffering, savePloScores } from '@/lib/obe';

/**
 * POST /api/ploscores/calculate
 *
 * Calculates and saves per-student PLO scores for every course offering
 * in a given program + semester. This populates the `ploscores` table which
 * the graduation tracker and student graduation-status routes depend on.
 *
 * Must be called AFTER marks have been evaluated, because it reads
 * studentassessmentitemresults with status evaluated/published.
 *
 * The calculation itself lives in `lib/obe.ts` and is shared with
 * POST /api/plo-attainments, so the two endpoints can never disagree.
 *
 * Body: { programId: number, semesterId: number }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authorize(request, ['super_admin', 'admin']);
    if (!auth.ok) return auth.response;

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

    let totalSaved = 0;

    for (const offering of courseOfferings) {
      const records = await computePloScoresForOffering(offering);
      if (records.length === 0) continue;
      totalSaved += await savePloScores(records, semesterRecord.name);
    }

    await writeAuditLog(request, auth.user, 'attainment.plo_calculate', {
      scope: 'ploscores',
      programId: pid,
      semesterId: sid,
      recordsSaved: totalSaved,
      courseOfferingsProcessed: courseOfferings.length,
    });

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
