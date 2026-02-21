import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/surveys/[id]
 * Returns a single survey with its questions.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { success, error } = await requireAuth(request);
    if (!success) {
      return NextResponse.json({ success: false, error }, { status: 401 });
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
  { params }: { params: { id: string } }
) {
  try {
    const { success, user, error } = await requireAuth(request);
    if (!success) {
      return NextResponse.json({ success: false, error }, { status: 401 });
    }

    if (user?.role === 'student') {
      return NextResponse.json(
        { success: false, error: 'Students cannot update surveys.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, dueDate, status } = body;

    const survey = await prisma.surveys.update({
      where: { id: parseInt(params.id) },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(status !== undefined && { status }),
      },
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
  { params }: { params: { id: string } }
) {
  try {
    const { success, user, error } = await requireAuth(request);
    if (!success) {
      return NextResponse.json({ success: false, error }, { status: 401 });
    }

    if (user?.role !== 'admin' && user?.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Only admins can delete surveys.' },
        { status: 403 }
      );
    }

    await prisma.surveys.delete({ where: { id: parseInt(params.id) } });

    return NextResponse.json({ success: true, message: 'Survey deleted.' });
  } catch (error) {
    console.error('[DELETE_SURVEY]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete survey.' },
      { status: 500 }
    );
  }
}
