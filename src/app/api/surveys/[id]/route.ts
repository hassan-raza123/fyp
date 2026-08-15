import { NextRequest, NextResponse } from 'next/server';
import { authorize, canAccessSurvey, forbiddenResponse } from '@/lib/authz';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit-log';

/**
 * GET /api/surveys/[id]
 * Returns a single survey with its questions.
 */
export async function GET(
  request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params;
  try {
    // Survey definitions are staff configuration. Respondents reach a survey
    // through the token-authenticated public routes, not this one.
    const auth = await authorize(request, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;

    // Being staff is not a claim on every department's surveys.
    if (!(await canAccessSurvey(request, auth.user, parseInt(params.id)))) {
      return forbiddenResponse();
    }

    const survey = await prisma.surveys.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        courseOffering: {
          include: {
            course: { select: { code: true, name: true } },
            semester: { select: { name: true } },
          },
        },
        questions: {
          include: { plo: { select: { id: true, code: true } } },
          orderBy: { orderIndex: 'asc' },
        },
        _count: { select: { responses: true } },
      },
    });

    if (!survey) {
      return NextResponse.json(
        { success: false, error: 'Survey not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: survey });
  } catch (error) {
    console.error('[GET_SURVEY]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch survey.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/surveys/[id]
 * Update survey title, description, dueDate, or status.
 * Only admin/faculty who created it can update.
 */
export async function PATCH(
  request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params;
  try {
    const auth = await authorize(request, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;

    if (!(await canAccessSurvey(request, auth.user, parseInt(params.id)))) {
      return forbiddenResponse();
    }

    const body = await request.json();
    const { title, description, type, dueDate, status } = body;

    // Validate status transition if status is being changed
    if (status !== undefined) {
      const validStatuses = ['draft', 'active', 'closed'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }

      const currentSurvey = await prisma.surveys.findUnique({
        where: { id: parseInt(params.id) },
        select: { status: true },
      });

      if (currentSurvey) {
        const allowedTransitions: Record<string, string[]> = {
          draft: ['active'],
          active: ['closed'],
          closed: [], // closed surveys cannot be reopened
        };
        const allowed = allowedTransitions[currentSurvey.status] || [];
        if (!allowed.includes(status)) {
          return NextResponse.json(
            { success: false, error: `Cannot transition from '${currentSurvey.status}' to '${status}'. Allowed transitions: ${allowed.length > 0 ? allowed.join(', ') : 'none'}` },
            { status: 400 }
          );
        }
      }
    }

    const survey = await prisma.surveys.update({
      where: { id: parseInt(params.id) },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(type !== undefined && { type }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(status !== undefined && { status }),
      },
    });

    await writeAuditLog(request, auth.user, 'survey.update', {
      surveyId: parseInt(params.id),
      changed: { title, description, type, dueDate, status },
    });

    return NextResponse.json({ success: true, data: survey });
  } catch (error) {
    console.error('[UPDATE_SURVEY]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update survey.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/surveys/[id]
 * Only admins can delete a survey.
 */
export async function DELETE(
  request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params;
  try {
    const auth = await authorize(request, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;
    const user = auth.user;

    // Ownership first: creator-or-admin decides *which staff member* may
    // delete it, but only once we know the survey is in their department at
    // all. Without this a foreign admin satisfied `isAdmin` and deleted it.
    if (!(await canAccessSurvey(request, user, parseInt(params.id)))) {
      return forbiddenResponse();
    }

    // Check if faculty created this survey (allow creator to delete their own)
    const surveyToDelete = await prisma.surveys.findUnique({
      where: { id: parseInt(params.id) },
      select: { createdBy: true },
    });

    if (!surveyToDelete) {
      return NextResponse.json({ success: false, error: 'Survey not found.' }, { status: 404 });
    }

    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    const isCreator = surveyToDelete.createdBy === user.userId;

    if (!isAdmin && !isCreator) {
      return NextResponse.json(
        { success: false, error: 'Only admins or the survey creator can delete surveys.' },
        { status: 403 }
      );
    }

    // Deleting a survey destroys its responses, which are the indirect half of
    // PLO attainment.
    const doomed = await prisma.surveys.findUnique({
      where: { id: parseInt(params.id) },
      select: {
        title: true,
        type: true,
        programId: true,
        courseOfferingId: true,
        _count: { select: { responses: true } },
      },
    });

    await prisma.surveys.delete({ where: { id: parseInt(params.id) } });

    await writeAuditLog(request, user, 'survey.delete', {
      surveyId: parseInt(params.id),
      title: doomed?.title,
      type: doomed?.type,
      programId: doomed?.programId,
      courseOfferingId: doomed?.courseOfferingId,
      responsesDestroyed: doomed?._count.responses,
    });

    return NextResponse.json({ success: true, message: 'Survey deleted.' });
  } catch (error) {
    console.error('[DELETE_SURVEY]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete survey.' },
      { status: 500 }
    );
  }
}
