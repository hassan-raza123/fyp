import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { course_offering_status } from '@prisma/client';
import { requireAuth } from '@/lib/api-utils';

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
    // Check authentication
    const { success, user, error } = requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const semesterId = searchParams.get('semesterId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');

    // Build query conditions
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

    if (search) {
      where.OR = [
        { course: { name: { contains: search } } },
        { course: { code: { contains: search } } },
        { semester: { name: { contains: search } } },
      ];
    }

    console.log('Fetching course offerings with conditions:', where);

    // Execute the query using Prisma
    const [offerings, total] = await Promise.all([
      prisma.courseofferings.findMany({
        where,
        include: {
          course: {
            select: {
              name: true,
              code: true,
              department: {
                select: {
                  name: true,
                  code: true,
                },
              },
            },
          },
          semester: {
            select: {
              name: true,
              startDate: true,
              endDate: true,
            },
          },
          _count: {
            select: {
              sections: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.courseofferings.count({ where }),
    ]);

    console.log('Found course offerings:', offerings.length);

    return NextResponse.json({
      success: true,
      data: offerings,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
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
    // Check authentication
    const { success, user, error } = requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createOfferingSchema.parse(body);

    // Check if course exists
    const course = await prisma.courses.findUnique({
      where: { id: validatedData.courseId },
    });

    if (!course) {
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
      return NextResponse.json(
        { success: false, error: 'Semester not found' },
        { status: 404 }
      );
    }

    // Check if offering already exists
    const existingOffering = await prisma.courseofferings.findUnique({
      where: {
        courseId_semesterId: {
          courseId: validatedData.courseId,
          semesterId: validatedData.semesterId,
        },
      },
    });

    if (existingOffering) {
      return NextResponse.json(
        {
          success: false,
          error: 'Course offering already exists for this semester',
        },
        { status: 400 }
      );
    }

    // Create course offering
    const offering = await prisma.courseofferings.create({
      data: {
        courseId: validatedData.courseId,
        semesterId: validatedData.semesterId,
        status: validatedData.status as course_offering_status,
      },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
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
        _count: {
          select: {
            sections: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Course offering created successfully',
      data: offering,
    });
  } catch (error) {
    console.error('Error creating course offering:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const { success, user, error } = requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateOfferingSchema.parse(body);

    // Check if offering exists
    const existingOffering = await prisma.courseofferings.findUnique({
      where: { id: validatedData.id },
    });

    if (!existingOffering) {
      return NextResponse.json(
        { success: false, error: 'Course offering not found' },
        { status: 404 }
      );
    }

    // Update course offering
    const offering = await prisma.courseofferings.update({
      where: { id: validatedData.id },
      data: {
        status: validatedData.status as course_offering_status,
      },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
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
        _count: {
          select: {
            sections: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Course offering updated successfully',
      data: offering,
    });
  } catch (error) {
    console.error('Error updating course offering:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const { success, user, error } = requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Course offering ID is required' },
        { status: 400 }
      );
    }

    // Check if offering exists
    const existingOffering = await prisma.courseofferings.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            sections: true,
          },
        },
      },
    });

    if (!existingOffering) {
      return NextResponse.json(
        { success: false, error: 'Course offering not found' },
        { status: 404 }
      );
    }

    // Check if offering has sections
    if (existingOffering._count.sections > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete course offering with existing sections',
        },
        { status: 400 }
      );
    }

    // Delete course offering
    await prisma.courseofferings.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      success: true,
      message: 'Course offering deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting course offering:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
