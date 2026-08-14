import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authz';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

/**
 * POST /api/surveys/[id]/respond
 * Student submits answers for a survey.
 * Body: { answers: { questionId, ratingValue?, textValue? }[] }
 */
export async function POST(
  request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params;
  try {
    const { success, user, error } = await requireAuth(request);
    if (!success) {
      return NextResponse.json({ success: false, error }, { status: 401 });
    }

    if (user?.role !== 'student') {
      return NextResponse.json(
        { success: false, error: 'Only students can submit survey responses.' },
        { status: 403 }
      );
    }

    const surveyId = parseInt(params.id);

    // Verify survey exists and is active
    const survey = await prisma.surveys.findUnique({
      where: { id: surveyId },
      select: { id: true, status: true, dueDate: true },
    });

    if (!survey) {
      return NextResponse.json(
        { success: false, error: 'Survey not found.' },
        { status: 404 }
      );
    }

    if (survey.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'This survey is not currently accepting responses.' },
        { status: 400 }
      );
    }

    if (survey.dueDate && new Date() > survey.dueDate) {
      return NextResponse.json(
        { success: false, error: 'This survey has passed its due date.' },
        { status: 400 }
      );
    }

    // Get student ID
    const student = await prisma.students.findFirst({
      where: { userId: user!.userId },
      select: { id: true },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student record not found.' },
        { status: 404 }
      );
    }

    // Check for duplicate submission
    const existing = await prisma.survey_responses.findUnique({
      where: { surveyId_studentId: { surveyId, studentId: student.id } },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'You have already submitted this survey.' },
        { status: 409 }
      );
    }

    const body = await request.json();
    const { answers } = body as {
      answers: { questionId: number; ratingValue?: number; textValue?: string }[];
    };

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'answers array is required.' },
        { status: 400 }
      );
    }

    // Validate each rating against its own question's scale, so a survey using
    // a scale other than 1-5 is neither wrongly rejected nor silently accepted.
    const questionScales = new Map(
      (
        await prisma.survey_questions.findMany({
          where: { surveyId: survey.id },
          select: { id: true, ratingScale: true },
        })
      ).map((q) => [q.id, q.ratingScale])
    );

    for (const a of answers) {
      if (a.ratingValue === undefined || a.ratingValue === null) continue;
      const scale = questionScales.get(a.questionId);
      if (scale === undefined) {
        return NextResponse.json(
          { success: false, error: `Question ${a.questionId} does not belong to this survey.` },
          { status: 400 }
        );
      }
      if (a.ratingValue < 1 || a.ratingValue > scale) {
        return NextResponse.json(
          { success: false, error: `Rating for question ${a.questionId} must be between 1 and ${scale}.` },
          { status: 400 }
        );
      }
    }

    // Create response + answers in a transaction
    const response = await prisma.$transaction(async (tx) => {
      const resp = await tx.survey_responses.create({
        data: {
          surveyId,
          studentId: student.id,
        },
      });

      await tx.survey_answers.createMany({
        data: answers.map((a) => ({
          responseId: resp.id,
          questionId: a.questionId,
          ratingValue: a.ratingValue ?? null,
          textValue: a.textValue ?? null,
        })),
      });

      return resp;
    });

    return NextResponse.json({
      success: true,
      message: 'Survey submitted successfully. Thank you for your feedback!',
      data: { responseId: response.id },
    });
  } catch (error) {
    console.error('[SUBMIT_SURVEY]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit survey response.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/surveys/[id]/respond
 * Check if current student has already responded.
 */
export async function GET(
  request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params;
  try {
    // Answering is a student action; the student is resolved from the session
    // below, so there is no id here to authorise beyond the role.
    const auth = await authorize(request, ['student']);
    if (!auth.ok) return auth.response;
    const user = auth.user;

    const student = await prisma.students.findFirst({
      where: { userId: user.userId },
      select: { id: true },
    });

    if (!student) {
      return NextResponse.json({ success: true, data: { hasResponded: false } });
    }

    const existing = await prisma.survey_responses.findUnique({
      where: {
        surveyId_studentId: {
          surveyId: parseInt(params.id),
          studentId: student.id,
        },
      },
      select: { id: true, submittedAt: true },
    });

    return NextResponse.json({
      success: true,
      data: { hasResponded: !!existing, submittedAt: existing?.submittedAt ?? null },
    });
  } catch (error) {
    console.error('[CHECK_RESPONSE]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check response status.' },
      { status: 500 }
    );
  }
}
