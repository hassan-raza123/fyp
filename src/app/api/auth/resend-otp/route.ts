import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

const resendOTPSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email format')
    .min(1, 'Email cannot be empty')
    .max(255, 'Email is too long')
    .trim()
    .toLowerCase(),
  userType: z.enum(['student', 'teacher', 'admin'] as const, {
    required_error: 'User type is required',
    invalid_type_error: 'Invalid user type',
  }),
});

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPEmail(email: string, otp: string): Promise<void> {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: {
      name: 'Smart Campus for MNSUET Support',
      address: process.env.GMAIL_USER!,
    },
    to: email,
    subject: 'Your Login Verification Code - Smart Campus for MNSUET',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #6B46C1; margin: 0;">Smart Campus for MNSUET</h1>
          <p style="color: #4B5563; margin: 5px 0;">Login Verification Code</p>
        </div>

        <div style="background: #F9FAFB; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="color: #111827; margin: 0 0 15px 0;">Hello,</p>
          <p style="color: #4B5563; line-height: 1.5;">Your verification code for Smart Campus for MNSUET login is:</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 8px;">
            ${otp}
          </div>

          <p style="color: #4B5563; line-height: 1.5;">This code will expire in 5 minutes.</p>
          <p style="color: #4B5563; line-height: 1.5;">If you didn't request this code, please ignore this email.</p>
        </div>

        <div style="margin-top: 20px; text-align: center; color: #6B7280; font-size: 14px;">
          <p>If you have any questions, please contact our support team.</p>
          <p style="margin: 5px 0; color: #6B46C1; font-weight: 500;">The Smart Campus for MNSUET Team</p>
        </div>
      </div>
    `,
  });
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
