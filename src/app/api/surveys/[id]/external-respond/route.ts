import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Confirm the caller holds this survey's public link token.
 *
 * These two handlers are reachable without a session by design — alumni and
 * employers have no account. What makes that safe is the token: it is 32 random
 * bytes, it is what the invitation email contains, and it is the only thing
 * standing between the survey and the open internet.
 *
 * Neither handler used to check it. The survey id is a small integer in the
 * URL, so anybody could walk `/api/surveys/1/external-respond`,
 * `/2`, `/3` and submit as many responses as they liked to any active alumni
 * or employer survey. Those responses are averaged into indirect PLO
 * attainment, so stuffing them moves the numbers an accreditation review reads.
 */
async function surveyForToken(
  request: NextRequest,
  surveyId: number
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const token = new URL(request.url).searchParams.get('token');

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'A survey link token is required.' },
        { status: 401 }
      ),
    };
  }

  const survey = await prisma.surveys.findUnique({
    where: { id: surveyId },
    select: { publicToken: true },
  });

  // Answering the same 404 whether the survey is missing or the token is wrong
  // keeps this from confirming which survey ids exist.
  if (!survey?.publicToken || survey.publicToken !== token) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Invalid or expired survey link.' },
        { status: 404 }
      ),
    };
  }

  return { ok: true };
}

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
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params;
  try {
    const surveyId = parseInt(params.id);
    if (Number.isNaN(surveyId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid survey id.' },
        { status: 400 }
      );
    }

    const authorised = await surveyForToken(request, surveyId);
    if (!authorised.ok) return authorised.response;

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
  request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params;
  try {
    const surveyId = parseInt(params.id);
    if (Number.isNaN(surveyId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid survey id.' },
        { status: 400 }
      );
    }

    const authorised = await surveyForToken(request, surveyId);
    if (!authorised.ok) return authorised.response;

    const survey = await prisma.surveys.findUnique({
      where: { id: surveyId },
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
