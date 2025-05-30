import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/clos/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid CLO ID' },
        { status: 400 }
      );
    }

    const clo = await prisma.clos.findUnique({
      where: { id },
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

    if (!clo) {
      return NextResponse.json(
        { success: false, error: 'CLO not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: clo });
  } catch (error) {
    console.error('Error fetching CLO:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch CLO' },
      { status: 500 }
    );
  }
}

// PUT /api/clos/[id]
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid CLO ID' },
        { status: 400 }
      );
    }

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

    // Check if CLO exists
    const existingCLO = await prisma.clos.findUnique({
      where: { id },
    });

    if (!existingCLO) {
      return NextResponse.json(
        { success: false, error: 'CLO not found' },
        { status: 404 }
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

    // Check if CLO code already exists for the course (excluding current CLO)
    const duplicateCLO = await prisma.clos.findFirst({
      where: {
        code,
        courseId,
        id: { not: id },
      },
    });

    if (duplicateCLO) {
      return NextResponse.json(
        { success: false, error: 'CLO code already exists for this course' },
        { status: 400 }
      );
    }

    // Update CLO
    const updatedCLO = await prisma.clos.update({
      where: { id },
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

    return NextResponse.json({ success: true, data: updatedCLO });
  } catch (error) {
    console.error('Error updating CLO:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/clos/[id]
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid CLO ID' }, { status: 400 });
    }

    // Check if CLO exists
    const existingCLO = await prisma.clos.findUnique({
      where: { id },
    });

    if (!existingCLO) {
      return NextResponse.json({ error: 'CLO not found' }, { status: 404 });
    }

    // Delete CLO
    await prisma.clos.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'CLO deleted successfully' });
  } catch (error) {
    console.error('Error deleting CLO:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
