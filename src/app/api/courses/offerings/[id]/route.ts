import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';
import { Prisma } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const { success, user, error } = requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const courseOffering = await prisma.courseofferings.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
            creditHours: true,
            type: true,
            department: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        semester: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
          },
        },
        sections: {
          select: {
            id: true,
            name: true,
            maxStudents: true,
            faculty: {
              select: {
                id: true,
                user: {
                  select: {
                    first_name: true,
                    last_name: true,
                    email: true,
                  },
                },
              },
            },
            _count: {
              select: {
                studentsections: true,
              },
            },
          },
        },
      },
    });

    if (!courseOffering) {
      return NextResponse.json(
        { success: false, error: 'Course offering not found' },
        { status: 404 }
      );
    }

    // Transform the data to include currentStudents count
    const transformedCourseOffering = {
      ...courseOffering,
      sections: courseOffering.sections.map((section) => ({
        ...section,
        currentStudents: section._count.studentsections,
      })),
    };

    return NextResponse.json({
      success: true,
      data: transformedCourseOffering,
    });
  } catch (error) {
    console.error('Error fetching course offering:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
