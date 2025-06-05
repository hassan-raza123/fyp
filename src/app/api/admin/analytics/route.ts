import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Program distribution
    const programDistribution = await prisma.programs.findMany({
      select: {
        name: true,
        _count: {
          select: { students: true },
        },
      },
    });

    // GPA distribution (from semestergpa)
    const gpaDistribution = await prisma.semestergpa.groupBy({
      by: ['semesterGPA'],
      _count: true,
    });

    // Key stats
    const totalEnrollment = await prisma.students.count();
    const programCompletion = await prisma.students.count({
      where: { status: 'graduated' },
    });
    const avgGPAResult = await prisma.semestergpa.aggregate({
      _avg: { semesterGPA: true },
    });
    const retentionRate = 0.92; // Placeholder, calculate as needed

    return NextResponse.json({
      enrollmentTrend,
      programDistribution: programDistribution.map((p) => ({
        name: p.name,
        value: p._count.students,
      })),
      gpaDistribution: gpaDistribution.map((g) => ({
        gpa: g.semesterGPA,
        students: g._count,
      })),
      stats: {
        totalEnrollment,
        programCompletion,
        averageGPA: avgGPAResult._avg.semesterGPA || 0,
        retentionRate,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
