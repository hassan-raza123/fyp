import { NextRequest, NextResponse } from 'next/server';
import { validatePasswordStrength } from '@/lib/password-utils';
import { AUTH_TOKEN_COOKIE, COOKIE_OPTIONS } from '@/constants/auth';
import { prisma } from '@/lib/prisma';
import { getStudentFromRequest } from '@/lib/auth';
import { compare, hash } from 'bcryptjs';
import { z } from 'zod';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export async function POST(request: NextRequest) {
  try {
    const student = await getStudentFromRequest(request);
    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found or unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = changePasswordSchema.parse(body);

    // Get current user with password
    const user = await prisma.users.findUnique({
      where: { id: student.user.id },
      select: { password_hash: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify current password
    const isPasswordValid = await compare(
      validatedData.currentPassword,
      user.password_hash
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Hash new password
    // One shared policy for every place a user picks a password, so a weak
    // rule in one route cannot undercut the others.
    const strength = validatePasswordStrength(validatedData.newPassword);
    if (!strength.valid) {
      return NextResponse.json(
        { success: false, error: strength.errors.join('. '), errors: strength.errors },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(validatedData.newPassword, 12);

    // Update password
    await prisma.users.update({
      where: { id: student.user.id },
      data: {
        password_hash: hashedPassword,
        // Clearing the flag is what releases the account: the proxy holds
        // a flagged user on /change-password, so updating the hash without
        // this would trap them there permanently.
        must_change_password: false,
        password_changed_at: new Date(),
      },
    });

    // Changing a password ends the current session: the existing token was
    // issued against the old credential (and may still carry a stale
    // must_change_password flag), so the user signs in again with the new one.
    const response = NextResponse.json({
      success: true,
      message: 'Password changed successfully. Please sign in again.',
      data: { requiresReauth: true },
    });
    response.cookies.set(AUTH_TOKEN_COOKIE, '', {
      path: COOKIE_OPTIONS.path,
      maxAge: 0,
      httpOnly: COOKIE_OPTIONS.httpOnly,
      sameSite: COOKIE_OPTIONS.sameSite,
      secure: COOKIE_OPTIONS.secure,
    });
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Error changing password:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to change password' },
      { status: 500 }
    );
  }
}

