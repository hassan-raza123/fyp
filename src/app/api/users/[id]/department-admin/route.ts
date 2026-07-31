import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { authorize, canManageUser, forbiddenResponse } from '@/lib/authz';
import { writeAuditLog } from '@/lib/audit-log';

export async function POST(
  request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params;
  try {
    const auth = await authorize(request, ['super_admin', 'admin']);
    if (!auth.ok) return auth.response;
    const user = auth.user;

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Promoting an account to department admin is a privilege grant; it must
    // stay inside the department the caller actually runs.
    if (!(await canManageUser(request, user, userId))) {
      return forbiddenResponse();
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
      const existingUser = await tx.users.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        throw new Error('User not found');
      }

      // Check if department exists
      const department = await tx.departments.findUnique({
        where: { id: departmentId },
      });

      if (!department) {
        throw new Error('Department not found');
      }

      // Remove any existing admin role
      await tx.userroles.deleteMany({
        where: {
          userId,
          role: {
            name: 'admin',
          },
        },
      });

      // Remove any existing faculty record
      await tx.faculties.deleteMany({
        where: {
          userId,
          designation: 'Admin',
        },
      });

      // Get the admin role
      const adminRole = await tx.roles.findUnique({
        where: { name: 'admin' },
      });

      if (!adminRole) {
        throw new Error('Admin role not found');
      }

      // Create the admin role
      await tx.userroles.create({
        data: {
          userId,
          roleId: adminRole.id,
        },
      });

      // Create faculty record
      await tx.faculties.create({
        data: {
          userId,
          departmentId,
          designation: 'Admin',
          status: 'active' as const,
          updatedAt: new Date(),
        },
      });

      // Update department's adminId
      await tx.departments.update({
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
