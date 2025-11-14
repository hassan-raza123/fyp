import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStudentIdFromRequest } from '@/lib/student-utils';

export async function GET(request: NextRequest) {
  try {
    const studentId = await getStudentIdFromRequest(request);
    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Student not found or unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const courseOfferingId = searchParams.get('courseOfferingId');
    const semesterId = searchParams.get('semesterId');

    // Build where clause
    const where: any = {
      studentId: studentId,
      status: 'active',
    };

    if (courseOfferingId) {
      where.courseOfferingId = parseInt(courseOfferingId);
    }

    if (semesterId) {
      where.courseOffering = {
        semesterId: parseInt(semesterId),
      };
    }

    // Get student grades
    const grades = await prisma.studentgrades.findMany({
      where,
      include: {
        courseOffering: {
          include: {
            course: {
              select: {
                id: true,
                code: true,
                name: true,
                creditHours: true,
              },
            },
            semester: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        courseOffering: {
          semester: {
            startDate: 'desc',
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: grades,
    });
  } catch (error) {
    console.error('Error fetching student grades:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch grades' },
      { status: 500 }
    );
  }
}

