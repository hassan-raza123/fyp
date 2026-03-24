import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params;
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const program = await prisma.programs.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        students: true,
        curriculum: {
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
    const totalCGPA = program.students.reduce((sum: number, student: any) => {
      return sum + ((student as any).cgpa || 0);
    }, 0);
    const averageCGPA = totalStudents > 0 ? totalCGPA / totalStudents : 0;

    // Calculate credit hours distribution
    const creditHoursBySemester = program.curriculum.reduce((acc: Record<number, number>, pc: any) => {
      if (!acc[pc.semesterSlot]) {
        acc[pc.semesterSlot] = 0;
      }
      acc[pc.semesterSlot] += pc.course.creditHours;
      return acc;
    }, {} as Record<number, number>);

    // Calculate course type distribution
    const courseTypeDistribution = program.curriculum.reduce((acc: Record<string, number>, pc: any) => {
      const type = pc.courseCategory === 'core' ? 'core' : 'elective';
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type] += pc.course.creditHours;
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
