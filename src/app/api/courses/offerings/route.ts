import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { course_offering_status } from '@prisma/client';

const createOfferingSchema = z.object({
  courseId: z.number(),
  semesterId: z.number(),
  status: z
    .enum(['active', 'inactive', 'cancelled'] as const)
    .default('active'),
});

const updateOfferingSchema = createOfferingSchema.partial().extend({
  id: z.number(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const courseId = searchParams.get('courseId');
    const semesterId = searchParams.get('semesterId');
    const status = searchParams.get('status');

    const where: any = {};

    if (courseId) {
      where.courseId = parseInt(courseId);
    }
    if (semesterId) {
      where.semesterId = parseInt(semesterId);
    }
    if (status) {
      where.status = status;
    }

    const total = await prisma.courseofferings.count({ where });

    const offerings = await prisma.courseofferings.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            creditHours: true,
            type: true,
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
            status: true,
            faculty: {
              select: {
                id: true,
                user: {
                  select: {
                    id: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: offerings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching course offerings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch course offerings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Course offering POST request received');

    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    const validatedData = createOfferingSchema.parse(body);
    console.log('Validated data:', JSON.stringify(validatedData, null, 2));

    // Check if course exists
    const course = await prisma.courses.findUnique({
      where: { id: validatedData.courseId },
    });

    if (!course) {
      console.log('Course not found:', validatedData.courseId);
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if semester exists
    const semester = await prisma.semesters.findUnique({
      where: { id: validatedData.semesterId },
    });

    if (!semester) {
      console.log('Semester not found:', validatedData.semesterId);
      return NextResponse.json(
        { success: false, error: 'Semester not found' },
        { status: 404 }
      );
    }

    // Check if offering already exists
    const existingOffering = await prisma.courseofferings.findFirst({
      where: {
        courseId: validatedData.courseId,
        semesterId: validatedData.semesterId,
      },
    });

    if (existingOffering) {
      console.log('Course offering already exists:', {
        courseId: validatedData.courseId,
        semesterId: validatedData.semesterId,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Course offering already exists for this semester',
        },
        { status: 400 }
      );
    }

    console.log(
      'Creating course offering with data:',
      JSON.stringify(validatedData, null, 2)
    );

    // Create the offering
    const offering = await prisma.courseofferings.create({
      data: {
        courseId: validatedData.courseId,
        semesterId: validatedData.semesterId,
        status: validatedData.status,
      },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            creditHours: true,
            type: true,
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
      },
    });

    console.log(
      'Course offering created successfully:',
      JSON.stringify(offering, null, 2)
    );

    return NextResponse.json({
      success: true,
      data: offering,
      message: 'Course offering created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', JSON.stringify(error.errors, null, 2));
      return NextResponse.json(
        { success: false, error: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating course offering:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      errorObject: JSON.stringify(error, null, 2),
    });

    return NextResponse.json(
      { success: false, error: 'Failed to create course offering' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = updateOfferingSchema.parse(body);

    const offering = await prisma.courseofferings.update({
      where: { id: validatedData.id },
      data: {
        status: validatedData.status,
      },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            creditHours: true,
            type: true,
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
      },
    });

    return NextResponse.json({
      success: true,
      data: offering,
      message: 'Course offering updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating course offering:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update course offering' },
      { status: 500 }
    );
  }
}
