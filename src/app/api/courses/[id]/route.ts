import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { course_type, course_status } from '@prisma/client';

const updateCourseSchema = z.object({
  code: z.string().min(1, 'Course code is required'),
  name: z.string().min(1, 'Course name is required'),
  description: z.string().optional(),
  creditHours: z.coerce.number().min(1, 'Credit hours must be at least 1'),
  theoryHours: z.coerce.number().min(0, 'Theory hours cannot be negative'),
  labHours: z.coerce.number().min(0, 'Lab hours cannot be negative'),
  type: z.enum(['THEORY', 'LAB', 'PROJECT', 'THESIS'] as const),
  departmentId: z.coerce.number(),
  status: z.enum(['active', 'inactive', 'archived'] as const),
  prerequisites: z.array(z.number()).optional(),
  programIds: z.array(z.number()).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid course ID' },
        { status: 400 }
      );
    }

    const course = await prisma.courses.findUnique({
      where: { id },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        prerequisites: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        courseOfferings: {
          include: {
            semester: true,
            sections: {
              include: {
                faculty: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        clos: {
          where: {
            status: 'active',
          },
          orderBy: {
            code: 'asc',
          },
        },
        programs: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: course,
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateCourseSchema.parse(body);

    // Check if course exists
    const existingCourse = await prisma.courses.findUnique({
      where: { id: parseInt(params.id) },
    });

    if (!existingCourse) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if code is already taken by another course
    if (validatedData.code !== existingCourse.code) {
      const codeExists = await prisma.courses.findFirst({
        where: {
          code: validatedData.code,
          id: { not: parseInt(params.id) },
        },
      });

      if (codeExists) {
        return NextResponse.json(
          { success: false, error: 'Course code already exists' },
          { status: 400 }
        );
      }
    }

    // Validate that theoryHours + labHours = creditHours
    if (
      validatedData.theoryHours &&
      validatedData.labHours &&
      validatedData.theoryHours + validatedData.labHours !==
        validatedData.creditHours
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Theory hours plus lab hours must equal total credit hours',
        },
        { status: 400 }
      );
    }

    const { prerequisites, programIds, ...updateData } = validatedData;

    const course = await prisma.courses.update({
      where: { id: parseInt(params.id) },
      data: {
        ...updateData,
        prerequisites: prerequisites
          ? {
              set: [], // Clear existing prerequisites
              connect: prerequisites.map((id) => ({ id })),
            }
          : undefined,
        programs: programIds
          ? {
              set: [], // Clear existing program mappings
              connect: programIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        prerequisites: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        programs: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        clos: {
          where: {
            status: 'active',
          },
          select: {
            id: true,
            code: true,
            description: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: course,
      message: 'Course updated successfully',
    });
  } catch (error) {
    console.error('Error updating course:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update course' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid course ID' },
        { status: 400 }
      );
    }

    // Check if course exists
    const existingCourse = await prisma.courses.findUnique({
      where: { id },
    });

    if (!existingCourse) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if course has any active offerings
    const activeOfferings = await prisma.courseofferings.findFirst({
      where: {
        courseId: id,
        status: 'active',
      },
    });

    if (activeOfferings) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Cannot delete course with active offerings. Please archive the course instead.',
        },
        { status: 400 }
      );
    }

    // Delete course
    await prisma.courses.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}
