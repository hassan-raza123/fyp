import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assessmentitems } from '@prisma/client';
import { getFacultyIdFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Get logged-in faculty ID
    const facultyId = await getFacultyIdFromRequest(request);
    if (!facultyId) {
      return NextResponse.json(
        { success: false, error: 'Faculty not found or unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sectionId, assessmentId, marks } = body;

    if (!assessmentId || !marks || !Array.isArray(marks)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Get assessment details to validate marks
    const assessment = await prisma.assessments.findUnique({
      where: { id: assessmentId },
      include: {
        assessmentItems: true,
      },
    });

    if (!assessment) {
      return NextResponse.json(
        { success: false, error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Check if the course offering results are locked
    const offering = await prisma.courseofferings.findUnique({
      where: { id: assessment.courseOfferingId },
      select: { isResultsLocked: true },
    });
    if (offering?.isResultsLocked) {
      return NextResponse.json(
        {
          success: false,
          error: 'Results are locked for this course offering. Contact your department admin to unlock.',
        },
        { status: 403 }
      );
    }

    // Verify assessment belongs to faculty
    if (assessment.conductedBy !== facultyId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Assessment does not belong to you' },
        { status: 403 }
      );
    }

    // Validate marks against total possible marks
    const validationErrors = [];
    for (const studentMark of marks) {
      for (const item of studentMark.items) {
        const assessmentItem = assessment.assessmentItems.find(
          (ai) => ai.id === item.itemId
        );
        if (!assessmentItem) {
          validationErrors.push(
            `Invalid item ID ${item.itemId} for student ${studentMark.studentId}`
          );
          continue;
        }
        if (item.marks < 0) {
          validationErrors.push(
            `Marks for item ${item.itemId} cannot be negative for student ${studentMark.studentId}`
          );
        }
        if (item.marks > assessmentItem.marks) {
          validationErrors.push(
            `Marks for item ${item.itemId} exceed maximum marks for student ${studentMark.studentId}`
          );
        }
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    // Start a transaction to ensure all operations succeed or fail together
    const results = await prisma.$transaction(async (tx) => {
      const createdResults = [];

      for (const studentMark of marks) {
        // Calculate total marks and percentage
        const totalMarks = assessment.assessmentItems.reduce(
          (sum: number, item: assessmentitems) => sum + item.marks,
          0
        );
        const obtainedMarks = studentMark.items.reduce(
          (sum: number, item: { marks: number }) => sum + item.marks,
          0
        );
        const percentage = (obtainedMarks / totalMarks) * 100;

        // Upsert the main assessment result (update if student+assessment combo already exists)
        const result = await tx.studentassessmentresults.upsert({
          where: {
            studentId_assessmentId: {
              studentId: studentMark.studentId,
              assessmentId: assessmentId,
            },
          },
          update: {
            totalMarks,
            obtainedMarks,
            percentage,
            status: 'pending',
            submittedAt: new Date(),
          },
          create: {
            studentId: studentMark.studentId,
            assessmentId: assessmentId,
            totalMarks,
            obtainedMarks,
            percentage,
            status: 'pending',
            remarks: '',
            submittedAt: new Date(),
          },
        });

        // Delete existing item results before re-creating (to handle updated marks)
        await tx.studentassessmentitemresults.deleteMany({
          where: { studentAssessmentResultId: result.id },
        });

        // Create individual item results
        for (const item of studentMark.items) {
          await tx.studentassessmentitemresults.create({
            data: {
              studentAssessmentResultId: result.id,
              assessmentItemId: item.itemId,
              obtainedMarks: item.marks,
              totalMarks:
                assessment.assessmentItems.find((ai) => ai.id === item.itemId)
                  ?.marks || 0,
              isCorrect:
                item.marks >=
                (assessment.assessmentItems.find((ai) => ai.id === item.itemId)
                  ?.marks || 0) *
                  0.5,
            },
          });
        }

        createdResults.push(result);
      }

      return createdResults;
    });

    return NextResponse.json({
      success: true,
      message: `Successfully entered marks for ${results.length} student(s)`,
      data: results,
    });
  } catch (error) {
    console.error('Error in bulk marks entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process marks entry' },
      { status: 500 }
    );
  }
}
