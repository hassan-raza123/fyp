import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';
import { hash } from 'bcryptjs';

// GET /api/users/[id] - Get a specific user
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const userId = parseInt(context.params.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const authResult = await requireAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the requesting user's role
    const requestingUserRole = await prisma.userrole.findFirst({
      where: { userId: authResult.user.userId },
      include: { role: true },
    });

    // If the requesting user is a sub_admin, don't allow access to super_admin
    if (requestingUserRole?.role.name === 'sub_admin') {
      const targetUserRole = await prisma.userrole.findFirst({
        where: { userId },
        include: { role: true },
      });

      if (targetUserRole?.role.name === 'super_admin') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Get the target user with only the required fields
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone_number: true,
        status: true,
      },
    });

    // If user not found, return not found
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return only the required user data
    return NextResponse.json(targetUser);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update a user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and get user data
    const { success, user, error } = requireAuth(request);
    if (!success) {
      return NextResponse.json({ error }, { status: 401 });
    }

    // Check if user has admin role
    if (user?.role !== 'super_admin' && user?.role !== 'sub_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { email, first_name, last_name, phone_number, status } = body;

    // Validate required fields
    if (!email || !first_name || !last_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: Number(params.id) },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if email is already taken by another user
    if (email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });
      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already taken' },
          { status: 400 }
        );
      }
    }

    // Update user data
    const updatedUser = await prisma.user.update({
      where: { id: Number(params.id) },
      data: {
        email,
        first_name,
        last_name,
        phone_number,
        status,
        updatedAt: new Date(),
      },
      include: {
        userrole: {
          include: {
            role: true,
          },
        },
      },
    });

    // Get the role name if it exists
    const userRole = updatedUser.userrole?.role?.name || null;

    return NextResponse.json({
      id: updatedUser.id,
      email: updatedUser.email,
      first_name: updatedUser.first_name,
      last_name: updatedUser.last_name,
      phone_number: updatedUser.phone_number,
      status: updatedUser.status,
      role: userRole,
    });
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
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // First validate the user ID
    const userId = parseInt(context.params.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Check authentication
    const authResult = await requireAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the requesting user's role
    const requestingUserRole = await prisma.userrole.findFirst({
      where: { userId: authResult.user.userId },
      include: { role: true },
    });

    // If the requesting user is a sub_admin, don't allow deletion of super_admin
    if (requestingUserRole?.role.name === 'sub_admin') {
      const targetUserRole = await prisma.userrole.findFirst({
        where: { userId },
        include: { role: true },
      });

      if (targetUserRole?.role.name === 'super_admin') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Prevent deletion of the first super admin (ID 1)
    if (userId === 1) {
      return NextResponse.json(
        { error: 'Cannot delete the primary super admin' },
        { status: 403 }
      );
    }

    // First delete any related records
    await prisma.userrole.deleteMany({
      where: { userId },
    });

    await prisma.faculty.deleteMany({
      where: { userId },
    });

    await prisma.student.deleteMany({
      where: { userId },
    });

    // Finally delete the user
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
