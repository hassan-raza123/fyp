import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { sendOTPEmail } from '@/lib/email-utils';

const prisma = new PrismaClient();

const resendOTPSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email format')
    .min(1, 'Email cannot be empty')
    .max(255, 'Email is too long')
    .trim()
    .toLowerCase(),
  userType: z.enum(['student', 'faculty', 'admin'] as const, {
    required_error: 'User type is required',
    invalid_type_error: 'Invalid user type',
  }),
});

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = resendOTPSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors,
        },
        { status: 400 }
      );
    }

    const { email, userType } = validationResult.data;

    // Check if user exists
    const user = await prisma.users.findUnique({
      where: {
        email,
        status: 'active',
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    // Delete any existing OTPs for this user
    await prisma.$executeRaw`
      DELETE FROM otps 
      WHERE email = ${email} 
      AND userType = ${userType} 
      AND isUsed = false
    `;

    // Save OTP to database
    await prisma.$executeRaw`
      INSERT INTO otps (email, userType, code, expiresAt, isUsed, updatedAt)
      VALUES (${email}, ${userType}, ${otp}, ${expiresAt}, false, NOW())
    `;

    // Send OTP via email
    await sendOTPEmail(email, otp);

    return NextResponse.json({
      success: true,
      message: 'New OTP sent successfully. Please check your email.',
      data: {
        email: email,
        userType: userType,
      },
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while sending OTP',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
