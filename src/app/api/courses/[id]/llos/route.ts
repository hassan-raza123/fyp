import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { resolveDepartmentScope } from '@/lib/authz';

// GET /api/courses/[id]/llos
export async function GET(
  req: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params;
  try {
    const { success, user } = await requireAuth(req);
    if (!success || !user) {
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

    // A super_admin belongs to no department, so `null` here means "every
    // department" rather than "misconfigured account". The ownership check
    // below is skipped for them accordingly.
    const scope = await resolveDepartmentScope(req, user!);
    if (scope.error) return scope.error;
    const departmentId = scope.departmentId;

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

    if (departmentId !== null && course.departmentId !== departmentId) {
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
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params;
  try {
    const { success, user } = await requireAuth(req);
    if (!success || user?.role !== 'admin' && user?.role !== 'super_admin') {
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

    // A super_admin belongs to no department, so `null` here means "every
    // department" rather than "misconfigured account". The ownership check
    // below is skipped for them accordingly.
    const scope = await resolveDepartmentScope(req, user!);
    if (scope.error) return scope.error;
    const departmentId = scope.departmentId;

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

    if (departmentId !== null && course.departmentId !== departmentId) {
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

