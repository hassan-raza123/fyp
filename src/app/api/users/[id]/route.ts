import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';

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

    // Get the target user with their role, faculty, and student data
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
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

    // If user not found or is a super admin, return not found
    if (!targetUser || targetUser.userrole[0]?.role.name === 'super_admin') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return the user data without the super admin
    return NextResponse.json({
      id: targetUser.id,
      email: targetUser.email,
      first_name: targetUser.first_name,
      last_name: targetUser.last_name,
      status: targetUser.status,
      userrole: targetUser.userrole.map((ur) => ({
        role: {
          name: ur.role.name,
        },
      })),
      faculty: targetUser.faculty,
      student: targetUser.student,
    });
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

    const body = await request.json();
    const {
      first_name,
      last_name,
      email,
      status,
      role,
      employeeId,
      rollNumber,
      departmentId,
      programId,
    } = body;

    // Check if trying to set super_admin role
    if (role === 'super_admin') {
      // Check if there's already a super admin
      const existingSuperAdmin = await prisma.userrole.findFirst({
        where: {
          role: {
            name: 'super_admin',
          },
        },
      });

      if (existingSuperAdmin) {
        return NextResponse.json(
          { error: 'Only one super admin can exist in the system' },
          { status: 400 }
        );
      }
    }

    // First, update the user's basic information
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        first_name,
        last_name,
        email,
        status,
        updatedAt: new Date(),
      },
    });

    // If role is provided, update the user's role
    if (role) {
      // First delete existing roles
      await prisma.userrole.deleteMany({
        where: { userId },
      });

      // Then create new role
      await prisma.userrole.create({
        data: {
          userId,
          roleId:
            role === 'super_admin'
              ? 1
              : role === 'sub_admin'
              ? 2
              : role === 'department_admin'
              ? 3
              : role === 'teacher'
              ? 4
              : 5, // student
          updatedAt: new Date(),
        },
      });
    }

    // Handle teacher data
    if (role === 'teacher' && employeeId && departmentId) {
      await prisma.faculty.upsert({
        where: { userId },
        update: {
          employeeId,
          departmentId: parseInt(departmentId),
          updatedAt: new Date(),
        },
        create: {
          userId,
          employeeId,
          departmentId: parseInt(departmentId),
          designation: 'Teacher',
          joiningDate: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    // Handle student data
    if (role === 'student' && rollNumber && departmentId && programId) {
      await prisma.student.upsert({
        where: { userId },
        update: {
          rollNumber,
          departmentId: parseInt(departmentId),
          programId: parseInt(programId),
          updatedAt: new Date(),
        },
        create: {
          userId,
          rollNumber,
          departmentId: parseInt(departmentId),
          programId: parseInt(programId),
          batch: new Date().getFullYear().toString(),
          admissionDate: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    // Fetch the updated user with all related data
    const finalUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        status: true,
        userrole: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
        faculty: {
          select: {
            employeeId: true,
            departmentId: true,
          },
        },
        student: {
          select: {
            rollNumber: true,
            departmentId: true,
            programId: true,
          },
        },
      },
    });

    return NextResponse.json(finalUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
