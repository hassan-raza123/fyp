import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const program = await prisma.program.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        students: {
          include: {
            user: true,
          },
        },
        courses: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    // Calculate statistics
    const totalStudents = program.students.length;
    const activeStudents = program.students.filter(
      (student) => student.status === 'active'
    ).length;
    const graduatedStudents = program.students.filter(
      (student) => student.status === 'graduated'
    ).length;

    // Calculate average CGPA
    const totalCGPA = program.students.reduce((sum, student) => {
      return sum + (student.cgpa || 0);
    }, 0);
    const averageCGPA = totalStudents > 0 ? totalCGPA / totalStudents : 0;

    // Calculate credit hours distribution
    const creditHoursBySemester = program.courses.reduce((acc, pc) => {
      if (!acc[pc.semester]) {
        acc[pc.semester] = 0;
      }
      acc[pc.semester] += pc.creditHours;
      return acc;
    }, {} as Record<number, number>);

    // Calculate course type distribution
    const courseTypeDistribution = program.courses.reduce((acc, pc) => {
      const type = pc.isCore ? 'core' : 'elective';
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type] += pc.creditHours;
      return acc;
    }, {} as Record<string, number>);

    // Calculate enrollment trends (last 5 years)
    const currentYear = new Date().getFullYear();
    const enrollmentTrends = Array.from({ length: 5 }, (_, i) => {
      const year = currentYear - i;
      const enrolled = program.students.filter((student) => {
        const enrollmentYear = new Date(student.createdAt).getFullYear();
        return enrollmentYear === year;
      }).length;
      return { year, enrolled };
    }).reverse();

    return NextResponse.json({
      success: true,
      data: {
        programId: program.id,
        programName: program.name,
        totalStudents,
        activeStudents,
        graduatedStudents,
        averageCGPA,
        creditHoursBySemester,
        courseTypeDistribution,
        enrollmentTrends,
      },
    });
  } catch (error) {
    console.error('Error fetching program statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch program statistics' },
      { status: 500 }
    );
  }
}
