import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import {
  authorize,
  canAccessCourse,
  canManageCourseOffering,
  assertResultsUnlocked,
  forbidden,
  forbiddenResponse,
} from '@/lib/authz';
import { writeAuditLog } from '@/lib/audit-log';
import { TokenPayload } from '@/types/auth';

/**
 * Resolve the assessment and confirm the caller may manage its course offering.
 * Returns either the offering id or the response to send back.
 */
async function requireAssessmentAccess(
  request: NextRequest,
  user: TokenPayload,
  assessmentId: number
): Promise<{ ok: true; courseOfferingId: number } | { ok: false; response: NextResponse }> {
  const assessment = await prisma.assessments.findUnique({
    where: { id: assessmentId },
    select: { courseOfferingId: true },
  });

  if (!assessment) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      ),
    };
  }

  if (
    !(await canManageCourseOffering(request, user, assessment.courseOfferingId))
  ) {
    return {
      ok: false,
      response: forbidden('You do not have access to this course offering')
        .response,
    };
  }

  return { ok: true, courseOfferingId: assessment.courseOfferingId };
}

export async function PUT(
  request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params;
  try {
    const auth = await authorize(request, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;

    const access = await requireAssessmentAccess(
      request,
      auth.user,
      parseInt(params.id)
    );
    if (!access.ok) return access.response;

    const body = await request.json();
    const { title, description, dueDate, totalMarks, instructions, weightage } = body;

    // If weightage is being changed, validate the new total won't exceed 100
    if (weightage !== undefined) {
      const current = await prisma.assessments.findUnique({
        where: { id: parseInt(params.id) },
        select: { courseOfferingId: true, weightage: true },
      });
      if (current) {
        const existingWeightage = await prisma.assessments.aggregate({
          where: {
            courseOfferingId: current.courseOfferingId,
            status: { not: 'cancelled' },
            id: { not: parseInt(params.id) }, // exclude current assessment
          },
          _sum: { weightage: true },
        });
        const otherWeightage = existingWeightage._sum.weightage ?? 0;
        if (otherWeightage + Number(weightage) > 100) {
          return NextResponse.json(
            {
              error: `Total weightage would exceed 100%. Other assessments use: ${otherWeightage}%. Available: ${(100 - otherWeightage).toFixed(1)}%`,
              usedWeightage: otherWeightage,
              remainingWeightage: 100 - otherWeightage,
            },
            { status: 400 }
          );
        }
      }
    }

    const assessment = await prisma.assessments.update({
      where: {
        id: parseInt(params.id),
      },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(dueDate !== undefined && { dueDate: new Date(dueDate) }),
        ...(totalMarks !== undefined && { totalMarks: parseInt(totalMarks) }),
        ...(instructions !== undefined && { instructions }),
        ...(weightage !== undefined && { weightage: Number(weightage) }),
      },
    });

    return NextResponse.json(assessment);
  } catch (error) {
    console.error('[ASSESSMENT_UPDATE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params;
  try {
    const auth = await authorize(request, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;

    const access = await requireAssessmentAccess(
      request,
      auth.user,
      parseInt(params.id)
    );
    if (!access.ok) return access.response;

    const body = await request.json();
    const { status } = body;

    const validStatuses = ['active', 'draft', 'completed', 'evaluated', 'published', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Status is required and must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const assessment = await prisma.assessments.update({
      where: {
        id: parseInt(params.id),
      },
      data: {
        status: status as any,
      },
    });

    return NextResponse.json(assessment);
  } catch (error) {
    console.error('[ASSESSMENT_STATUS_UPDATE]', error);
    return NextResponse.json(
      { error: 'Failed to update assessment status' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params;
  try {
    const auth = await authorize(request, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;

    const assessmentId = parseInt(params.id);

    const access = await requireAssessmentAccess(
      request,
      auth.user,
      assessmentId
    );
    if (!access.ok) return access.response;

    // This cascade destroys every student's marks for the assessment, so it is
    // blocked once the offering's results are locked.
    const locked = await assertResultsUnlocked(
      auth.user,
      access.courseOfferingId
    );
    if (locked) return locked;

    // Get all assessment item IDs for this assessment
    const items = await prisma.assessmentitems.findMany({
      where: { assessmentId },
      select: { id: true },
    });
    const itemIds = items.map((i) => i.id);

    // Capture what is about to be destroyed, for the audit trail
    const destroyedResults = await prisma.studentassessmentresults.count({
      where: { assessmentId },
    });

    // Delete in correct cascade order within a transaction
    await prisma.$transaction([
      // 1. Delete student assessment item results
      prisma.studentassessmentitemresults.deleteMany({
        where: { assessmentItemId: { in: itemIds } },
      }),
      // 2. Delete student assessment results
      prisma.studentassessmentresults.deleteMany({
        where: { assessmentId },
      }),
      // 3. Delete assessment items
      prisma.assessmentitems.deleteMany({
        where: { assessmentId },
      }),
      // 4. Delete the assessment
      prisma.assessments.delete({
        where: { id: assessmentId },
      }),
    ]);

    await writeAuditLog(request, auth.user, 'result.delete', {
      assessmentId,
      courseOfferingId: access.courseOfferingId,
      deletedItemCount: itemIds.length,
      deletedStudentResultCount: destroyedResults,
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[ASSESSMENT_DELETE]', error);
    return NextResponse.json(
      { error: 'Failed to delete assessment' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params;
  try {
    // A student reads the assessment for a course they are enrolled in, so the
    // gate is ownership rather than role. `canAccessCourse` is the read-side
    // rule: staff by department, a student by enrolment.
    const auth = await authorize(request as unknown as NextRequest, [
      'super_admin',
      'admin',
      'faculty',
      'student',
    ]);
    if (!auth.ok) return auth.response;

    const owning = await prisma.assessments.findUnique({
      where: { id: parseInt(params.id) },
      select: { courseOffering: { select: { courseId: true } } },
    });

    if (!owning) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    if (
      !(await canAccessCourse(
        request as unknown as NextRequest,
        auth.user,
        owning.courseOffering.courseId
      ))
    ) {
      return forbiddenResponse();
    }

    const assessment = await prisma.assessments.findUnique({
      where: {
        id: parseInt(params.id),
      },
      include: {
        assessmentItems: {
          include: {
            clo: {
              select: {
                id: true,
                code: true,
                description: true,
              },
            },
            llo: {
              select: {
                id: true,
                code: true,
                description: true,
              },
            },
          },
          orderBy: {
            questionNo: 'asc',
          },
        },
        courseOffering: {
          include: {
            course: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
            semester: {
              select: {
                name: true,
              },
            },
            sections: {
              where: {
                status: 'active',
              },
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(assessment);
  } catch (error) {
    console.error('[ASSESSMENT_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
