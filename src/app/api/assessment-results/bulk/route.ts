import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assessmentitems } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sectionId, assessmentId, marks } = body;

    if (!sectionId || !assessmentId || !marks || !Array.isArray(marks)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
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
        { error: 'Assessment not found' },
        { status: 404 }
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
        if (item.marks > assessmentItem.marks) {
          validationErrors.push(
            `Marks for item ${item.itemId} exceed maximum marks for student ${studentMark.studentId}`
          );
        }
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
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

        // Create the main assessment result
        const result = await tx.studentassessmentresults.create({
          data: {
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

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in bulk marks entry:', error);
    return NextResponse.json(
      { error: 'Failed to process marks entry' },
      { status: 500 }
    );
  }
}
