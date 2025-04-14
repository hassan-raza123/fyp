import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { z } from 'zod';

const prisma = new PrismaClient();

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
    const resetRecord = await prisma.passwordreset.findUnique({
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
      await prisma.passwordreset.delete({
        where: { token },
      });

      return NextResponse.json(
        {
          success: false,
          message: 'Reset token has expired. Please request a new password reset link.',
        },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await hash(password, 12);

    // Update user's password
    await prisma.user.update({
      where: { id: resetRecord.userId },
      data: {
        password_hash: hashedPassword,
      },
    });

    // Delete the used reset token
    await prisma.passwordreset.delete({
      where: { token },
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