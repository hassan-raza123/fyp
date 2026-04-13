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
  type: z.enum(['THEORY', 'LAB', 'THEORY_LAB', 'PROJECT', 'THESIS'] as const),
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
    // Check authentication and authorization
    const { requireAuth } = await import('@/lib/auth');
    const { success, user } = await requireAuth(request);
    if (!success || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins, faculty, students, and super_admins can access courses
    if (user.role !== 'admin' && user.role !== 'faculty' && user.role !== 'student' && user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid role' },
        { status: 403 }
      );
    }

    // Import getCurrentDepartmentId and getFacultyIdFromRequest
    const { getCurrentDepartmentId, getFacultyIdFromRequest } = await import('@/lib/auth');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const programId = searchParams.get('programId');

    // Get current department ID from authenticated user
    const currentDepartmentId = await getCurrentDepartmentId(request);
    if (!currentDepartmentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Department not assigned. Please contact super admin.',
        },
        { status: 400 }
      );
    }

    const where: Prisma.coursesWhereInput = {
      departmentId: currentDepartmentId, // Always filter by current department
    };

    // If user is faculty, only show courses assigned to them via sections
    if (user?.role === 'faculty') {
      const facultyId = await getFacultyIdFromRequest(request);
      if (facultyId) {
        // Get course IDs from faculty's sections
        const facultySections = await prisma.sections.findMany({
          where: {
            facultyId: facultyId,
            status: 'active',
          },
          include: {
            courseOffering: {
              select: {
                courseId: true,
              },
            },
          },
        });

        const assignedCourseIds = [
          ...new Set(facultySections.map((s) => s.courseOffering.courseId)),
        ];

        if (assignedCourseIds.length > 0) {
          where.id = { in: assignedCourseIds };
        } else {
          // Faculty has no assigned courses, return empty result
          return NextResponse.json({
            success: true,
            data: [],
            pagination: {
              total: 0,
              page,
              limit,
              totalPages: 0,
            },
          });
        }
      }
    }

    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search } },
      ];
    }
    if (type && type !== 'all') {
      where.type = type as course_type;
    }
    if (status && status !== 'all') {
      where.status = status as course_status;
    }
    if (programId && programId !== 'all') {
      where.programMappings = {
        some: {
          A: parseInt(programId),
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
          include: {
            courseB: { select: { id: true, code: true, name: true } },
          },
        },
        programMappings: {
          include: {
            program: { select: { id: true, name: true, code: true } },
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

    const transformedCourses = courses.map((c) => ({
      ...c,
      courses_A: c.courses_A.map((r) => r.courseB),
      programs: c.programMappings.map((r) => r.program),
      programMappings: undefined,
    }));

    return NextResponse.json({
      success: true,
      data: transformedCourses,
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
    // Check authentication and authorization
    const { requireAuth } = await import('@/lib/auth');
    const { success, user } = await requireAuth(request);
    if (!success || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins and super_admins can create courses
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createCourseSchema.parse(body);

    // Check if course code already exists
    const existingCourse = await prisma.courses.findUnique({
      where: { code: validatedData.code },
    });

    if (existingCourse) {
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
      return NextResponse.json(
        {
          success: false,
          error: 'Theory hours plus lab hours must equal total credit hours',
        },
        { status: 400 }
      );
    }

    // Import getCurrentDepartmentId
    const { getCurrentDepartmentId } = await import('@/lib/auth');

    // Get current department ID from authenticated user (override any departmentId from form)
    const currentDepartmentId = await getCurrentDepartmentId(request);
    if (!currentDepartmentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Department not assigned. Please contact super admin.',
        },
        { status: 400 }
      );
    }

    // Extract prerequisites and programIds from validated data
    const { prerequisites, programIds, ...courseData } =
      validatedData;

    // Create the course with related data (always use current department from settings)
    const course = await prisma.courses.create({
      data: {
        ...courseData,
        department: {
          connect: { id: currentDepartmentId }, // Always use current department from settings
        },
        courses_A: prerequisites
          ? { create: prerequisites.map((B) => ({ B })) }
          : undefined,
        programMappings: programIds
          ? { create: programIds.map((A) => ({ A })) }
          : undefined,
      },
      include: {
        department: { select: { id: true, name: true, code: true } },
        courses_A: { include: { courseA: { select: { id: true, code: true, name: true } } } },
        programMappings: { include: { program: { select: { id: true, name: true, code: true } } } },
        clos: {
          where: { status: 'active' },
          select: { id: true, code: true, description: true },
        },
      },
    });

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        ...course,
        courses_A: course.courses_A.map((r) => r.courseA),
        programs: course.programMappings.map((r) => r.program),
        programMappings: undefined,
      },
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
    // Check authentication and authorization
    const { requireAuth } = await import('@/lib/auth');
    const { success, user } = await requireAuth(request);
    if (!success || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

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

    // Update course — for explicit m2m, clear and recreate junction rows
    if (prerequisites !== undefined) {
      await prisma.courseprerequisites.deleteMany({ where: { A: id } });
    }
    if (programIds !== undefined) {
      await prisma.programcourses.deleteMany({ where: { B: id } });
    }

    const course = await prisma.courses.update({
      where: { id },
      data: {
        ...updateData,
        courses_A: prerequisites
          ? { create: prerequisites.map((B) => ({ B })) }
          : undefined,
        programMappings: programIds
          ? { create: programIds.map((A) => ({ A })) }
          : undefined,
      },
      include: {
        department: { select: { id: true, name: true, code: true } },
        courses_A: { include: { courseA: { select: { id: true, code: true, name: true } } } },
        programMappings: { include: { program: { select: { id: true, name: true, code: true } } } },
        clos: {
          where: { status: 'active' },
          select: { id: true, code: true, description: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...course,
        courses_A: course.courses_A.map((r) => r.courseA),
        programs: course.programMappings.map((r) => r.program),
        programMappings: undefined,
      },
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
    // Check authentication and authorization
    const { requireAuth } = await import('@/lib/auth');
    const { success, user } = await requireAuth(request);
    if (!success || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

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
