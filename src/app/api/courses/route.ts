import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma, course_type, course_status } from '@prisma/client';

const createCourseSchema = z.object({
  code: z.string().min(1, 'Course code is required'),
  name: z.string().min(1, 'Course name is required'),
  description: z.string().optional(),
  creditHours: z.coerce.number().min(1, 'Credit hours must be at least 1'),
  theoryHours: z.coerce.number().min(0, 'Theory hours cannot be negative'),
  labHours: z.coerce.number().min(0, 'Lab hours cannot be negative'),
  type: z.enum(['THEORY', 'LAB', 'PROJECT', 'THESIS'] as const),
  departmentId: z.coerce.number().min(1, 'Department is required'),
  status: z.enum(['active', 'inactive', 'archived'] as const).default('active'),
  prerequisites: z.array(z.number()).optional(),
  programIds: z.array(z.number()).optional(),
});

const updateCourseSchema = createCourseSchema.partial().extend({
  id: z.number().optional(),
});

type CreateCourseInput = z.infer<typeof createCourseSchema>;
type UpdateCourseInput = z.infer<typeof updateCourseSchema>;

interface CourseResponse {
  id: number;
  code: string;
  name: string;
  description: string | null;
  creditHours: number;
  theoryHours: number;
  labHours: number;
  type: course_type;
  department: {
    id: number;
    name: string;
    code: string;
  };
  status: course_status;
  courses_A: {
    id: number;
    code: string;
    name: string;
  }[];
  programs: {
    id: number;
    name: string;
    code: string;
  }[];
  clos: {
    id: number;
    code: string;
    description: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const departmentId = searchParams.get('departmentId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const programId = searchParams.get('programId');

    const where: Prisma.coursesWhereInput = {};

    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search } },
      ];
    }
    if (departmentId && departmentId !== 'all') {
      where.departmentId = parseInt(departmentId);
    }
    if (type && type !== 'all') {
      where.type = type as course_type;
    }
    if (status && status !== 'all') {
      where.status = status as course_status;
    }
    if (programId && programId !== 'all') {
      where.programs = {
        some: {
          id: parseInt(programId),
        },
      };
    }

    // First get total count
    const total = await prisma.courses.count({ where });

    // Then get paginated data
    const courses = await prisma.courses.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { code: 'asc' },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        courses_A: {
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
      data: courses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Course POST request received');

    // Parse and validate request body
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    const validatedData = createCourseSchema.parse(body);
    console.log('Validated data:', JSON.stringify(validatedData, null, 2));

    // Check if course code already exists
    const existingCourse = await prisma.courses.findUnique({
      where: { code: validatedData.code },
    });

    if (existingCourse) {
      console.log('Course code already exists:', validatedData.code);
      return NextResponse.json(
        { success: false, error: 'Course code already exists' },
        { status: 400 }
      );
    }

    // Validate theory and lab hours
    if (
      validatedData.theoryHours + validatedData.labHours !==
      validatedData.creditHours
    ) {
      console.log('Invalid hours configuration:', {
        theoryHours: validatedData.theoryHours,
        labHours: validatedData.labHours,
        creditHours: validatedData.creditHours,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Theory hours plus lab hours must equal total credit hours',
        },
        { status: 400 }
      );
    }

    // Extract prerequisites and programIds from validated data
    const { prerequisites, programIds, ...courseData } = validatedData;
    console.log('Course data to create:', JSON.stringify(courseData, null, 2));
    console.log('Prerequisites:', prerequisites);
    console.log('Program IDs:', programIds);

    // Create the course with related data
    const course = await prisma.courses.create({
      data: {
        ...courseData,
        courses_A: prerequisites
          ? {
              connect: prerequisites.map((id) => ({ id })),
            }
          : undefined,
        programs: programIds
          ? {
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
        courses_A: {
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

    console.log(
      'Course created successfully:',
      JSON.stringify(course, null, 2)
    );

    // Return success response
    return NextResponse.json({
      success: true,
      data: course,
      message: 'Course created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', JSON.stringify(error.errors, null, 2));
      return NextResponse.json(
        { success: false, error: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating course:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      errorObject: JSON.stringify(error, null, 2),
    });

    return NextResponse.json(
      { success: false, error: 'Failed to create course' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = updateCourseSchema.parse(body);

    if (!validatedData.id) {
      return NextResponse.json(
        { success: false, error: 'Course ID is required' },
        { status: 400 }
      );
    }

    const { id, prerequisites, programIds, ...updateData } = validatedData;

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

    // Validate theory and lab hours if both are provided
    if (
      updateData.theoryHours &&
      updateData.labHours &&
      updateData.creditHours
    ) {
      if (
        updateData.theoryHours + updateData.labHours !==
        updateData.creditHours
      ) {
        return NextResponse.json(
          {
            success: false,
            error: 'Theory hours plus lab hours must equal total credit hours',
          },
          { status: 400 }
        );
      }
    }

    // Update course
    const course = await prisma.courses.update({
      where: { id },
      data: {
        ...updateData,
        courses_A: prerequisites
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
        courses_A: {
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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating course:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update course' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // Check if course exists
    const existingCourse = await prisma.courses.findUnique({
      where: { id: parseInt(id) },
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
        courseId: parseInt(id),
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
      where: { id: parseInt(id) },
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
