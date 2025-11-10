import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFacultyIdFromRequest } from '@/lib/faculty-utils';

export async function GET(request: NextRequest) {
  try {
    // Get logged-in faculty ID
    const facultyId = await getFacultyIdFromRequest(request);
    if (!facultyId) {
      return NextResponse.json(
        { success: false, error: 'Faculty not found or unauthorized' },
        { status: 401 }
      );
    }

    // Get faculty's sections
    const sections = await prisma.sections.findMany({
      where: {
        facultyId: facultyId,
        status: 'active',
      },
      include: {
        courseOffering: {
          include: {
            course: true,
          },
        },
      },
    });

    // Get unique courses from sections
    const courseIds = [
      ...new Set(sections.map((s) => s.courseOffering.courseId)),
    ];

    // Get total students from faculty's sections
    const totalStudents = await prisma.studentsections.count({
      where: {
        section: {
          facultyId: facultyId,
          status: 'active',
        },
      },
      distinct: ['studentId'],
    });

    // Get total courses (unique courses from sections)
    const totalCourses = courseIds.length;

    // Get total sections
    const totalSections = sections.length;

    // Get active assessments
    const activeAssessments = await prisma.assessments.count({
      where: {
        conductedBy: facultyId,
        status: 'active',
      },
    });

    // Get recent activities (assessments created in last 7 days)
    const recentAssessments = await prisma.assessments.findMany({
      where: {
        conductedBy: facultyId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
      include: {
        courseOffering: {
          include: {
            course: true,
          },
        },
      },
    });

    // Format recent activities
    const recentActivities = recentAssessments.map((assessment) => ({
      id: assessment.id.toString(),
      summary: `Created assessment: ${assessment.title}`,
      createdAt: assessment.createdAt.toISOString(),
      user: 'You',
      course: assessment.courseOffering.course.name,
    }));

    // Get current semester (if any active section has a semester)
    const currentSemester = sections[0]?.courseOffering?.semester || null;

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalStudents,
          totalCourses,
          totalSections,
          activeAssessments,
        },
        recentActivities,
        currentSemester: currentSemester
          ? {
              name: currentSemester.name || 'N/A',
              startDate: currentSemester.startDate?.toISOString() || null,
              endDate: currentSemester.endDate?.toISOString() || null,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Error fetching faculty overview:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch overview',
      },
      { status: 500 }
    );
  }
}

