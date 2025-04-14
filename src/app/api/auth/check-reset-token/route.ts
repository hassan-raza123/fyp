import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'No reset token provided',
        },
        { status: 400 }
      );
    }

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

    return NextResponse.json({
      success: true,
      message: 'Token is valid',
    });
  } catch (error) {
    console.error('Error checking reset token:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while verifying the reset token',
      },
      { status: 500 }
    );
  }
} 