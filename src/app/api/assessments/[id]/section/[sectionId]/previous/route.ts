import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFacultyIdFromRequest } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params: _params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  const params = await _params;
  try {
    const assessmentId = parseInt(params.id);
    const sectionId = parseInt(params.sectionId);

    if (isNaN(assessmentId) || isNaN(sectionId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid assessment or section ID' },
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

    // Get current assessment
    const currentAssessment = await prisma.assessments.findUnique({
      where: { id: assessmentId },
      include: {
        courseOffering: true,
      },
    });

    if (!currentAssessment) {
      return NextResponse.json(
        { success: false, error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Get previous assessments for the same course offering
    const previousAssessments = await prisma.assessments.findMany({
      where: {
        courseOfferingId: currentAssessment.courseOfferingId,
        conductedBy: facultyId,
        id: {
          not: assessmentId,
        },
        status: {
          in: ['active', 'completed'] as any,
        },
      },
      include: {
        assessmentItems: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 1, // Get most recent previous assessment
    });

    if (previousAssessments.length === 0) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    const previousAssessment = previousAssessments[0];

    // Get students in section
    const studentSections = await prisma.studentsections.findMany({
      where: {
        sectionId: sectionId,
        status: 'active',
      },
      select: {
        studentId: true,
      },
    });

    const studentIds = studentSections.map((ss) => ss.studentId);

    // Get results for previous assessment
    const previousResults = await prisma.studentassessmentresults.findMany({
      where: {
        assessmentId: previousAssessment.id,
        studentId: {
          in: studentIds,
        },
        status: {
          in: ['evaluated', 'published'] as any,
        },
      },
    });

    const averageMarks =
      previousResults.length > 0
        ? previousResults.reduce((sum, r) => sum + r.obtainedMarks, 0) /
          previousResults.length
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        assessmentId: previousAssessment.id,
        assessmentTitle: previousAssessment.title,
        assessmentType: previousAssessment.type,
        averageMarks,
        totalStudents: previousResults.length,
        date: previousAssessment.createdAt,
      },
    });
  } catch (error) {
    console.error('Error fetching previous assessment data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch previous assessment data' },
      { status: 500 }
    );
  }
}

