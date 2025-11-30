import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, getUserIdFromRequest } from '@/lib/auth';
import { sendAdminAssignmentEmail } from '@/lib/email-utils';

// POST /api/super-admin/assign-admin-to-department - Assign admin user to a department
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(request, ['super_admin']);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Unauthorized' },
        { status: authResult.error === 'Insufficient permissions' ? 403 : 401 }
      );
    }

    const body = await request.json();
    const { userId, departmentId } = body;

    if (!userId || !departmentId) {
      return NextResponse.json(
        { success: false, error: 'User ID and Department ID are required' },
        { status: 400 }
      );
    }

    const adminUserId = parseInt(userId);
    const deptId = parseInt(departmentId);

    if (isNaN(adminUserId) || isNaN(deptId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID or department ID' },
        { status: 400 }
      );
    }

    // Verify user exists and has admin role
    const targetUser = await prisma.users.findUnique({
      where: { id: adminUserId },
      include: {
        userrole: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (targetUser.userrole?.role?.name !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'User does not have admin role' },
        { status: 400 }
      );
    }

    // Verify department exists
    const department = await prisma.departments.findUnique({
      where: { id: deptId },
    });

    if (!department) {
      return NextResponse.json(
        { success: false, error: 'Department not found' },
        { status: 404 }
      );
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check if user already has a faculty record
      const existingFaculty = await tx.faculties.findFirst({
        where: { userId: adminUserId },
      });

      if (existingFaculty) {
        // Update existing faculty record
        await tx.faculties.update({
          where: { id: existingFaculty.id },
          data: {
            departmentId: deptId,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new faculty record for admin
        await tx.faculties.create({
          data: {
            userId: adminUserId,
            departmentId: deptId,
            designation: 'Admin',
            status: 'active',
            updatedAt: new Date(),
          },
        });
      }

      // Update department's adminId only if not already set
      const dept = await tx.departments.findUnique({
        where: { id: deptId },
        select: { adminId: true },
      });

      if (!dept?.adminId) {
        await tx.departments.update({
          where: { id: deptId },
          data: {
            adminId: adminUserId,
            updatedAt: new Date(),
          },
        });
      }

      return { success: true };
    });

    // Send email notification to admin
    try {
      await sendAdminAssignmentEmail({
        email: targetUser.email,
        firstName: targetUser.first_name,
        lastName: targetUser.last_name,
        departmentName: department.name,
        departmentCode: department.code,
      });
    } catch (emailError) {
      console.error('Error sending admin assignment email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Admin assigned to department successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error assigning admin to department:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to assign admin to department',
      },
      { status: 500 }
    );
  }
}

