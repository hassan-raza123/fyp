import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFacultyIdFromRequest } from '@/lib/auth';

// GET - Get all student results for an assessment that need evaluation
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

    const facultyId = await getFacultyIdFromRequest(req);
    if (!facultyId) {
      return NextResponse.json(
        { success: false, error: 'Faculty not found or unauthorized' },
        { status: 401 }
      );
    }

    // Verify assessment belongs to faculty
    const assessment = await prisma.assessments.findUnique({
      where: { id: assessmentId },
      include: {
        courseOffering: {
          include: {
            sections: {
              where: {
                facultyId: facultyId,
                status: 'active',
              },
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!assessment || assessment.conductedBy !== facultyId) {
      return NextResponse.json(
        { success: false, error: 'Assessment not found or unauthorized' },
        { status: 404 }
      );
    }

    const sectionIds = assessment.courseOffering.sections.map((s) => s.id);

    // Get students in these sections
    const studentSections = await prisma.studentsections.findMany({
      where: {
        sectionId: {
          in: sectionIds,
        },
        status: 'active',
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        },
        section: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const studentIds = studentSections.map((ss) => ss.studentId);

    // Get results for this assessment
    const results = await prisma.studentassessmentresults.findMany({
      where: {
        assessmentId: assessmentId,
        studentId: {
          in: studentIds,
        },
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
          orderBy: {
            assessmentItem: {
              questionNo: 'asc',
            },
          },
        },
      },
      orderBy: {
        student: {
          rollNumber: 'asc',
        },
      },
    });

    // Format response
    const formattedResults = studentSections.map((ss) => {
      const result = results.find((r) => r.studentId === ss.student.id);

      return {
        resultId: result?.id,
        studentId: ss.student.id,
        rollNumber: ss.student.rollNumber,
        name: `${ss.student.user.first_name} ${ss.student.user.last_name}`,
        email: ss.student.user.email,
        sectionId: ss.section.id,
        sectionName: ss.section.name,
        status: result?.status || 'pending',
        totalMarks: result?.totalMarks || 0,
        obtainedMarks: result?.obtainedMarks || 0,
        percentage: result?.percentage || 0,
        remarks: result?.remarks || '',
        submittedAt: result?.submittedAt,
        evaluatedAt: result?.evaluatedAt,
        itemResults: result?.itemResults || [],
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        assessment: {
          id: assessment.id,
          title: assessment.title,
          type: assessment.type,
          totalMarks: assessment.totalMarks,
          dueDate: assessment.dueDate,
        },
        results: formattedResults,
      },
    });
  } catch (error) {
    console.error('Error fetching assessment evaluations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch evaluations' },
      { status: 500 }
    );
  }
}
