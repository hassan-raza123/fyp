import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  authorize,
  canManageCourse,
  courseScopeFilter,
  forbidden,
} from '@/lib/authz';

// GET /api/clos
export async function GET(request: NextRequest) {
  try {
    // CLOs are course configuration. A student reads their own attainment
    // through /api/student/clo-attainments, which resolves them from the
    // session; this endpoint describes the course, not the caller.
    const auth = await authorize(request, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const courseIdParam = searchParams.get('courseId');
    const courseId = courseIdParam ? Number(courseIdParam) : null;

    if (courseId !== null && Number.isNaN(courseId)) {
      return NextResponse.json({ error: 'Invalid courseId' }, { status: 400 });
    }

    const scope = await courseScopeFilter(request, auth.user, courseId);
    if ('error' in scope) return scope.error;

    const where = scope.where;

    const clos = await prisma.clos.findMany({
      where,
      include: {
        course: {
          include: {
            programMappings: { include: { program: true } },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const data = clos.map((clo) => ({
      ...clo,
      course: {
        ...clo.course,
        programs: clo.course.programMappings.map((m) => m.program),
        programMappings: undefined,
      },
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching CLOs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch CLOs' },
      { status: 500 }
    );
  }
}

// POST /api/clos
export async function POST(req: NextRequest) {
  try {
    const auth = await authorize(req, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;

    const data = await req.json();
    const { code, description, courseId, bloomLevel, status } = data;

    // Validate required fields
    if (!code || !description || !courseId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate code format
    const codeRegex = /^CLO\d+$/;
    if (!codeRegex.test(code)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid CLO code format. Use format: CLO1, CLO2, etc.',
        },
        { status: 400 }
      );
    }

    // Check if course exists
    const course = await prisma.courses.findUnique({
      where: { id: courseId },
    });

    // `courseId` comes from the body: a CLO planted in another department's
    // course becomes part of its attainment chain.
    if (!(await canManageCourse(req, auth.user, courseId))) {
      return forbidden('You do not have access to this course').response;
    }

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if CLO code already exists for the course
    const existingCLO = await prisma.clos.findFirst({
      where: {
        code,
        courseId,
      },
    });

    if (existingCLO) {
      return NextResponse.json(
        { success: false, error: 'CLO code already exists for this course' },
        { status: 400 }
      );
    }

    // Create CLO
    const clo = await prisma.clos.create({
      data: {
        code,
        description,
        courseId,
        bloomLevel,
        status: status || 'active',
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

    return NextResponse.json({ success: true, data: clo });
  } catch (error) {
    console.error('Error creating CLO:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/clos
export async function PUT(request: Request) {
  try {
    const auth = await authorize(request as NextRequest, [
      'super_admin',
      'admin',
      'faculty',
    ]);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const { id, code, description, courseId, bloomLevel, status } = body;

    if (!id || !code || !description || !courseId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate code format
    const codeRegex = /^CLO\d+$/;
    if (!codeRegex.test(code)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid CLO code format. Use format: CLO1, CLO2, etc.',
        },
        { status: 400 }
      );
    }

    // Check if CLO exists
    const existingCLO = await prisma.clos.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingCLO) {
      return NextResponse.json(
        { success: false, error: 'CLO not found' },
        { status: 404 }
      );
    }

    // Both the CLO's current course and the target course are checked, so a
    // CLO cannot be moved into — or out of — a course the caller cannot reach.
    // This mirrors `clos/[id]` PUT, which already did it.
    const req = request as NextRequest;
    const allowedOnCurrent = await canManageCourse(
      req,
      auth.user,
      existingCLO.courseId
    );
    const allowedOnTarget = await canManageCourse(
      req,
      auth.user,
      parseInt(courseId)
    );
    if (!allowedOnCurrent || !allowedOnTarget) {
      return forbidden('You do not have access to this course').response;
    }

    // Check if CLO code already exists for the course (excluding current CLO)
    const duplicateCLO = await prisma.clos.findFirst({
      where: {
        code,
        courseId: parseInt(courseId),
        id: {
          not: parseInt(id),
        },
      },
    });

    if (duplicateCLO) {
      return NextResponse.json(
        { success: false, error: 'CLO code already exists for this course' },
        { status: 400 }
      );
    }

    // Update the CLO
    const clo = await prisma.clos.update({
      where: {
        id: parseInt(id),
      },
      data: {
        code,
        description,
        courseId: parseInt(courseId),
        bloomLevel: bloomLevel || null,
        status: status || 'active',
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

    return NextResponse.json({ success: true, data: clo });
  } catch (error) {
    console.error('Error updating CLO:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update CLO' },
      { status: 500 }
    );
  }
}
