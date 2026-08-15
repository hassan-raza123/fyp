import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize, canAccessSurvey, forbiddenResponse } from '@/lib/authz';

/**
 * GET /api/surveys/[id]/results
 * Returns aggregated survey results for admin/faculty.
 * For each question: avg rating, text responses list.
 */
export async function GET(
  request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params;
  try {
    const auth = await authorize(request, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;

    const surveyId = parseInt(params.id);

    // Aggregated results are the indirect half of PLO attainment. Reading
    // another department's is a cross-tenant read of an accreditation figure.
    if (!(await canAccessSurvey(request, auth.user, surveyId))) {
      return forbiddenResponse();
    }

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
          ratingScale: q.ratingScale,
          plo: q.plo,
          totalAnswers: answers.length,
          avgRating: avgRating !== null ? Math.round(avgRating * 100) / 100 : null,
          ratingDistribution,
          textAnswers,
        };
      })
    );

    // Per-PLO indirect attainment estimate. Each question is normalised by its
    // own rating scale before averaging, so questions on different scales can be
    // grouped under the same PLO without distorting the result.
    const ploAttainments: { ploCode: string; estimatedAttainment: number }[] = [];
    const ploGroups = new Map<string, number[]>();
    for (const qr of questionResults) {
      if (qr.plo && qr.avgRating !== null) {
        if (!ploGroups.has(qr.plo.code)) ploGroups.set(qr.plo.code, []);
        const scale = qr.ratingScale > 0 ? qr.ratingScale : 5;
        ploGroups.get(qr.plo.code)!.push((qr.avgRating / scale) * 100);
      }
    }
    for (const [code, percents] of ploGroups.entries()) {
      const avg = percents.reduce((s, v) => s + v, 0) / percents.length;
      ploAttainments.push({
        ploCode: code,
        estimatedAttainment: Math.round(avg * 10) / 10,
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
