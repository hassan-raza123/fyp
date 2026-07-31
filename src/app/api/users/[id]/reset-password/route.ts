import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generatePasswordResetToken } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/email-utils';
import { authorize, canManageUser, forbiddenResponse } from '@/lib/authz';
import { writeAuditLog } from '@/lib/audit-log';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const auth = await authorize(request, ['super_admin', 'admin']);
    if (!auth.ok) return auth.response;

    // A department admin runs one department. Without this, they could trigger
    // a reset for any account in the university — including a super admin —
    // and take it over from the resulting email.
    if (!(await canManageUser(request, auth.user, userId))) {
      return forbiddenResponse();
    }

    // Get the target user's email
    const targetUser = await prisma.users.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate reset token
    const resetToken = await generatePasswordResetToken(userId);

    // Create reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken.token}`;

    // Send reset email
    try {
      await sendPasswordResetEmail(targetUser.email, resetUrl);
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      throw new Error('Failed to send password reset email');
    }

    await writeAuditLog(request, auth.user, 'user.password_reset', {
      targetUserId: userId,
      targetEmail: targetUser.email,
    });

    return NextResponse.json({
      message: 'Password reset email sent successfully',
    });
  } catch (error) {
    console.error('Error generating password reset token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
