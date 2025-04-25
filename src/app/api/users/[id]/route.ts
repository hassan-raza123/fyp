import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { cookies } from 'next/headers';

// GET /api/users/[id] - Get a specific user
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        userrole: {
          include: {
            role: true,
          },
        },
        faculty: true,
        student: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update a user
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      role,
      status,
      departmentId,
      programId,
      employeeId,
      rollNumber,
    } = body;

    const user = await prisma.user.update({
      where: { id: parseInt(params.id) },
      data: {
        first_name: firstName,
        last_name: lastName,
        email,
        status,
        userrole: {
          update: {
            role: {
              connect: { name: role },
            },
          },
        },
        ...(role === 'teacher' && {
          faculty: {
            update: {
              employeeId,
              departmentId,
            },
          },
        }),
        ...(role === 'student' && {
          student: {
            update: {
              rollNumber,
              departmentId,
              programId,
            },
          },
        }),
      },
      include: {
        userrole: {
          include: {
            role: true,
          },
        },
        faculty: true,
        student: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete a user
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user to be deleted
    const userToDelete = await prisma.user.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        userrole: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get current user's role
    const currentUser = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      include: {
        userrole: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Current user not found' },
        { status: 404 }
      );
    }

    // Check if current user is admin
    const isAdmin = currentUser.userrole.some(
      (ur) => ur.role.name === 'super_admin' || ur.role.name === 'sub_admin'
    );

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can delete users' },
        { status: 403 }
      );
    }

    // Delete the user
    await prisma.user.delete({
      where: { id: parseInt(params.id) },
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
