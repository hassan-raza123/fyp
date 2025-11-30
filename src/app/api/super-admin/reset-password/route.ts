import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { hash } from 'bcryptjs';
import { sendAdminAssignmentEmail } from '@/lib/email-utils';
import { getDefaultPasswordByRoleName } from '@/lib/password-utils';

// POST /api/super-admin/reset-password - Reset password for any user (admin or super admin)
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
    const { userId, newPassword } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const targetUser = await prisma.users.findUnique({
      where: { id: parseInt(userId) },
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

    // Check if target user is admin or super_admin
    const userRole = targetUser.userrole?.role?.name;
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Can only reset passwords for admins and super admins' },
        { status: 403 }
      );
    }

    // Use role-based default password if not provided
    const passwordToSet = newPassword || (userRole ? getDefaultPasswordByRoleName(userRole) : 'User@2025');

    // Hash password
    const hashedPassword = await hash(passwordToSet, 12);

    // Update password
    await prisma.users.update({
      where: { id: parseInt(userId) },
      data: {
        password_hash: hashedPassword,
        updatedAt: new Date(),
      },
    });

    // Send email notification
    try {
      await sendAdminAssignmentEmail({
        email: targetUser.email,
        firstName: targetUser.first_name,
        lastName: targetUser.last_name,
        departmentName: 'System',
        departmentCode: 'SYS',
        password: passwordToSet,
        role: userRole as 'super_admin' | 'admin',
      });
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
      data: {
        userId: targetUser.id,
        email: targetUser.email,
        defaultPassword: passwordToSet,
      },
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reset password',
      },
      { status: 500 }
    );
  }
}

