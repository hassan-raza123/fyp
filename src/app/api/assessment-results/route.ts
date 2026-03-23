import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { success, user, error } = await requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const sectionId = searchParams.get('sectionId');
    const assessmentId = searchParams.get('assessmentId');

    const where: any = {};
    if (studentId) {
      where.studentId = parseInt(studentId);
    }
    if (assessmentId) {
      where.assessmentId = parseInt(assessmentId);
    }
    if (sectionId) {
      // Filter by section through student sections
      where.student = {
        studentsections: {
          some: {
            sectionId: parseInt(sectionId),
          },
        },
      };
    }

    const results = await prisma.studentassessmentresults.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            rollNumber: true,
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        },
        assessment: {
          select: {
            id: true,
            title: true,
            type: true,
            totalMarks: true,
          },
        },
        itemResults: {
          include: {
            assessmentItem: {
              select: {
                id: true,
                questionNo: true,
                marks: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('Error fetching assessment results:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assessment results' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { success, error } = await requireAuth(request as any);
    if (!success) {
      return NextResponse.json(
        { error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sectionId, marks } = body;

    if (!sectionId || !marks || !Array.isArray(marks)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    if (marks.length === 0) {
      return NextResponse.json(
        { error: 'No marks provided' },
        { status: 400 }
      );
    }

    // Validate no negative marks
    for (const studentMark of marks) {
      if (studentMark.items.some((item: any) => item.marks < 0)) {
        return NextResponse.json(
          { error: 'Marks cannot be negative' },
          { status: 400 }
        );
      }
    }

    // Check if results are locked for this course offering
    const assessment = await prisma.assessments.findUnique({
      where: { id: marks[0]?.assessmentId },
      select: { courseOffering: { select: { isResultsLocked: true } } },
    });
    if (assessment?.courseOffering?.isResultsLocked) {
      return NextResponse.json(
        { error: 'Results are locked for this course offering' },
        { status: 403 }
      );
    }

    // Start a transaction to ensure all operations succeed or fail together
    const results = await prisma.$transaction(async (tx) => {
      const createdResults = [];

      for (const studentMark of marks) {
        // Calculate total marks and percentage
        const totalMarks = studentMark.items.reduce(
          (sum: number, item: any) => sum + item.totalMarks,
          0
        );
        const obtainedMarks = studentMark.items.reduce(
          (sum: number, item: any) => sum + item.marks,
          0
        );
        const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

        // Check if result already exists
        const existingResult = await tx.studentassessmentresults.findFirst({
          where: {
            studentId: studentMark.studentId,
            assessmentId: studentMark.assessmentId,
          },
        });

        let result;
        if (existingResult) {
          // Update existing result
          result = await tx.studentassessmentresults.update({
            where: { id: existingResult.id },
            data: {
              totalMarks,
              obtainedMarks,
              percentage,
              status: 'pending',
            },
          });

          // Delete old item results
          await tx.studentassessmentitemresults.deleteMany({
            where: {
              studentAssessmentResultId: existingResult.id,
            },
          });
        } else {
          // Create new result
          result = await tx.studentassessmentresults.create({
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
        }

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
      success: true,
      message: 'Assessment results saved successfully',
      data: results,
    });
  } catch (error) {
    console.error('Error saving assessment results:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save assessment results' },
      { status: 500 }
    );
  }
}
