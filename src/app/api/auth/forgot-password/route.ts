import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email-utils';

const prisma = new PrismaClient();

const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email format')
    .min(1, 'Email cannot be empty')
    .max(255, 'Email is too long')
    .trim()
    .toLowerCase(),
});


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = forgotPasswordSchema.safeParse(body);

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

    const { email } = validationResult.data;

    // Find user by email
    const user = await prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      // Return error if user not found
      return NextResponse.json({
        success: false,
        message:
          'No account found with this email address. Please check your email or register for a new account.',
      });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

    // Create password reset record
    await prisma.passwordresets.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
        updatedAt: new Date(),
      },
    });

    // Create reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

    // Send reset email
    try {
      await sendPasswordResetEmail(email, resetUrl);
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      throw new Error('Failed to send password reset email');
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset instructions have been sent to your email.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while processing your request',
      },
      { status: 500 }
    );
  }
}
