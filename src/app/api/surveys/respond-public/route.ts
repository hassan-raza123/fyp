import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/surveys/respond-public?token=xxx
// Returns survey questions for a public (no-auth) respondent
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const survey = await prisma.surveys.findUnique({
      where: { publicToken: token },
      include: {
        questions: {
          include: {
            plo: { select: { id: true, code: true, description: true } },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!survey) {
      return NextResponse.json({ error: 'Invalid or expired survey link' }, { status: 404 });
    }

    if (survey.status !== 'active') {
      return NextResponse.json(
        { error: 'This survey is not currently accepting responses' },
        { status: 400 }
      );
    }

    if (survey.dueDate && new Date() > survey.dueDate) {
      return NextResponse.json({ error: 'This survey has expired' }, { status: 400 });
    }

    return NextResponse.json({
      id: survey.id,
      title: survey.title,
      description: survey.description,
      type: survey.type,
      dueDate: survey.dueDate,
      questions: survey.questions,
    });
  } catch (error) {
    console.error('Error fetching public survey:', error);
    return NextResponse.json({ error: 'Failed to fetch survey' }, { status: 500 });
  }
}

// POST /api/surveys/respond-public
// Submit anonymous response (alumni/employer — no student account needed)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, respondentName, respondentEmail, answers } = body;

    if (!token || !answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { error: 'token and answers are required' },
        { status: 400 }
      );
    }

    const survey = await prisma.surveys.findUnique({
      where: { publicToken: token },
      select: { id: true, status: true, dueDate: true },
    });

    if (!survey) {
      return NextResponse.json({ error: 'Invalid survey token' }, { status: 404 });
    }

    if (survey.status !== 'active') {
      return NextResponse.json({ error: 'Survey is not accepting responses' }, { status: 400 });
    }

    if (survey.dueDate && new Date() > survey.dueDate) {
      return NextResponse.json({ error: 'Survey deadline has passed' }, { status: 400 });
    }

    // Create anonymous response (no studentId)
    const response = await prisma.survey_responses.create({
      data: {
        surveyId: survey.id,
        studentId: null,
        respondentName: respondentName?.trim() || null,
        respondentEmail: respondentEmail?.trim().toLowerCase() || null,
        answers: {
          create: answers.map(
            (a: { questionId: number; ratingValue?: number; textValue?: string }) => ({
              questionId: a.questionId,
              ratingValue: a.ratingValue ?? null,
              textValue: a.textValue?.trim() || null,
            })
          ),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you for your response!',
      responseId: response.id,
    });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'A response from this email already exists for this survey' },
        { status: 409 }
      );
    }
    console.error('Error submitting public survey response:', error);
    return NextResponse.json({ error: 'Failed to submit response' }, { status: 500 });
  }
}
