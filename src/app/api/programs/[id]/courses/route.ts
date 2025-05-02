import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const programCourses = await prisma.programCourse.findMany({
      where: { programId: parseInt(params.id) },
      include: {
        course: true,
      },
      orderBy: {
        semester: 'asc',
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      include: { userrole: { include: { role: true } } },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRoles = user.userrole.map((ur) => ur.role.name);
    const allowedRoles = ['super_admin', 'sub_admin', 'department_admin'];

    if (!userRoles.some((role) => allowedRoles.includes(role))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
    const program = await prisma.program.findUnique({
      where: { id: parseInt(params.id) },
    });

    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if course is already in program
    const existingCourse = await prisma.programCourse.findUnique({
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

    const programCourse = await prisma.programCourse.create({
      data: {
        programId: parseInt(params.id),
        courseId,
        semester,
        isCore,
        creditHours,
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      include: { userrole: { include: { role: true } } },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRoles = user.userrole.map((ur) => ur.role.name);
    const allowedRoles = ['super_admin', 'sub_admin', 'department_admin'];

    if (!userRoles.some((role) => allowedRoles.includes(role))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { courseId, semester, isCore, creditHours } = body;

    // Check if program course exists
    const programCourse = await prisma.programCourse.findUnique({
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

    const updatedProgramCourse = await prisma.programCourse.update({
      where: {
        programId_courseId: {
          programId: parseInt(params.id),
          courseId,
        },
      },
      data: {
        semester,
        isCore,
        creditHours,
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      include: { userrole: { include: { role: true } } },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRoles = user.userrole.map((ur) => ur.role.name);
    const allowedRoles = ['super_admin', 'sub_admin', 'department_admin'];

    if (!userRoles.some((role) => allowedRoles.includes(role))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
    const programCourse = await prisma.programCourse.findUnique({
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

    await prisma.programCourse.delete({
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
