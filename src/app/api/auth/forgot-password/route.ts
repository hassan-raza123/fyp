import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

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

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
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
      const mailOptions = {
        from: {
          name: 'Smart Campus for MNSUET Support',
          address: process.env.GMAIL_USER!,
        },
        to: email,
        subject: 'Password Reset Request - Smart Campus for MNSUET',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #6B46C1; margin: 0;">Smart Campus for MNSUET</h1>
              <p style="color: #4B5563; margin: 5px 0;">Password Reset Request</p>
            </div>

            <div style="background: #F9FAFB; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <p style="color: #111827; margin: 0 0 15px 0;">Hello,</p>
              <p style="color: #4B5563; line-height: 1.5;">We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
              <p style="color: #4B5563; line-height: 1.5;">To reset your password, click the button below:</p>
              
              <div style="margin: 20px 0; text-align: center;">
                <a href="${resetUrl}" style="display: inline-block; background: #6B46C1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                  Reset Password
                </a>
              </div>

              <p style="color: #4B5563; line-height: 1.5;">Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #6B7280; background: #F3F4F6; padding: 10px; border-radius: 4px; font-size: 14px;">${resetUrl}</p>
              
              <p style="color: #4B5563; line-height: 1.5; margin-top: 15px;">This link will expire in 30 minutes.</p>
            </div>

            <div style="margin-top: 20px; text-align: center; color: #6B7280; font-size: 14px;">
              <p>If you have any questions, please contact our support team.</p>
              <p style="margin: 5px 0; color: #6B46C1; font-weight: 500;">The Smart Campus for MNSUET Team</p>
            </div>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log('Password reset email sent successfully to:', email);
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
