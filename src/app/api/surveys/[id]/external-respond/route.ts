import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/surveys/[id]/external-respond
 * Alumni or employer submits answers — no login required.
 * Body: {
 *   respondentName: string,
 *   respondentEmail: string,
 *   answers: { questionId, ratingValue?, textValue? }[]
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const surveyId = parseInt(params.id);

    const survey = await prisma.surveys.findUnique({
      where: { id: surveyId },
      select: { id: true, status: true, dueDate: true, type: true },
    });

    if (!survey) {
      return NextResponse.json({ success: false, error: 'Survey not found.' }, { status: 404 });
    }

    if (!['alumni', 'employer'].includes(survey.type)) {
      return NextResponse.json(
        { success: false, error: 'This endpoint is only for alumni or employer surveys.' },
        { status: 400 }
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

    const body = await request.json();
    const { respondentName, respondentEmail, answers } = body as {
      respondentName: string;
      respondentEmail: string;
      answers: { questionId: number; ratingValue?: number; textValue?: string }[];
    };

    if (!respondentName?.trim() || !respondentEmail?.trim()) {
      return NextResponse.json(
        { success: false, error: 'respondentName and respondentEmail are required.' },
        { status: 400 }
      );
    }

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'answers array is required.' },
        { status: 400 }
      );
    }

    // Validate ratings
    for (const a of answers) {
      if (a.ratingValue !== undefined && (a.ratingValue < 1 || a.ratingValue > 5)) {
        return NextResponse.json(
          { success: false, error: `Rating for question ${a.questionId} must be between 1 and 5.` },
          { status: 400 }
        );
      }
    }

    // Check for duplicate submission by email
    const existing = await prisma.survey_responses.findFirst({
      where: { surveyId, respondentEmail: respondentEmail.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A response from this email has already been submitted.' },
        { status: 409 }
      );
    }

    const response = await prisma.$transaction(async (tx) => {
      const resp = await tx.survey_responses.create({
        data: {
          surveyId,
          studentId: null,
          respondentName: respondentName.trim(),
          respondentEmail: respondentEmail.toLowerCase().trim(),
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
      message: 'Thank you for your feedback!',
      data: { responseId: response.id },
    });
  } catch (error) {
    console.error('[EXTERNAL_SURVEY_RESPOND]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit survey response.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/surveys/[id]/external-respond
 * Returns the survey details + questions for public display (no auth needed).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const survey = await prisma.surveys.findUnique({
      where: { id: parseInt(params.id) },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        status: true,
        dueDate: true,
        program: { select: { name: true, code: true } },
        questions: {
          select: {
            id: true,
            question: true,
            questionType: true,
            orderIndex: true,
            plo: { select: { code: true } },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!survey) {
      return NextResponse.json({ success: false, error: 'Survey not found.' }, { status: 404 });
    }

    if (!['alumni', 'employer'].includes(survey.type)) {
      return NextResponse.json(
        { success: false, error: 'This survey is not publicly accessible.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: survey });
  } catch (error) {
    console.error('[GET_EXTERNAL_SURVEY]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch survey.' },
      { status: 500 }
    );
  }
}
