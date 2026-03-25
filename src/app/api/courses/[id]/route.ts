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
  type: z.enum(['THEORY', 'LAB', 'THEORY_LAB', 'PROJECT', 'THESIS'] as const),
  status: z.enum(['active', 'inactive', 'archived'] as const),
  prerequisites: z.array(z.number()).optional(),
  programIds: z.array(z.number()).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Check authentication
    const { requireAuth } = await import('@/lib/auth');
    const { success, user, error } = await requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Handle both sync and async params
    const resolvedParams = params instanceof Promise ? await params : params;
    
    if (!resolvedParams?.id) {
      return NextResponse.json(
        { success: false, error: 'Course ID is required' },
        { status: 400 }
      );
    }

    const id = parseInt(resolvedParams.id);

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
        courses_A: {
          include: { courseA: { select: { id: true, code: true, name: true } } },
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
                        email: true,
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
        programMappings: {
          include: { program: { select: { id: true, name: true, code: true } } },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Transform sections with faculty into faculty array
    const facultyList: Array<{
      faculty: {
        id: number;
        name: string;
        email: string;
      };
    }> = [];

    // Extract unique faculty from all course offerings' sections
    const facultyMap = new Map<
      number,
      { id: number; name: string; email: string }
    >();

    course.courseOfferings?.forEach((offering) => {
      offering.sections?.forEach((section) => {
        if (section.faculty) {
          const facultyId = section.faculty.id;
          if (!facultyMap.has(facultyId)) {
            facultyMap.set(facultyId, {
              id: section.faculty.id,
              name: `${section.faculty.user.first_name} ${section.faculty.user.last_name}`,
              email: section.faculty.user.email || '',
            });
          }
        }
      });
    });

    // Convert map to array
    facultyMap.forEach((faculty) => {
      facultyList.push({ faculty });
    });

    // Transform course data to include faculty field
    const transformedCourse = {
      ...course,
      faculty: facultyList,
    };

    return NextResponse.json({
      success: true,
      data: {
        id: transformedCourse.id,
        code: transformedCourse.code,
        name: transformedCourse.name,
        description: transformedCourse.description,
        creditHours: transformedCourse.creditHours,
        theoryHours: transformedCourse.theoryHours,
        labHours: transformedCourse.labHours,
        type: transformedCourse.type,
        status: transformedCourse.status,
        department: transformedCourse.department,
        prerequisites: (transformedCourse.courses_A || []).map((r: any) => r.courseA),
        programs: (transformedCourse.programMappings || []).map((r: any) => r.program),
        stats: {
          clos: transformedCourse.clos?.length || 0,
          offerings: transformedCourse.courseOfferings?.length || 0,
        },
      },
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
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Check authentication
    const { requireAuth, requireRole } = await import('@/lib/auth');
    const { success, user, error } = await requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check role - only admins and super_admins can update courses
    const { success: roleSuccess, error: roleError } = await requireRole(request, [
      'admin',
      'super_admin',
    ]);
    if (!roleSuccess) {
      return NextResponse.json(
        { success: false, error: roleError || 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Handle both sync and async params
    const resolvedParams = params instanceof Promise ? await params : params;
    
    if (!resolvedParams?.id) {
      return NextResponse.json(
        { success: false, error: 'Course ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateCourseSchema.parse(body);
    const id = parseInt(resolvedParams.id);

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

    // Check if code is already taken by another course
    if (validatedData.code !== existingCourse.code) {
      const codeExists = await prisma.courses.findFirst({
        where: {
          code: validatedData.code,
          id: { not: id },
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
        courses_A: course.courses_A.map((r: any) => r.courseA),
        programs: course.programMappings.map((r: any) => r.program),
        programMappings: undefined,
      },
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
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Check authentication
    const { requireAuth, requireRole } = await import('@/lib/auth');
    const { success, user, error } = await requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check role - only admins and super_admins can delete courses
    const { success: roleSuccess, error: roleError } = await requireRole(request, [
      'admin',
      'super_admin',
    ]);
    if (!roleSuccess) {
      return NextResponse.json(
        { success: false, error: roleError || 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Handle both sync and async params
    const resolvedParams = params instanceof Promise ? await params : params;
    
    if (!resolvedParams?.id) {
      return NextResponse.json(
        { success: false, error: 'Course ID is required' },
        { status: 400 }
      );
    }

    const id = parseInt(resolvedParams.id);

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
