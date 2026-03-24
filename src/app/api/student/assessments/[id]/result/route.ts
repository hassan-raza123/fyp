import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStudentIdFromRequest } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params;
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

    // Verify student is enrolled in this assessment's course
    const assessment = await prisma.assessments.findUnique({
      where: { id: assessmentId },
      include: {
        courseOffering: {
          include: {
            course: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
            semester: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!assessment) {
      return NextResponse.json(
        { success: false, error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Check if student is enrolled
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

    // Get student's result
    const result = await prisma.studentassessmentresults.findFirst({
      where: {
        studentId: studentId,
        assessmentId: assessmentId,
      },
      include: {
        itemResults: {
          include: {
            assessmentItem: {
              include: {
                clo: {
                  select: {
                    id: true,
                    code: true,
                    description: true,
                  },
                },
              },
            },
          },
          orderBy: {
            assessmentItem: {
              questionNo: 'asc',
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        assessment: {
          id: assessment.id,
          title: assessment.title,
          type: assessment.type,
          totalMarks: assessment.totalMarks,
          weightage: assessment.weightage,
          dueDate: assessment.dueDate,
          course: assessment.courseOffering.course,
          semester: assessment.courseOffering.semester,
        },
        result: result
          ? {
              id: result.id,
              obtainedMarks: result.obtainedMarks,
              totalMarks: result.totalMarks,
              percentage: result.percentage,
              grade: result.grade,
              status: result.status,
              submittedAt: result.submittedAt,
              evaluatedAt: result.evaluatedAt,
              remarks: result.remarks,
              itemResults: result.itemResults.map((ir) => ({
                id: ir.id,
                questionNo: ir.assessmentItem.questionNo,
                description: ir.assessmentItem.description,
                totalMarks: ir.assessmentItem.marks,
                obtainedMarks: ir.obtainedMarks,
                remarks: ir.remarks,
                clo: ir.assessmentItem.clo,
              })),
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Error fetching assessment result:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assessment result' },
      { status: 500 }
    );
  }
}

