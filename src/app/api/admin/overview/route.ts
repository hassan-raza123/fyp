import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/api-utils';
import { getCurrentDepartmentId } from '@/lib/department-utils';

function getActivitySummary(activity: any) {
  // Try to parse details JSON
  let details: any = {};
  try {
    details =
      typeof activity.details === 'string'
        ? JSON.parse(activity.details)
        : activity.details;
  } catch {
    details = activity.details;
  }
  const entity = details?.entity || details?.changes?.entity || 'entity';
  const field = details?.field || details?.changes?.field || '';
  const oldValue = details?.oldValue || details?.changes?.oldValue || '';
  const newValue = details?.newValue || details?.changes?.newValue || '';
  const action = activity.action || 'ACTION';
  const userRole = details?.userRole || '';
  const entityId = details?.entityId || details?.changes?.entityId || '';
  // Compose a readable message
  if (action === 'UPDATE') {
    return `Updated ${entity} (${field}) from '${oldValue}' to '${newValue}' [ID: ${entityId}]`;
  } else if (action === 'CREATE') {
    return `Created ${entity} (${field}) with value '${newValue}' [ID: ${entityId}]`;
  } else if (action === 'LOGIN') {
    return `User logged in [ID: ${entityId}]`;
  } else if (action === 'LOGOUT') {
    return `User logged out [ID: ${entityId}]`;
  } else {
    return `${action} on ${entity} (${field}) [ID: ${entityId}]`;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current department ID from settings
    const departmentId = await getCurrentDepartmentId();
    if (!departmentId) {
      return NextResponse.json(
        {
          error:
            'Department not configured. Please set department in Settings.',
        },
        { status: 400 }
      );
    }

    // Get total students count for current department
    const totalStudents = await prisma.students.count({
      where: { departmentId },
    });

    // Get total programs count for current department
    const totalPrograms = await prisma.programs.count({
      where: { departmentId },
    });

    // Get total courses count for current department
    const totalCourses = await prisma.courses.count({
      where: { departmentId },
    });

    // Get recent activities from audit logs
    const recentActivities = await prisma.auditlogs.findMany({
      take: 4,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    // Get current semester
    const currentSemester = await prisma.semesters.findFirst({
      where: {
        status: 'active',
      },
      select: {
        name: true,
        startDate: true,
        endDate: true,
      },
    });

    // Get program distribution for current department
    const programDistribution = await prisma.programs.findMany({
      where: { departmentId },
      select: {
        name: true,
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    // Get GPA distribution from semester GPA
    const gpaDistribution = await prisma.semestergpa.groupBy({
      by: ['semesterGPA'],
      _count: true,
    });

    // Calculate enrollment trend (last 6 months) for current department
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const enrollmentTrend = await prisma.students.groupBy({
      by: ['createdAt'],
      where: {
        departmentId,
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      _count: true,
    });

    return NextResponse.json({
      stats: {
        totalStudents,
        totalPrograms,
        totalCourses,
        totalFaculty: await prisma.faculties.count({
          where: { departmentId },
        }),
      },
      recentActivities: recentActivities.map((activity) => ({
        id: activity.id,
        summary: getActivitySummary(activity),
        createdAt: activity.createdAt,
        user: `${activity.user.first_name} ${activity.user.last_name}`,
      })),
      currentSemester,
      programDistribution: programDistribution.map((program) => ({
        name: program.name,
        value: program._count.students,
      })),
      gpaDistribution: gpaDistribution.map((gpa) => ({
        range: `${gpa.semesterGPA.toFixed(1)}-${(gpa.semesterGPA + 0.5).toFixed(
          1
        )}`,
        students: gpa._count,
      })),
      enrollmentTrend: enrollmentTrend.map((trend) => ({
        month: new Date(trend.createdAt).toLocaleString('default', {
          month: 'short',
        }),
        students: trend._count,
      })),
    });
  } catch (error) {
    console.error('Error fetching admin overview data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
