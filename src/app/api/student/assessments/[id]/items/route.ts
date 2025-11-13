import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStudentIdFromRequest } from '@/lib/student-utils';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assessmentId = parseInt(params.id);
    if (isNaN(assessmentId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid assessment ID' },
        { status: 400 }
      );
    }

    const studentId = await getStudentIdFromRequest(req);
    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Student not found or unauthorized' },
        { status: 401 }
      );
    }

    // Verify student is enrolled
    const assessment = await prisma.assessments.findUnique({
      where: { id: assessmentId },
      select: {
        courseOfferingId: true,
      },
    });

    if (!assessment) {
      return NextResponse.json(
        { success: false, error: 'Assessment not found' },
        { status: 404 }
      );
    }

    const studentSection = await prisma.studentsections.findFirst({
      where: {
        studentId: studentId,
        status: 'active',
        section: {
          courseOfferingId: assessment.courseOfferingId,
        },
      },
    });

    if (!studentSection) {
      return NextResponse.json(
        { success: false, error: 'Not enrolled in this course' },
        { status: 403 }
      );
    }

    // Get assessment items
    const items = await prisma.assessmentitems.findMany({
      where: {
        assessmentId: assessmentId,
      },
      include: {
        clo: {
          select: {
            id: true,
            code: true,
            description: true,
          },
        },
      },
      orderBy: {
        questionNo: 'asc',
      },
    });

    // Get student's item results
    const result = await prisma.studentassessmentresults.findFirst({
      where: {
        studentId: studentId,
        assessmentId: assessmentId,
      },
      include: {
        itemResults: true,
      },
    });

    const itemResultsMap = new Map();
    if (result) {
      result.itemResults.forEach((ir) => {
        itemResultsMap.set(ir.assessmentItemId, ir);
      });
    }

    // Combine items with student marks
    const itemsWithMarks = items.map((item) => {
      const itemResult = itemResultsMap.get(item.id);
      return {
        id: item.id,
        questionNo: item.questionNo,
        description: item.description,
        marks: item.marks,
        clo: item.clo,
        obtainedMarks: itemResult?.obtainedMarks || null,
        remarks: itemResult?.remarks || null,
      };
    });

    return NextResponse.json({
      success: true,
      data: itemsWithMarks,
    });
  } catch (error) {
    console.error('Error fetching assessment items:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assessment items' },
      { status: 500 }
    );
  }
}

