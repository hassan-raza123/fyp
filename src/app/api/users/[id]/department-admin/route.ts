import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and get user data
    const { success, user, error } = requireAuth(request);
    if (!success) {
      return NextResponse.json({ success: false, error }, { status: 401 });
    }

    // Check if user has admin role
    if (user?.role !== 'super_admin' && user?.role !== 'sub_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const { departmentId } = await request.json();

    if (!departmentId) {
      return NextResponse.json(
        { success: false, error: 'Department ID is required' },
        { status: 400 }
      );
    }

    // Start a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check if user exists
      const existingUser = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        throw new Error('User not found');
      }

      // Check if department exists
      const department = await tx.department.findUnique({
        where: { id: departmentId },
      });

      if (!department) {
        throw new Error('Department not found');
      }

      // Remove any existing department admin role
      await tx.userrole.deleteMany({
        where: {
          userId,
          role: {
            name: 'department_admin',
          },
        },
      });

      // Remove any existing faculty record
      await tx.faculty.deleteMany({
        where: {
          userId,
          designation: 'Department Admin',
        },
      });

      // Get the department admin role
      const departmentAdminRole = await tx.role.findUnique({
        where: { name: 'department_admin' },
      });

      if (!departmentAdminRole) {
        throw new Error('Department admin role not found');
      }

      // Create the department admin role
      await tx.userrole.create({
        data: {
          userId,
          roleId: departmentAdminRole.id,
        },
      });

      // Create faculty record
      await tx.faculty.create({
        data: {
          userId,
          departmentId,
          designation: 'Department Admin',
          status: 'active' as const,
          updatedAt: new Date(),
        },
      });

      // Update department's adminId
      await tx.department.update({
        where: { id: departmentId },
        data: {
          adminId: userId,
          updatedAt: new Date(),
        },
      });

      return { success: true };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error assigning department admin:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to assign department admin',
      },
      { status: 500 }
    );
  }
}
