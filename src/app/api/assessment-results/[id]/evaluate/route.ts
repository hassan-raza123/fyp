import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFacultyIdFromRequest } from '@/lib/auth';

// PATCH - Evaluate a student result (update marks, remarks, status)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resultId = parseInt(params.id);
    if (isNaN(resultId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid result ID' },
        { status: 400 }
      );
    }

    const facultyId = await getFacultyIdFromRequest(req);
    if (!facultyId) {
      return NextResponse.json(
        { success: false, error: 'Faculty not found or unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      itemMarks,
      remarks,
      status,
      adjustmentReason,
      totalMarks,
      obtainedMarks,
    } = body;

    // Get the result and verify it belongs to faculty's assessment
    const result = await prisma.studentassessmentresults.findUnique({
      where: { id: resultId },
      include: {
        assessment: {
          select: {
            id: true,
            conductedBy: true,
            totalMarks: true,
            assessmentItems: {
              select: {
                id: true,
                marks: true,
              },
            },
          },
        },
      },
    });

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Result not found' },
        { status: 404 }
      );
    }

    if (result.assessment.conductedBy !== facultyId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update item results if provided
    if (itemMarks && Array.isArray(itemMarks)) {
      await prisma.$transaction(async (tx) => {
        // Delete existing item results
        await tx.studentassessmentitemresults.deleteMany({
          where: {
            studentAssessmentResultId: resultId,
          },
        });

        // Create new item results
        for (const itemMark of itemMarks) {
          const assessmentItem = result.assessment.assessmentItems.find(
            (ai) => ai.id === itemMark.itemId
          );
          if (assessmentItem) {
            await tx.studentassessmentitemresults.create({
              data: {
                studentAssessmentResultId: resultId,
                assessmentItemId: itemMark.itemId,
                obtainedMarks: itemMark.marks,
                totalMarks: assessmentItem.marks,
                isCorrect: itemMark.marks >= assessmentItem.marks * 0.5,
              },
            });
          }
        }
      });
    }

    // Calculate new totals if item marks were updated
    let finalTotalMarks = totalMarks || result.totalMarks;
    let finalObtainedMarks = obtainedMarks;

    if (itemMarks && Array.isArray(itemMarks)) {
      finalTotalMarks = result.assessment.assessmentItems.reduce(
        (sum, item) => sum + item.marks,
        0
      );
      finalObtainedMarks = itemMarks.reduce(
        (sum: number, item: { marks: number }) => sum + item.marks,
        0
      );
    } else if (obtainedMarks !== undefined) {
      finalObtainedMarks = obtainedMarks;
    } else {
      finalObtainedMarks = result.obtainedMarks;
    }

    const percentage =
      finalTotalMarks > 0 ? (finalObtainedMarks / finalTotalMarks) * 100 : 0;

    // Update the main result
    const updatedResult = await prisma.studentassessmentresults.update({
      where: { id: resultId },
      data: {
        totalMarks: finalTotalMarks,
        obtainedMarks: finalObtainedMarks,
        percentage,
        ...(remarks !== undefined && { remarks }),
        ...(status && { status: status as any }),
        ...(status === 'evaluated' && { evaluatedAt: new Date() }),
        ...(adjustmentReason && {
          remarks: result.remarks
            ? `${result.remarks}\n\n[Adjustment Reason: ${adjustmentReason}]`
            : `[Adjustment Reason: ${adjustmentReason}]`,
        }),
      },
      include: {
        itemResults: {
          include: {
            assessmentItem: {
              select: {
                id: true,
                questionNo: true,
                description: true,
                marks: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Result evaluated successfully',
      data: updatedResult,
    });
  } catch (error) {
    console.error('Error evaluating result:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to evaluate result' },
      { status: 500 }
    );
  }
}

