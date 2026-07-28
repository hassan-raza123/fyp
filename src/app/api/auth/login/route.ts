import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomInt } from 'crypto';
const bcrypt = require('bcryptjs');
import { sendOTPEmail } from '@/lib/email-utils';
import { createToken } from '@/lib/auth';
import {
  consumeRateLimit,
  resetRateLimit,
  getClientIp,
} from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';
import { captureOtp } from '@/lib/e2e-otp-store';
import { AUTH_TOKEN_COOKIE, COOKIE_OPTIONS } from '@/constants/auth';
import {
  AdminRole,
  AllRoles,
  LoginResponse,
  UserWithRoles,
  UserData,
  TokenPayload,
} from '@/types/auth';

// Rate limiting: per-account and per-IP, both persisted (see lib/rate-limit.ts)
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS_PER_EMAIL = 10;
const MAX_ATTEMPTS_PER_IP = 30; // higher, so shared campus NAT does not lock out

const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email format')
    .min(1, 'Email cannot be empty')
    .max(255, 'Email is too long')
    .trim()
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password cannot be empty')
    .max(255, 'Password is too long'),
  userType: z.enum(['student', 'faculty', 'admin', 'super_admin'] as const, {
    required_error: 'User type is required',
    invalid_type_error: 'Invalid user type',
  }),
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

function createUserData(user: any, userType: AllRoles): UserData {
  const baseData: UserData = {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    role: userType,
    // Drives the forced password change: the proxy keeps the user on
    // /change-password until they replace their temporary credential.
    mustChangePassword: user.must_change_password === true,
  };

  if (userType === 'student' && user.student) {
    return {
      ...baseData,
      rollNumber: user.student.rollNumber,
      departmentId: user.student.departmentId,
      programId: user.student.programId,
    };
  }

  if (userType === 'faculty' && user.faculty) {
    return {
      ...baseData,
      departmentId: user.faculty.departmentId,
      designation: user.faculty.designation,
    };
  }

  return baseData;
}

function generateOTP(): string {
  return randomInt(100000, 1000000).toString();
}


/**
 * Send the OTP without letting a mail failure abort the login.
 *
 * The code is already persisted by the time this runs, so throwing here turned
 * a mail outage — or simply unconfigured SMTP in local development — into a 500
 * that made admin and faculty sign-in impossible with no usable diagnostic.
 *
 * Returns true when the mail went out. Outside production the code is also
 * logged to the server console so local development works without SMTP.
 */
