import { NextRequest, NextResponse } from 'next/server';
import { validatePasswordStrength } from '@/lib/password-utils';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = resetPasswordSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: validationResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const { token, password } = validationResult.data;

    // Find the password reset record
    const resetRecord = await prisma.passwordresets.findUnique({
      where: { token },
    });

    // Check if token exists and is not expired
    if (!resetRecord) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid reset token',
        },
        { status: 400 }
      );
    }

    if (resetRecord.expiresAt < new Date()) {
      // Delete expired token
      await prisma.passwordresets.delete({
        where: { token },
      });

      return NextResponse.json(
        {
          success: false,
          message:
            'Reset token has expired. Please request a new password reset link.',
        },
        { status: 400 }
      );
    }

    // Hash the new password
    // One shared policy for every place a user picks a password, so a weak
    // rule in one route cannot undercut the others.
    const strength = validatePasswordStrength(password);
    if (!strength.valid) {
      return NextResponse.json(
        { success: false, error: strength.errors.join('. '), errors: strength.errors },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(password, 12);

    // Setting the password and consuming the token are one operation. Split
    // apart, a failure between them either left the token replayable after the
    // password had already changed, or burned the token without changing it.
    await prisma.$transaction(async (tx) => {
      await tx.users.update({
        where: { id: resetRecord.userId },
        data: {
          password_hash: hashedPassword,
          // Clearing the flag is what releases the account: the proxy holds
          // a flagged user on /change-password, so updating the hash without
          // this would trap them there permanently.
          must_change_password: false,
          password_changed_at: new Date(),
        },
      });

      await tx.passwordresets.delete({ where: { token } });
    });

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while resetting your password',
      },
      { status: 500 }
    );
  }
}
