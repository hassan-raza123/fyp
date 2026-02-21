import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/surveys/[id]/questions
 * Returns questions for a survey.
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

    const questions = await prisma.survey_questions.findMany({
      where: { surveyId: parseInt(params.id) },
      include: { plo: { select: { id: true, code: true } } },
      orderBy: { orderIndex: 'asc' },
    });

    return NextResponse.json({ success: true, data: questions });
  } catch (error) {
    console.error('[GET_QUESTIONS]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch questions.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/surveys/[id]/questions
 * Add a question to a survey. Admin/Faculty only.
 * Body: { question, questionType, ploId?, orderIndex? }
 */
export async function POST(
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
        { success: false, error: 'Students cannot add questions.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { question, questionType, ploId, orderIndex } = body;

    if (!question || !questionType) {
      return NextResponse.json(
        { success: false, error: 'question and questionType are required.' },
        { status: 400 }
      );
    }

    if (!['rating', 'text'].includes(questionType)) {
      return NextResponse.json(
        { success: false, error: 'questionType must be "rating" or "text".' },
        { status: 400 }
      );
    }

    // Get next order index if not provided
    let nextOrder = orderIndex;
    if (nextOrder === undefined) {
      const last = await prisma.survey_questions.findFirst({
        where: { surveyId: parseInt(params.id) },
        orderBy: { orderIndex: 'desc' },
        select: { orderIndex: true },
      });
      nextOrder = (last?.orderIndex ?? -1) + 1;
    }

    const q = await prisma.survey_questions.create({
      data: {
        surveyId: parseInt(params.id),
        question,
        questionType,
        ploId: ploId ? parseInt(ploId) : null,
        orderIndex: nextOrder,
      },
      include: { plo: { select: { id: true, code: true } } },
    });

    return NextResponse.json({ success: true, data: q });
  } catch (error) {
    console.error('[ADD_QUESTION]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add question.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/surveys/[id]/questions?questionId=X
 * Removes a question from a survey.
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

    if (user?.role === 'student') {
      return NextResponse.json(
        { success: false, error: 'Students cannot delete questions.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('questionId');
    if (!questionId) {
      return NextResponse.json(
        { success: false, error: 'questionId query param is required.' },
        { status: 400 }
      );
    }

    await prisma.survey_questions.delete({ where: { id: parseInt(questionId) } });

    return NextResponse.json({ success: true, message: 'Question deleted.' });
  } catch (error) {
    console.error('[DELETE_QUESTION]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete question.' },
      { status: 500 }
    );
  }
}
