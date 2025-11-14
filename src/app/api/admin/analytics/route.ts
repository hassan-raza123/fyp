import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const { success, user, error } = requireAuth(request);
    if (!success || user?.role !== 'admin') {
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
    
    // Calculate retention rate (students who completed at least 2 semesters)
    const studentsWithMultipleSemesters = await prisma.semestergpa.groupBy({
      by: ['studentId'],
      _count: {
        studentId: true,
      },
    });
    const retainedStudents = studentsWithMultipleSemesters.filter(
      (s) => s._count.studentId >= 2
    ).length;
    const retentionRate =
      totalEnrollment > 0 ? retainedStudents / totalEnrollment : 0;

    // Additional stats
    const totalPrograms = await prisma.programs.count();
    const totalCourses = await prisma.courses.count();
    const totalDepartments = await prisma.departments.count();
    const totalFaculty = await prisma.faculties.count({
      where: { status: 'active' },
    });
    const totalAssessments = await prisma.assessments.count();
    const activeCourseOfferings = await prisma.courseofferings.count({
      where: { status: 'active' },
    });

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
        totalPrograms,
        totalCourses,
        totalDepartments,
        totalFaculty,
        totalAssessments,
        activeCourseOfferings,
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
