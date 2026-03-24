import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { getCurrentDepartmentId } from '@/lib/auth';

const createLLOSchema = z.object({
  code: z.string().min(1, 'LLO code is required'),
  description: z.string().min(1, 'Description is required'),
  courseId: z.number().min(1, 'Course is required'),
  bloomLevel: z.string().optional(),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
});

// GET /api/llos
export async function GET(request: NextRequest) {
  try {
    const { success, user } = await requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    // Get current department ID for filtering
    const departmentId = await getCurrentDepartmentId(request);
    if (!departmentId) {
      return NextResponse.json(
        { success: false, error: 'Department not configured' },
        { status: 400 }
      );
    }

    const where: any = {
      course: {
        departmentId: departmentId,
      },
    };

    if (courseId) {
      where.courseId = Number(courseId);
    }

    const llos = await prisma.llos.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, data: llos });
  } catch (error) {
    console.error('Error fetching LLOs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch LLOs' },
      { status: 500 }
    );
  }
}

// POST /api/llos
export async function POST(request: NextRequest) {
  try {
    const { success, user } = await requireAuth(request);
    if (!success || user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createLLOSchema.parse(body);

    // Get current department ID
    const departmentId = await getCurrentDepartmentId(request);
    if (!departmentId) {
      return NextResponse.json(
        { success: false, error: 'Department not configured' },
        { status: 400 }
      );
    }

    // Check if course exists and belongs to department
    const course = await prisma.courses.findUnique({
      where: { id: validatedData.courseId },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    if (course.departmentId !== departmentId) {
      return NextResponse.json(
        { success: false, error: 'Course does not belong to current department' },
        { status: 403 }
      );
    }

    // Check if LLO code already exists for the course
    const existingLLO = await prisma.llos.findFirst({
      where: {
        code: validatedData.code,
        courseId: validatedData.courseId,
      },
    });

    if (existingLLO) {
      return NextResponse.json(
        { success: false, error: 'LLO code already exists for this course' },
        { status: 400 }
      );
    }

    // Create LLO
    const llo = await prisma.llos.create({
      data: {
        code: validatedData.code,
        description: validatedData.description,
        courseId: validatedData.courseId,
        bloomLevel: (validatedData.bloomLevel || null) as any,
        status: validatedData.status as any,
      },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: llo });
  } catch (error) {
    console.error('Error creating LLO:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create LLO' },
      { status: 500 }
    );
  }
}

