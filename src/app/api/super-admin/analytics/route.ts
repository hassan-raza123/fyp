import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { success, user, error } = await requireAuth(request);
    if (!success || user?.role !== 'super_admin') {
      return NextResponse.json(
        { error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Enrollment trend (last 12 months)
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

    // Department distribution
    const departmentDistribution = await prisma.departments.findMany({
      where: { status: 'active' },
      select: {
        name: true,
        _count: {
          select: { students: true },
        },
      },
    });


    // Activity trend (last 7 days)
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const activityTrend = await Promise.all(
      days.map(async (day) => {
        const start = new Date(day);
        start.setHours(0, 0, 0, 0);
        const end = new Date(day);
        end.setHours(23, 59, 59, 999);
        const count = await prisma.auditlogs.count({
          where: {
            createdAt: {
              gte: start,
              lte: end,
            },
          },
        });
        return {
          date: new Date(day).toLocaleDateString('default', {
            month: 'short',
            day: 'numeric',
          }),
          activities: count,
        };
      })
    );

    // Key stats
    const totalStudents = await prisma.students.count();
    const totalFaculty = await prisma.faculties.count({
      where: { status: 'active' },
    });
    const totalPrograms = await prisma.programs.count();
    const totalCourses = await prisma.courses.count();
    const totalDepartments = await prisma.departments.count({
      where: { status: 'active' },
    });
    const totalAdmins = await prisma.users.count({
      where: {
        status: 'active',
        userrole: {
          role: {
            name: 'admin',
          },
        },
      },
    });

    return NextResponse.json({
      enrollmentTrend,
      departmentDistribution: departmentDistribution.map((d) => ({
        name: d.name,
        value: d._count.students,
      })),
      activityTrend,
      stats: {
        totalStudents,
        totalFaculty,
        totalPrograms,
        totalCourses,
        totalDepartments,
        totalAdmins,
      },
    });
  } catch (error) {
    console.error('Error fetching super admin analytics:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

