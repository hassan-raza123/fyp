import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  authorize,
  canManageCourseOffering,
  assertResultsUnlocked,
  forbidden,
} from '@/lib/authz';
import { writeAuditLog } from '@/lib/audit-log';
import { scoreFromRubric, type RubricCriterionScore } from '@/lib/obe';

/**
 * Score one assessment item using its rubric.
 *
 * PATCH body:
 *   { assessmentItemId: number,
 *     scores: [{ criterionId, level, comment? }] }
 *
 * The item's mark is derived from the rubric levels rather than entered
 * separately, so the recorded breakdown and the awarded mark can never
 * contradict each other. Rubrics were previously stored but never applied to
 * any mark.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorize(request, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const resultId = parseInt(id);
    if (Number.isNaN(resultId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid result ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { assessmentItemId, scores } = body as {
      assessmentItemId: number;
      scores: RubricCriterionScore[];
    };

    if (!assessmentItemId || !Array.isArray(scores) || scores.length === 0) {
      return NextResponse.json(
        { success: false, error: 'assessmentItemId and a non-empty scores array are required' },
        { status: 400 }
      );
    }

    const result = await prisma.studentassessmentresults.findUnique({
      where: { id: resultId },
      select: {
        id: true,
        studentId: true,
        assessmentId: true,
        assessment: { select: { courseOfferingId: true } },
      },
    });

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Result not found' },
        { status: 404 }
      );
    }

    const offeringId = result.assessment.courseOfferingId;

    if (!(await canManageCourseOffering(request, auth.user, offeringId))) {
      return forbidden('You do not have access to this course offering').response;
    }

    const locked = await assertResultsUnlocked(auth.user, offeringId);
    if (locked) return locked;

    const item = await prisma.assessmentitems.findUnique({
      where: { id: assessmentItemId },
      select: {
        id: true,
        marks: true,
        assessmentId: true,
        rubric: { select: { id: true, criteria: { select: { id: true, weight: true } } } },
      },
    });

    if (!item || item.assessmentId !== result.assessmentId) {
      return NextResponse.json(
        { success: false, error: 'Assessment item does not belong to this result' },
        { status: 400 }
      );
    }

    if (!item.rubric) {
      return NextResponse.json(
        { success: false, error: 'This assessment item has no rubric attached' },
        { status: 400 }
      );
    }

    const validCriterionIds = new Set(item.rubric.criteria.map((c) => c.id));
    const unknown = scores.filter((s) => !validCriterionIds.has(s.criterionId));
    if (unknown.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'One or more criteria do not belong to this item\'s rubric',
          details: unknown.map((u) => u.criterionId),
        },
        { status: 400 }
      );
    }

    const { obtainedMarks, perCriterion } = scoreFromRubric(
      item.marks,
      item.rubric.criteria,
      scores
    );

    const updated = await prisma.$transaction(async (tx) => {
      const itemResult = await tx.studentassessmentitemresults.upsert({
        where: {
          studentAssessmentResultId_assessmentItemId: {
            studentAssessmentResultId: resultId,
            assessmentItemId,
          },
        },
        update: {
          obtainedMarks,
          totalMarks: item.marks,
          isCorrect: obtainedMarks >= item.marks * 0.5,
        },
        create: {
          studentAssessmentResultId: resultId,
          assessmentItemId,
          obtainedMarks,
          totalMarks: item.marks,
          isCorrect: obtainedMarks >= item.marks * 0.5,
        },
      });

      // Replace the previous breakdown wholesale so a re-score never leaves
      // stale criterion rows behind.
      await tx.rubric_scores.deleteMany({
        where: { itemResultId: itemResult.id },
      });

      const commentByCriterion = new Map(
        scores.map((s) => [s.criterionId, s.comment ?? null])
      );

      await tx.rubric_scores.createMany({
        data: perCriterion.map((p) => ({
          itemResultId: itemResult.id,
          criterionId: p.criterionId,
          level: p.level,
          awardedMarks: p.awardedMarks,
          comment: commentByCriterion.get(p.criterionId) ?? null,
        })),
      });

      // Roll the item's new mark up into the result total
      const allItems = await tx.studentassessmentitemresults.findMany({
        where: { studentAssessmentResultId: resultId },
        select: { obtainedMarks: true, totalMarks: true },
      });
      const totalObtained = allItems.reduce((s, i) => s + i.obtainedMarks, 0);
      const totalPossible = allItems.reduce((s, i) => s + i.totalMarks, 0);

      return tx.studentassessmentresults.update({
        where: { id: resultId },
        data: {
          obtainedMarks: totalObtained,
          totalMarks: totalPossible,
          percentage: totalPossible > 0 ? (totalObtained / totalPossible) * 100 : 0,
        },
      });
    });

    await writeAuditLog(request, auth.user, 'marks.update', {
      resultId,
      studentId: result.studentId,
      assessmentId: result.assessmentId,
      assessmentItemId,
      courseOfferingId: offeringId,
      scoredVia: 'rubric',
      rubricId: item.rubric.id,
      obtainedMarks,
      breakdown: perCriterion,
    });

    return NextResponse.json({
      success: true,
      message: 'Item scored from rubric',
      data: { itemMarks: obtainedMarks, breakdown: perCriterion, result: updated },
    });
  } catch (error) {
    console.error('[PATCH_RUBRIC_SCORE]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to score item from rubric' },
      { status: 500 }
    );
  }
}
