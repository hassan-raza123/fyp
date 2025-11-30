import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';
import { hash } from 'bcryptjs';
import { sendAdminAssignmentEmail } from '@/lib/email-utils';

// POST /api/super-admin/reset-password - Reset password for any user (admin or super admin)
export async function POST(request: NextRequest) {
  try {
    const { success, user, error } = requireAuth(request);
    if (!success || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only super admin can reset passwords
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Only super admin can reset passwords' },
        { status: 403 }
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

    // Use default password if not provided
    const passwordToSet = newPassword || '11223344';

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