async function deliverOTP(email: string, otp: string): Promise<boolean> {
  // Inert unless E2E_TEST_MODE is on; lets end-to-end tests complete the OTP step
  captureOtp(email, otp);

  try {
    await sendOTPEmail(email, otp);
    return true;
  } catch (error) {
    console.error(`Failed to email OTP to ${email}:`, error);
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[dev] OTP for ${email} is ${otp} — email delivery is not configured.`
      );
    }
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = loginSchema.safeParse(body);

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

    const { email, password, userType } = validationResult.data;

    // Rate limit before touching credentials, on both the account and the
    // source IP, so neither a single account nor a single host can be hammered.
    const emailKey = `login:${email}`;
    const ipKey = `login-ip:${getClientIp(request)}`;

    const [emailLimit, ipLimit] = await Promise.all([
      consumeRateLimit({
        key: emailKey,
        limit: MAX_ATTEMPTS_PER_EMAIL,
        windowMs: RATE_LIMIT_WINDOW,
      }),
      consumeRateLimit({
        key: ipKey,
        limit: MAX_ATTEMPTS_PER_IP,
        windowMs: RATE_LIMIT_WINDOW,
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
          message: `Too many login attempts. Please try again in ${Math.ceil(
            retryAfter / 60
          )} minute(s).`,
        },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

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
          message: 'Invalid credentials',
          error: 'Invalid email or password',
        },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid credentials',
          error: 'Invalid email or password',
        },
        { status: 401 }
      );
    }

    // Credentials are valid — clear the per-account counter so a user who
    // mistyped a few times is not penalised after a successful sign-in.
    await resetRateLimit(emailKey);

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

    // Handle admin and super_admin users
    if (userType === 'admin' || userType === 'super_admin') {
      /**
       * Frontend par sirf ek "Admin" tab hai.
       * - Agar user ke paas `admin` ya `super_admin` dono me se koi bhi role ho to
       *   usko admin dashboard me allow karna hai.
       * - Agar sirf `super_admin` role ho (Hassan jaisa user), to bhi "Admin" tab se login ho sakta hai.
       */

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

      // Effective admin role jo token / OTP me use hoga
      const effectiveAdminRole: AdminRole = hasSuperAdminRole
        ? 'super_admin'
        : 'admin';

      // For admin users (including super_admin), always send OTP
      const otp = generateOTP();
      const hashedOTP = await bcrypt.hash(otp, 10);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

      // Delete any existing OTPs for this user
      await prisma.otps.deleteMany({
        where: {
          email,
          // OTP records ko effective role ke sath tie karte hain
          userType: effectiveAdminRole,
          isUsed: false,
        },
      });

      // Save OTP to database
      await prisma.otps.create({
        data: {
          email,
          userType: effectiveAdminRole,
          code: hashedOTP,
          expiresAt,
          isUsed: false,
        },
      });

      // Send OTP via email
      const otpDelivered = await deliverOTP(email, otp);

      return NextResponse.json({
        success: true,
        message: otpDelivered
          ? 'OTP sent successfully. Please check your email.'
          : 'Could not send the verification email. Contact your administrator.',
        data: {
          redirectTo: '/verify-otp',
          email: email,
          // Frontend ko bhi effective role bhejte hain (admin / super_admin)
          userType: effectiveAdminRole,
          otpSent: otpDelivered,
        },
      });
    }

    // Handle faculty users - always require OTP (like admin)
    if (userType === 'faculty') {
      // Check if user has faculty role
      const requestedRole = mapUserTypeToRole(userType);
      if (!userRoles.includes(requestedRole)) {
        return NextResponse.json(
          {
            success: false,
            message: `User does not have ${userType} role`,
          },
          { status: 403 }
        );
      }

      // For faculty users, always send OTP (every login)
      const otp = generateOTP();
      const hashedOTP = await bcrypt.hash(otp, 10);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

      // Delete any existing OTPs for this user
      await prisma.otps.deleteMany({
        where: {
          email,
          userType,
          isUsed: false,
        },
      });

      // Save OTP to database
      await prisma.otps.create({
        data: {
          email,
          userType,
          code: hashedOTP,
          expiresAt,
          isUsed: false,
        },
      });

      // Send OTP via email
      const otpDelivered = await deliverOTP(email, otp);

      return NextResponse.json({
        success: true,
        message: otpDelivered
          ? 'OTP sent successfully. Please check your email.'
          : 'Could not send the verification email. Contact your administrator.',
        data: {
          redirectTo: '/verify-otp',
          email: email,
          userType: userType,
          otpSent: otpDelivered,
        },
      });
    }

    // Handle students - OTP only on first login (email verification)
    if (userType === 'student') {
      // Check if user has student role
      const requestedRole = mapUserTypeToRole(userType);
      if (!userRoles.includes(requestedRole)) {
        return NextResponse.json(
          {
            success: false,
            message: `User does not have ${userType} role`,
          },
          { status: 403 }
        );
      }

      if (!user.email_verified) {
        // First login - send OTP for email verification
        const otp = generateOTP();
        const hashedOTP = await bcrypt.hash(otp, 10);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

        // Delete any existing OTPs for this user
        await prisma.otps.deleteMany({
          where: {
            email,
            userType,
            isUsed: false,
          },
        });

        // Save OTP to database
        await prisma.otps.create({
          data: {
            email,
            userType,
            code: hashedOTP,
            expiresAt,
            isUsed: false,
          },
        });

        // Send OTP via email
        const otpDelivered = await deliverOTP(email, otp);

        return NextResponse.json({
          success: true,
          message: 'OTP sent for email verification. Please check your email.',
          data: {
            redirectTo: '/verify-otp',
            email: email,
            userType: userType,
            otpSent: otpDelivered,
          },
        });
      }

      // Verified student - direct login (no OTP required)
      const frontendRole = userType;
      const userData = createUserData(user, frontendRole as AllRoles);
      const tokenPayload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: frontendRole,
        userData,
      };

      const token = await createToken(tokenPayload);

      // Update last login
      await prisma.users.update({
        where: { id: user.id },
        data: { last_login: new Date() },
      });

      // Determine redirect path based on role
      const redirectTo = getDashboardPath(userType);

      // Create response with token in cookie
      const response = NextResponse.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userData,
          redirectTo: redirectTo,
          userType,
          shouldRedirect: true,
        },
      });

      // Set cookie with constant name and options
      response.cookies.set(AUTH_TOKEN_COOKIE, token, COOKIE_OPTIONS);

      return response;
    }

    // Handle other non-admin roles
    const userData = createUserData(user, userType);
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: userType,
      userData,
    };

    const token = await createToken(tokenPayload);

    // Update last login
    await prisma.users.update({
      where: { id: user.id },
      data: { last_login: new Date() },
    });

    // Determine redirect path based on role
    const redirectTo = getDashboardPath(userType);

    // Create response with token in cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        redirectTo: redirectTo,
        userType,
      },
    });

    // Set cookie with constant name and options
    response.cookies.set(AUTH_TOKEN_COOKIE, token, COOKIE_OPTIONS);

    return response;
  } catch (error) {
    console.error(
      'Login error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred during login',
      },
      { status: 500 }
    );
  }
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
      return '/';
  }
}
