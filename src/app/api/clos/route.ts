import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/clos
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    const where = {
      ...(courseId && { courseId: Number(courseId) }),
    };

    const clos = await prisma.clos.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        code: 'asc',
      },
    });

    return NextResponse.json({ success: true, data: clos });
  } catch (error) {
    console.error('Error fetching CLOs:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/clos
export async function POST(req: Request) {
  try {
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
