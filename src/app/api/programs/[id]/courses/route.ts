import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize, canAccessProgram, forbiddenResponse } from '@/lib/authz';

export async function GET(
  request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params;
  try {
    const auth = await authorize(request, [
      'super_admin',
      'admin',
      'faculty',
      'student',
    ]);
    if (!auth.ok) return auth.response;

    // Staff are scoped to their department; a student may read the curriculum
    // of a programme they are enrolled in.
    if (!(await canAccessProgram(request, auth.user, parseInt(params.id)))) {
      return forbiddenResponse();
    }

    const programCourses = await prisma.program_curriculum.findMany({
      where: { programId: parseInt(params.id) },
      include: {
        course: true,
      },
      orderBy: {
        semesterSlot: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: programCourses,
    });
  } catch (error) {
    console.error('Error fetching program courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch program courses' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params;
  try {
    // Mapping courses into a program is curriculum configuration: admins only,
    // and only for their own department's programmes.
    const auth = await authorize(request, ['super_admin', 'admin']);
    if (!auth.ok) return auth.response;

    if (!(await canAccessProgram(request, auth.user, parseInt(params.id)))) {
      return forbiddenResponse();
    }

    const body = await request.json();
    const { courseId, semester, isCore, creditHours } = body;

    // Validate required fields
    if (!courseId || !semester || !creditHours) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if program exists
    const program = await prisma.programs.findUnique({
      where: { id: parseInt(params.id) },
    });

    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    // Check if course exists
    const course = await prisma.courses.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if course is already in program
    const existingCourse = await prisma.program_curriculum.findUnique({
      where: {
        programId_courseId: {
          programId: parseInt(params.id),
          courseId,
        },
      },
    });

    if (existingCourse) {
      return NextResponse.json(
        { error: 'Course already exists in program' },
        { status: 400 }
      );
    }

    const programCourse = await prisma.program_curriculum.create({
      data: {
        programId: parseInt(params.id),
        courseId,
        semesterSlot: semester,
        isRequired: isCore ?? true,
      },
      include: {
        course: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: programCourse,
    });
  } catch (error) {
    console.error('Error adding course to program:', error);
    return NextResponse.json(
      { error: 'Failed to add course to program' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params;
  try {
    // Mapping courses into a program is curriculum configuration: admins only,
    // and only for their own department's programmes.
    const auth = await authorize(request, ['super_admin', 'admin']);
    if (!auth.ok) return auth.response;

    if (!(await canAccessProgram(request, auth.user, parseInt(params.id)))) {
      return forbiddenResponse();
    }

    const body = await request.json();
    const { courseId, semester, isCore, creditHours } = body;

    // Check if program course exists
    const programCourse = await prisma.program_curriculum.findUnique({
      where: {
        programId_courseId: {
          programId: parseInt(params.id),
          courseId,
        },
      },
    });

    if (!programCourse) {
      return NextResponse.json(
        { error: 'Course not found in program' },
        { status: 404 }
      );
    }

    const updatedProgramCourse = await prisma.program_curriculum.update({
      where: {
        programId_courseId: {
          programId: parseInt(params.id),
          courseId,
        },
      },
      data: {
        semesterSlot: semester,
        isRequired: isCore ?? programCourse.isRequired,
      },
      include: {
        course: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedProgramCourse,
    });
  } catch (error) {
    console.error('Error updating program course:', error);
    return NextResponse.json(
      { error: 'Failed to update program course' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params;
  try {
    // Mapping courses into a program is curriculum configuration: admins only,
    // and only for their own department's programmes.
    const auth = await authorize(request, ['super_admin', 'admin']);
    if (!auth.ok) return auth.response;

    if (!(await canAccessProgram(request, auth.user, parseInt(params.id)))) {
      return forbiddenResponse();
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // Check if program course exists
    const programCourse = await prisma.program_curriculum.findUnique({
      where: {
        programId_courseId: {
          programId: parseInt(params.id),
          courseId: parseInt(courseId),
        },
      },
    });

    if (!programCourse) {
      return NextResponse.json(
        { error: 'Course not found in program' },
        { status: 404 }
      );
    }

    await prisma.program_curriculum.delete({
      where: {
        programId_courseId: {
          programId: parseInt(params.id),
          courseId: parseInt(courseId),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Course removed from program successfully',
    });
  } catch (error) {
    console.error('Error removing course from program:', error);
    return NextResponse.json(
      { error: 'Failed to remove course from program' },
      { status: 500 }
    );
  }
}
