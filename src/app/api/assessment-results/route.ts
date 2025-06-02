import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sectionId, marks } = body;

    if (!sectionId || !marks || !Array.isArray(marks)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Start a transaction to ensure all operations succeed or fail together
    const results = await prisma.$transaction(async (tx) => {
      const createdResults = [];

      for (const studentMark of marks) {
        // Calculate total marks and percentage
        const totalMarks = studentMark.items.reduce(
          (sum: number, item: any) => sum + item.marks,
          0
        );
        const obtainedMarks = studentMark.items.reduce(
          (sum: number, item: any) => sum + item.marks,
          0
        );
        const percentage = (obtainedMarks / totalMarks) * 100;

        // Create the main assessment result
        const result = await tx.studentassessmentresults.create({
          data: {
            studentId: studentMark.studentId,
            assessmentId: studentMark.assessmentId,
            totalMarks,
            obtainedMarks,
            percentage,
            status: 'pending',
            remarks: '',
          },
        });

        // Create individual item results
        for (const item of studentMark.items) {
          await tx.studentassessmentitemresults.create({
            data: {
              studentAssessmentResultId: result.id,
              assessmentItemId: item.itemId,
              obtainedMarks: item.marks,
              totalMarks: item.totalMarks,
            },
          });
        }

        createdResults.push(result);
      }

      return createdResults;
    });

    return NextResponse.json({
      message: 'Assessment results saved successfully',
      results,
    });
  } catch (error) {
    console.error('Error saving assessment results:', error);
    return NextResponse.json(
      { error: 'Failed to save assessment results' },
      { status: 500 }
    );
  }
}
