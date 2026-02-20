import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { getCurrentDepartmentId } from '@/lib/auth';

// GET /api/courses/[id]/llos
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { success } = await requireAuth(req);
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const courseId = parseInt(params.id);

    if (isNaN(courseId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid course ID' },
        { status: 400 }
      );
    }

    // Get current department ID from request
    const departmentId = await getCurrentDepartmentId(req);
    if (!departmentId) {
      return NextResponse.json(
        { success: false, error: 'Department not configured' },
        { status: 400 }
      );
    }

    // Verify course belongs to department
    const course = await prisma.courses.findUnique({
      where: { id: courseId },
      select: { departmentId: true },
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

    const llos = await prisma.llos.findMany({
      where: {
        courseId: courseId,
        status: 'active',
      },
      orderBy: {
        code: 'asc',
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

// POST /api/courses/[id]/llos
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { success, user } = await requireAuth(req);
    if (!success || user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const courseId = parseInt(params.id);
    if (isNaN(courseId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid course id' },
        { status: 400 }
      );
    }

    // Get current department ID from request
    const departmentId = await getCurrentDepartmentId(req);
    if (!departmentId) {
      return NextResponse.json(
        { success: false, error: 'Department not configured' },
        { status: 400 }
      );
    }

    // Verify course belongs to department
    const course = await prisma.courses.findUnique({
      where: { id: courseId },
      select: { departmentId: true },
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

    const { code, description, bloomLevel, status } = await req.json();

    if (!code || !description) {
      return NextResponse.json(
        { success: false, error: 'Code and description are required' },
        { status: 400 }
      );
    }

    // Check if LLO code already exists for this course
    const existingLLO = await prisma.llos.findFirst({
      where: {
        code,
        courseId,
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
        code,
        description,
        courseId,
        bloomLevel: bloomLevel || null,
        status: (status || 'active') as any,
      },
    });

    return NextResponse.json({ success: true, data: llo });
  } catch (error) {
    console.error('Error creating LLO:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create LLO' },
      { status: 500 }
    );
  }
}

