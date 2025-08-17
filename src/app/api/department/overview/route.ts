import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get user info from headers (set by middleware)
    const userId = request.headers.get('x-user-id');
    const userEmail = request.headers.get('x-user-email');
    const userRole = request.headers.get('x-user-role');

    if (!userId || !userEmail || !userRole) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get department admin's department
    const departmentAdmin = await prisma.users.findFirst({
      where: {
        id: parseInt(userId),
        departmentAdmin: {
          isNot: null,
        },
      },
      include: {
        departmentAdmin: true,
      },
    });

    if (!departmentAdmin?.departmentAdmin) {
      return NextResponse.json(
        { error: 'Department admin not found or no department assigned' },
        { status: 404 }
      );
    }

    const departmentId = departmentAdmin.departmentAdmin.id;

    // Get department-specific statistics
    const [
      totalStudents,
      totalPrograms,
      totalCourses,
      totalFaculty,
      recentActivities,
      currentSemester,
    ] = await Promise.all([
      // Total students in department
      prisma.students.count({
        where: { departmentId },
      }),
      // Total programs in department
      prisma.programs.count({
        where: { departmentId },
      }),
      // Total courses in department
      prisma.courses.count({
        where: { departmentId },
      }),
      // Total faculty in department
      prisma.faculties.count({
        where: { departmentId },
      }),
      // Recent activities (last 10)
      prisma.auditlogs.findMany({
        where: {
          user: {
            OR: [
              { departmentAdmin: { id: departmentId } },
              { faculty: { departmentId } },
              { student: { departmentId } },
            ],
          },
        },
        include: {
          user: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      // Current active semester
      prisma.semesters.findFirst({
        where: { status: 'active' },
        orderBy: { startDate: 'desc' },
      }),
    ]);

    // Transform recent activities
    const transformedActivities = recentActivities.map((activity) => ({
      id: activity.id.toString(),
      summary: activity.action,
      user: `${activity.user.first_name} ${activity.user.last_name}`,
      createdAt: activity.createdAt.toISOString(),
    }));

    const response = {
      stats: {
        totalStudents,
        totalPrograms,
        totalCourses,
        totalFaculty,
      },
      recentActivities: transformedActivities,
      currentSemester: currentSemester
        ? {
            name: currentSemester.name,
            startDate: currentSemester.startDate.toISOString(),
            endDate: currentSemester.endDate.toISOString(),
          }
        : null,
      departmentInfo: {
        name: departmentAdmin.departmentAdmin.name,
        code: departmentAdmin.departmentAdmin.code,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Department overview error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
