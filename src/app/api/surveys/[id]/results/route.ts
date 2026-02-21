import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/surveys/[id]/results
 * Returns aggregated survey results for admin/faculty.
 * For each question: avg rating, text responses list.
 */
export async function GET(
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
        { success: false, error: 'Students cannot view aggregated results.' },
        { status: 403 }
      );
    }

    const surveyId = parseInt(params.id);

    const survey = await prisma.surveys.findUnique({
      where: { id: surveyId },
      include: {
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

    // Aggregate answers per question
    const questionResults = await Promise.all(
      survey.questions.map(async (q) => {
        const answers = await prisma.survey_answers.findMany({
          where: { questionId: q.id },
          select: { ratingValue: true, textValue: true },
        });

        const ratingAnswers = answers
          .filter((a) => a.ratingValue !== null)
          .map((a) => a.ratingValue as number);

        const avgRating =
          ratingAnswers.length > 0
            ? ratingAnswers.reduce((s, v) => s + v, 0) / ratingAnswers.length
            : null;

        const ratingDistribution =
          q.questionType === 'rating'
            ? [1, 2, 3, 4, 5].map((v) => ({
                rating: v,
                count: ratingAnswers.filter((r) => r === v).length,
              }))
            : null;

        const textAnswers = answers
          .filter((a) => a.textValue && a.textValue.trim() !== '')
          .map((a) => a.textValue as string);

        return {
          questionId: q.id,
          question: q.question,
          questionType: q.questionType,
          plo: q.plo,
          totalAnswers: answers.length,
          avgRating: avgRating !== null ? Math.round(avgRating * 100) / 100 : null,
          ratingDistribution,
          textAnswers,
        };
      })
    );

    // Per-PLO indirect attainment estimate (avg rating / 5 * 100)
    const ploAttainments: { ploCode: string; estimatedAttainment: number }[] = [];
    const ploGroups = new Map<string, number[]>();
    for (const qr of questionResults) {
      if (qr.plo && qr.avgRating !== null) {
        if (!ploGroups.has(qr.plo.code)) ploGroups.set(qr.plo.code, []);
        ploGroups.get(qr.plo.code)!.push(qr.avgRating);
      }
    }
    for (const [code, ratings] of ploGroups.entries()) {
      const avg = ratings.reduce((s, v) => s + v, 0) / ratings.length;
      ploAttainments.push({
        ploCode: code,
        estimatedAttainment: Math.round((avg / 5) * 100 * 10) / 10,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        surveyId,
        surveyTitle: survey.title,
        totalResponses: survey._count.responses,
        questionResults,
        ploAttainments,
      },
    });
  } catch (error) {
    console.error('[SURVEY_RESULTS]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch survey results.' },
      { status: 500 }
    );
  }
}
