import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email-utils';
import { prisma } from '@/lib/prisma';
import { consumeRateLimit, getClientIp } from '@/lib/rate-limit';

// Password reset request limits — this endpoint sends email
const RESET_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_RESETS_PER_EMAIL = 3;
const MAX_RESETS_PER_IP = 15;

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

    const [emailLimit, ipLimit] = await Promise.all([
      consumeRateLimit({
        key: `forgot-password:${email}`,
        limit: MAX_RESETS_PER_EMAIL,
        windowMs: RESET_WINDOW,
      }),
      consumeRateLimit({
        key: `forgot-password-ip:${getClientIp(request)}`,
        limit: MAX_RESETS_PER_IP,
        windowMs: RESET_WINDOW,
      }),
    ]);

    if (!emailLimit.allowed || !ipLimit.allowed) {
      const retryAfter = Math.max(
        emailLimit.retryAfterSeconds,
        ipLimit.retryAfterSeconds
      );
      return NextResponse.json(
        {
          success: false,
          message: `Too many password reset requests. Please try again in ${Math.ceil(
            retryAfter / 60
          )} minute(s).`,
        },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

    // Find user by email
    const user = await prisma.users.findUnique({
      where: { email },
    });

    // Always answer the same way whether or not the account exists. Saying "no
    // account found" turns this endpoint into a way to enumerate which email
    // addresses are registered.
    if (!user) {
      return NextResponse.json({
        success: true,
        message:
          'If an account exists for that email address, password reset instructions have been sent.',
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
