import { NextRequest, NextResponse } from 'next/server';
import { createToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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
import {
  consumeRateLimit,
  resetRateLimit,
  getClientIp,
} from '@/lib/rate-limit';
const bcrypt = require('bcryptjs');

// OTP guessing limits
const OTP_ATTEMPT_WINDOW = 10 * 60 * 1000; // 10 minutes
const MAX_OTP_ATTEMPTS = 5; // per account
const MAX_OTP_ATTEMPTS_PER_IP = 20;

const verifyOTPSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email format')
    .min(1, 'Email cannot be empty')
    .max(255, 'Email is too long')
    .trim()
    .toLowerCase(),
  userType: z.enum(['student', 'faculty', 'admin', 'super_admin'] as const, {
    required_error: 'User type is required',
    invalid_type_error: 'Invalid user type',
  }),
  otp: z
    .string({ required_error: 'OTP is required' })
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d+$/, 'OTP must contain only numbers'),
});

// Map login userType to database role name
function mapUserTypeToRole(userType: 'student' | 'faculty' | 'admin' | 'super_admin'): string {
  switch (userType) {
    case 'student':
      return 'student';
    case 'faculty':
      return 'faculty';
    case 'admin':
      return 'admin';
    case 'super_admin':
      return 'super_admin';
    default:
      throw new Error('Invalid user type');
  }
}

// Check if a role is an admin role (includes both admin and super_admin)
function isAdminRole(role: string): boolean {
  return role === 'admin' || role === 'super_admin';
}

function getDashboardPath(role: AllRoles): string {
  switch (role) {
    case 'super_admin':
      return '/super-admin';
    case 'admin':
      return '/admin';
    case 'faculty':
      return '/faculty';
    case 'student':
      return '/student';
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
    // Must match the login route: admins and faculty receive their token from
    // here after OTP, so omitting the flag would let every non-student account
    // skip the forced password change entirely.
    mustChangePassword: user.must_change_password === true,
  };

  if (userType === 'student' && user.student) {
    return {
      ...baseData,
      rollNumber: user.student.rollNumber,
      departmentId: user.student.departmentId || undefined,
      programId: user.student.programId || undefined,
    };
  }

  if (userType === 'faculty' && user.faculty) {
    return {
      ...baseData,
      departmentId: user.faculty.departmentId || undefined,
      designation: user.faculty.designation,
    };
  }

  // For admin users, get department from faculty record
  if ((userType === 'admin' || userType === 'super_admin') && user.faculty) {
    return {
      ...baseData,
      departmentId: user.faculty.departmentId || undefined,
      designation: user.faculty.designation,
    };
  }

  return baseData;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse> {
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

    // A 6-digit OTP is only 1,000,000 combinations, so unlimited guesses would
    // make it trivially brute-forceable. Cap attempts per account and per IP.
    const otpKey = `verify-otp:${email}`;
    const [otpLimit, ipLimit] = await Promise.all([
      consumeRateLimit({
        key: otpKey,
        limit: MAX_OTP_ATTEMPTS,
        windowMs: OTP_ATTEMPT_WINDOW,
      }),
      consumeRateLimit({
        key: `verify-otp-ip:${getClientIp(request)}`,
        limit: MAX_OTP_ATTEMPTS_PER_IP,
        windowMs: OTP_ATTEMPT_WINDOW,
      }),
    ]);

    if (!otpLimit.allowed || !ipLimit.allowed) {
      const retryAfter = Math.max(
        otpLimit.retryAfterSeconds,
        ipLimit.retryAfterSeconds
      );
      return NextResponse.json(
        {
          success: false,
          message: `Too many verification attempts. Please request a new code and try again in ${Math.ceil(
            retryAfter / 60
          )} minute(s).`,
        },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

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

    /**
     * Admin flow:
     * - Frontend par sirf ek "Admin" tab hai
     * - Agar user ke paas `admin` ya `super_admin` me se koi bhi role ho to allow karna hai
     * - Agar sirf `super_admin` ho to token me `super_admin` role set karna hai
     */

    let actualRole: AllRoles = userType as AllRoles;

    if (userType === 'admin' || userType === 'super_admin') {
      const hasAdminRole = userRoles.includes('admin');
      const hasSuperAdminRole = userRoles.includes('super_admin');

      if (!hasAdminRole && !hasSuperAdminRole) {
        return NextResponse.json(
          {
            success: false,
            message: 'User does not have admin privileges',
          },
          { status: 403 }
        );
      }

      // Super admin ko prefer karein, warna normal admin
      actualRole = (hasSuperAdminRole ? 'super_admin' : 'admin') as AllRoles;
    } else {
      // Non-admin routes ke liye purana strict role check
      const dbRole = mapUserTypeToRole(userType);

      if (!userRoles.includes(dbRole)) {
        return NextResponse.json(
          {
            success: false,
            message: `User does not have ${userType} role`,
          },
          { status: 403 }
        );
      }
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

    // Correct code — clear the attempt counter for this account
    await resetRateLimit(otpKey);

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

    // Create user data and token with actual role
    const userData = createUserData(user, actualRole);
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: actualRole,
      userData,
      departmentId: userData.departmentId, // Include departmentId directly in token for quick access
    };

    const token = await createToken(tokenPayload);

    // Update last login
    await prisma.users.update({
      where: { id: user.id },
      data: { last_login: new Date() },
    });

    // Determine redirect path based on actual role
    const redirectTo = getDashboardPath(actualRole);

    // Create response with token in cookie
    const response = NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        user: userData,
        redirectTo: redirectTo,
        userType: actualRole,
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
  }
}
