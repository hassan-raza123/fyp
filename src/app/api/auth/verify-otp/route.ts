import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createToken } from '@/lib/jwt';
import { z } from 'zod';
import {
  AdminRole,
  AllRoles,
  LoginResponse,
  UserWithRoles,
  UserData,
  TokenPayload,
} from '@/types/auth';
import { AUTH_TOKEN_COOKIE, COOKIE_OPTIONS } from '@/constants/auth';
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const verifyOTPSchema = z.object({
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
  otp: z
    .string({ required_error: 'OTP is required' })
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d+$/, 'OTP must contain only numbers'),
});

// Map login userType to database role name
function mapUserTypeToRole(
  userType: 'student' | 'teacher' | 'admin'
): AllRoles {
  switch (userType) {
    case 'student':
      return 'student';
    case 'teacher':
      return 'teacher';
    case 'admin':
      return 'super_admin'; // Default to super_admin for admin login
    default:
      throw new Error('Invalid user type');
  }
}

// Check if a role is an admin role
function isAdminRole(role: string): boolean {
  const adminRoles: string[] = [
    'super_admin',
    'sub_admin',
    'department_admin',
    'child_admin',
  ];
  return adminRoles.includes(role);
}

function getDashboardPath(role: AllRoles): string {
  switch (role) {
    case 'student':
      return '/student/dashboard';
    case 'teacher':
      return '/faculty/dashboard';
    case 'super_admin':
      return '/admin/dashboard';
    case 'sub_admin':
      return '/admin/dashboard';
    case 'department_admin':
      return '/department/dashboard';
    case 'child_admin':
      return '/sub-admin/dashboard';
    default:
      return '/login';
  }
}

function createUserData(user: any, userType: AllRoles): UserData {
  const baseData: UserData = {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    role: userType,
  };

  if (userType === 'student' && user.student) {
    return {
      ...baseData,
      rollNumber: user.student.rollNumber,
      departmentId: user.student.departmentId || 0, // Handle null case
      programId: user.student.programId || 0, // Handle null case
    };
  }

  if (userType === 'teacher' && user.faculty) {
    return {
      ...baseData,
      departmentId: user.faculty.departmentId || 0, // Handle null case
      designation: user.faculty.designation,
    };
  }

  return baseData;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<LoginResponse>> {
  try {
    const body = await request.json();
    const validationResult = verifyOTPSchema.safeParse(body);

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

    const { email, userType, otp } = validationResult.data;

    // Get the OTP from the database
    const user = await prisma.users.findFirst({
      where: {
        email,
        status: 'active',
      },
      include: {
        userrole: {
          include: {
            role: true,
          },
        },
        student: true,
        faculty: true,
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

    // Get user roles
    const userRoles = user.userrole?.role?.name
      ? [user.userrole.role.name]
      : [];

    if (userRoles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'User has no roles assigned',
          error: 'Please contact administrator to assign roles',
        },
        { status: 403 }
      );
    }

    // Verify OTP
    const otpRecord = await prisma.otps.findFirst({
      where: {
        email,
        userType,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!otpRecord) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid or expired OTP',
        },
        { status: 400 }
      );
    }

    const isValidOTP = await bcrypt.compare(otp, otpRecord.code);

    if (!isValidOTP) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid OTP',
        },
        { status: 400 }
      );
    }

    // Mark OTP as used
    await prisma.otps.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    // If this is first login, mark email as verified
    if (!user.email_verified) {
      await prisma.users.update({
        where: { id: user.id },
        data: { email_verified: true },
      });
    }

    // Create user data and token
    const userData = createUserData(user, mapUserTypeToRole(userType));
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: mapUserTypeToRole(userType),
      userData,
    };

    const token = await createToken(tokenPayload);

    // Update last login
    await prisma.users.update({
      where: { id: user.id },
      data: { last_login: new Date() },
    });

    // Determine redirect path based on role
    const redirectTo = getDashboardPath(mapUserTypeToRole(userType));

    // Create response with token in cookie
    const response = NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        user: userData,
        redirectTo: redirectTo,
        token,
        userType: mapUserTypeToRole(userType),
      },
    });

    // Set cookie with constant name and options
    response.cookies.set(AUTH_TOKEN_COOKIE, token, COOKIE_OPTIONS);

    return response;
  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred during OTP verification',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
