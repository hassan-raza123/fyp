import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';
import { generatePasswordResetToken } from '@/lib/auth';
import nodemailer from 'nodemailer';

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const userId = parseInt(context.params.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

    // Send reset email
    try {
      const mailOptions = {
        from: {
          name: 'Smart Campus for MNSUET Support',
          address: process.env.GMAIL_USER!,
        },
        to: targetUser.email,
        subject: 'Password Reset Request - Smart Campus for MNSUET',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #6B46C1; margin: 0;">Smart Campus for MNSUET</h1>
              <p style="color: #4B5563; margin: 5px 0;">Password Reset Request</p>
            </div>

            <div style="background: #F9FAFB; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <p style="color: #111827; margin: 0 0 15px 0;">Hello,</p>
              <p style="color: #4B5563; line-height: 1.5;">A password reset has been requested for your account. If you didn't make this request, you can safely ignore this email.</p>
              <p style="color: #4B5563; line-height: 1.5;">To reset your password, click the button below:</p>
              
              <div style="margin: 20px 0; text-align: center;">
                <a href="${resetUrl}" style="display: inline-block; background: #6B46C1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                  Reset Password
                </a>
              </div>

              <p style="color: #4B5563; line-height: 1.5;">Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #6B7280; background: #F3F4F6; padding: 10px; border-radius: 4px; font-size: 14px;">${resetUrl}</p>
              
              <p style="color: #4B5563; line-height: 1.5; margin-top: 15px;">This link will expire in 1 hour.</p>
            </div>

            <div style="margin-top: 20px; text-align: center; color: #6B7280; font-size: 14px;">
              <p>If you have any questions, please contact our support team.</p>
              <p style="margin: 5px 0; color: #6B46C1; font-weight: 500;">The Smart Campus for MNSUET Team</p>
            </div>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(
        'Password reset email sent successfully to:',
        targetUser.email
      );
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      throw new Error('Failed to send password reset email');
    }

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
