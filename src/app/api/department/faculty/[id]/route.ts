import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get the department admin's department
    const departmentAdmin = await prisma.users.findFirst({
      where: {
        id: parseInt(userId),
        departmentAdmin: {
          isNot: null,
        },
      },
      include: {
        departmentAdmin: true,
      },
    });

    if (!departmentAdmin || !departmentAdmin.departmentAdmin) {
      return NextResponse.json(
        { error: 'Department admin not found' },
        { status: 403 }
      );
    }

    const departmentId = departmentAdmin.departmentAdmin.id;
    const facultyId = parseInt(params.id);

    // Get faculty member
    const faculty = await prisma.faculty.findFirst({
      where: {
        id: facultyId,
        departmentId: departmentId, // Only allow access to faculty from admin's department
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone_number: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        sections: {
          include: {
            courseOffering: {
              include: {
                course: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                  },
                },
                semester: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            batch: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        courses: {
          include: {
            course: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!faculty) {
      return NextResponse.json(
        { error: 'Faculty member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: faculty,
    });
  } catch (error) {
    console.error('Get faculty error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get the department admin's department
    const departmentAdmin = await prisma.users.findFirst({
      where: {
        id: parseInt(userId),
        departmentAdmin: {
          isNot: null,
        },
      },
      include: {
        departmentAdmin: true,
      },
    });

    if (!departmentAdmin || !departmentAdmin.departmentAdmin) {
      return NextResponse.json(
        { error: 'Department admin not found' },
        { status: 403 }
      );
    }

    const departmentId = departmentAdmin.departmentAdmin.id;
    const facultyId = parseInt(params.id);
    const body = await request.json();

    // Check if faculty exists and belongs to admin's department
    const existingFaculty = await prisma.faculty.findFirst({
      where: {
        id: facultyId,
        departmentId: departmentId,
      },
    });

    if (!existingFaculty) {
      return NextResponse.json(
        { error: 'Faculty member not found' },
        { status: 404 }
      );
    }

    // Update faculty
    const updatedFaculty = await prisma.faculty.update({
      where: { id: facultyId },
      data: {
        employeeId: body.employeeId,
        designation: body.designation,
        status: body.status,
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone_number: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedFaculty,
      message: 'Faculty member updated successfully',
    });
  } catch (error) {
    console.error('Update faculty error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get the department admin's department
    const departmentAdmin = await prisma.users.findFirst({
      where: {
        id: parseInt(userId),
        departmentAdmin: {
          isNot: null,
        },
      },
      include: {
        departmentAdmin: true,
      },
    });

    if (!departmentAdmin || !departmentAdmin.departmentAdmin) {
      return NextResponse.json(
        { error: 'Department admin not found' },
        { status: 403 }
      );
    }

    const departmentId = departmentAdmin.departmentAdmin.id;
    const facultyId = parseInt(params.id);

    // Check if faculty exists and belongs to admin's department
    const existingFaculty = await prisma.faculty.findFirst({
      where: {
        id: facultyId,
        departmentId: departmentId,
      },
    });

    if (!existingFaculty) {
      return NextResponse.json(
        { error: 'Faculty member not found' },
        { status: 404 }
      );
    }

    // Check if faculty has active sections or courses
    const activeSections = await prisma.sections.count({
      where: {
        facultyId: facultyId,
        status: 'active',
      },
    });

    if (activeSections > 0) {
      return NextResponse.json(
        { error: 'Cannot delete faculty member with active sections' },
        { status: 400 }
      );
    }

    // Delete faculty
    await prisma.faculty.delete({
      where: { id: facultyId },
    });

    return NextResponse.json({
      success: true,
      message: 'Faculty member deleted successfully',
    });
  } catch (error) {
    console.error('Delete faculty error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
