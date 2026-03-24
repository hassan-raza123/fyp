import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';

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
    const { success, user, error } = await requireAuth(request);
    if (!success || !user) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get admin's user ID from token payload
    const userId = user.userId;
    
    if (!userId || isNaN(Number(userId))) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 400 }
      );
    }

    // Get admin's assigned department from faculties table
    const faculty = await prisma.faculties.findFirst({
      where: { userId },
      select: { departmentId: true },
    });

    if (!faculty || !faculty.departmentId) {
      return NextResponse.json(
        {
          error:
            'No department assigned. Please contact super admin to assign a department to your account.',
        },
        { status: 400 }
      );
    }

    const departmentId = faculty.departmentId;

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

    // Get user IDs belonging to admin's department (faculty + students)
    const [deptFaculties, deptStudents] = await Promise.all([
      prisma.faculties.findMany({
        where: { departmentId },
        select: { userId: true },
      }),
      prisma.students.findMany({
        where: { departmentId },
        select: { userId: true },
      }),
    ]);
    const departmentUserIds = [
      ...new Set([
        ...deptFaculties.map((f) => f.userId),
        ...deptStudents.map((s) => s.userId),
      ]),
    ];

    // Get recent activities from audit logs — only for department users
    const recentActivities = await prisma.auditlogs.findMany({
      where: {
        userId: { in: departmentUserIds },
      },
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

    // Calculate enrollment trend (last 12 months) for current department
    const now = new Date();
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    }).reverse();

    const enrollmentTrend = await Promise.all(
      months.map(async ({ year, month }) => {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 1);
        const count = await prisma.students.count({
          where: {
            departmentId,
            createdAt: {
              gte: start,
              lt: end,
            },
          },
        });
        return {
          month: `${start.toLocaleString('default', {
            month: 'short',
          })} ${year}`,
          students: count,
        };
      })
    );

    // Get students in this department for GPA calculations
    const departmentStudentIds = await prisma.students.findMany({
      where: { departmentId },
      select: { id: true },
    });
    const studentIds = departmentStudentIds.map((s) => s.id);

    // Calculate average GPA for department students
    const avgGPAResult = await prisma.semestergpa.aggregate({
      where: {
        studentId: { in: studentIds },
      },
      _avg: { semesterGPA: true },
    });

    // Calculate retention rate (students who completed at least 2 semesters)
    const studentsWithMultipleSemesters = await prisma.semestergpa.groupBy({
      by: ['studentId'],
      where: {
        studentId: { in: studentIds },
      },
      _count: {
        studentId: true,
      },
    });
    const retainedStudents = studentsWithMultipleSemesters.filter(
      (s) => s._count.studentId >= 2
    ).length;
    const retentionRate =
      totalStudents > 0 ? retainedStudents / totalStudents : 0;

    // Get GPA distribution for department students
    const gpaDistribution = await prisma.semestergpa.groupBy({
      by: ['semesterGPA'],
      where: {
        studentId: { in: studentIds },
      },
      _count: true,
    });

    // Get program completion count for department
    const programCompletion = await prisma.students.count({
      where: {
        departmentId,
        status: 'graduated',
      },
    });

    return NextResponse.json({
      stats: {
        totalStudents,
        totalPrograms,
        totalCourses,
        totalFaculty: await prisma.faculties.count({
          where: { departmentId },
        }),
        averageGPA: avgGPAResult._avg.semesterGPA || 0,
        retentionRate,
        programCompletion,
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
        gpa: gpa.semesterGPA,
        students: gpa._count,
      })),
      enrollmentTrend,
    });
  } catch (error) {
    console.error('Error fetching admin overview data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
