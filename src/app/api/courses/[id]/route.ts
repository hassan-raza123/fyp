import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

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
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const course = await prisma.course.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        course_A: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        course_B: {
          select: {
            id: true,
            code: true,
            name: true,
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

    // Transform the data to match the frontend interface
    const transformedCourse = {
      ...course,
      status: course.status.toUpperCase() as 'ACTIVE' | 'INACTIVE' | 'ARCHIVED',
      prerequisites: course.course_A.map((c) => ({
        prerequisite: {
          id: c.id,
          code: c.code,
          name: c.name,
        },
      })),
      corequisites: course.course_B.map((c) => ({
        corequisite: {
          id: c.id,
          code: c.code,
          name: c.name,
        },
      })),
    };

    return NextResponse.json({ success: true, data: transformedCourse });
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validatedData = updateCourseSchema.parse(body);

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
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
      const codeExists = await prisma.course.findFirst({
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

    const course = await prisma.course.update({
      where: { id: parseInt(params.id) },
      data: validatedData,
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...course,
        status: course.status.toUpperCase() as
          | 'ACTIVE'
          | 'INACTIVE'
          | 'ARCHIVED',
      },
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
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        sections: true,
        course_A: true,
        course_B: true,
      },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if course has any sections
    if (course.sections.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete course with active sections',
        },
        { status: 400 }
      );
    }

    // Check if course is a prerequisite or corequisite for other courses
    if (course.course_A.length > 0 || course.course_B.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Cannot delete course that is a prerequisite or corequisite for other courses',
        },
        { status: 400 }
      );
    }

    await prisma.course.delete({
      where: { id: parseInt(params.id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}
