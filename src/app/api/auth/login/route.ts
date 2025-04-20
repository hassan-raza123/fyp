import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, role_name } from '@prisma/client';
import { z } from 'zod';
import nodemailer from 'nodemailer';
const bcrypt = require('bcryptjs');
import { createToken } from '@/lib/jwt';
import {
  AdminRole,
  AllRoles,
  LoginResponse,
  UserWithRoles,
  UserData,
  TokenPayload,
} from '@/types/auth';

const prisma = new PrismaClient();

// Rate limiting setup
const rateLimit = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
const MAX_OTP_REQUESTS = 3;

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
  userType: z.enum(['student', 'teacher', 'admin'] as const, {
    required_error: 'User type is required',
    invalid_type_error: 'Invalid user type',
  }),
});

// Map login userType to database role_name
function mapUserTypeToRole(
  userType: 'student' | 'teacher' | 'admin'
): role_name {
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
function isAdminRole(role: role_name): boolean {
  const adminRoles: role_name[] = [
    'super_admin',
    'sub_admin',
    'department_admin',
    'child_admin',
  ];
  return adminRoles.includes(role);
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
      departmentId: user.student.departmentId,
      programId: user.student.programId,
      batch: user.student.batch,
    };
  }

  if (userType === 'teacher' && user.faculty) {
    return {
      ...baseData,
      employeeId: user.faculty.employeeId,
      departmentId: user.faculty.departmentId,
      designation: user.faculty.designation,
    };
  }

  return baseData;
}

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
      name: 'UniTrack360 Support',
      address: process.env.GMAIL_USER!,
    },
    to: email,
    subject: 'Your Login Verification Code - UniTrack360',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #6B46C1; margin: 0;">UniTrack360</h1>
          <p style="color: #4B5563; margin: 5px 0;">Login Verification Code</p>
        </div>

        <div style="background: #F9FAFB; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="color: #111827; margin: 0 0 15px 0;">Hello,</p>
          <p style="color: #4B5563; line-height: 1.5;">Your verification code for UniTrack360 login is:</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 8px;">
            ${otp}
          </div>

          <p style="color: #4B5563; line-height: 1.5;">This code will expire in 5 minutes.</p>
          <p style="color: #4B5563; line-height: 1.5;">If you didn't request this code, please ignore this email.</p>
        </div>

        <div style="margin-top: 20px; text-align: center; color: #6B7280; font-size: 14px;">
          <p>If you have any questions, please contact our support team.</p>
          <p style="margin: 5px 0; color: #6B46C1; font-weight: 500;">The UniTrack360 Team</p>
        </div>
      </div>
    `,
  });
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

    // Check rate limit
    const now = Date.now();
    const userRequests = rateLimit.get(email) || [];
    const recentRequests = userRequests.filter(
      (time: number) => now - time < RATE_LIMIT_WINDOW
    );

    if (recentRequests.length >= MAX_OTP_REQUESTS) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many OTP requests. Please try again later.',
        },
        { status: 429 }
      );
    }

    // Add current request to rate limit
    recentRequests.push(now);
    rateLimit.set(email, recentRequests);

    const user = await prisma.user.findUnique({
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
        },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid credentials',
        },
        { status: 401 }
      );
    }

    // Get user roles from database
    const userRoles = user.userrole.map((ur) => ur.role.name as role_name);

    // Handle admin users
    if (userType === 'admin') {
      // Check if user has any admin role
      const hasAdminRole = userRoles.some(isAdminRole);

      if (!hasAdminRole) {
        return NextResponse.json(
          {
            success: false,
            message: 'User does not have admin privileges',
          },
          { status: 403 }
        );
      }

      // For admin users, always send OTP
      const otp = generateOTP();
      const hashedOTP = await bcrypt.hash(otp, 10);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

      // Delete any existing OTPs for this user
      await prisma.$executeRaw`
        DELETE FROM OTP 
        WHERE email = ${email} 
        AND userType = ${userType} 
        AND isUsed = false
      `;

      // Save OTP to database
      await prisma.$executeRaw`
        INSERT INTO OTP (email, userType, code, expiresAt, isUsed, updatedAt)
        VALUES (${email}, ${userType}, ${hashedOTP}, ${expiresAt}, false, NOW())
      `;

      // Send OTP via email
      await sendOTPEmail(email, otp);

      return NextResponse.json({
        success: true,
        message: 'OTP sent successfully. Please check your email.',
        data: {
          redirectTo: '/verify-otp',
          email: email,
          userType: userType,
          otpSent: true,
        },
      });
    }

    // Handle students and teachers
    if (userType === 'student' || userType === 'teacher') {
      // Check if user has the specific role
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
        await prisma.$executeRaw`
          DELETE FROM OTP 
          WHERE email = ${email} 
          AND userType = ${userType} 
          AND isUsed = false
        `;

        // Save OTP to database
        await prisma.$executeRaw`
          INSERT INTO OTP (email, userType, code, expiresAt, isUsed, updatedAt)
          VALUES (${email}, ${userType}, ${hashedOTP}, ${expiresAt}, false, NOW())
        `;

        // Send OTP via email
        await sendOTPEmail(email, otp);

        return NextResponse.json({
          success: true,
          message: 'OTP sent for email verification. Please check your email.',
          data: {
            redirectTo: '/verify-otp',
            email: email,
            userType: userType,
            otpSent: true,
          },
        });
      } else {
        // Verified student/teacher - direct login
        const userData = createUserData(user, userType);
        const tokenPayload: TokenPayload = {
          userId: user.id,
          email: user.email,
          role: userType,
          userData,
        };

        const token = await createToken(tokenPayload);

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { last_login: new Date() },
        });

        // Determine redirect path based on role
        const redirectTo = getDashboardPath(userType);

        return NextResponse.json(
          {
            success: true,
            message: 'Login successful',
            data: {
              user: userData,
              redirectTo,
              token,
              userType,
              verified: true,
              shouldRedirect: true,
            },
          },
          {
            status: 200,
            headers: {
              'Set-Cookie': `token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`,
            },
          }
        );
      }
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
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login: new Date() },
    });

    // Determine redirect path based on role
    const redirectTo = getDashboardPath(userType);

    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        data: {
          user: userData,
          redirectTo,
          token,
          userType,
          verified: true,
        },
      },
      {
        status: 200,
        headers: {
          'Set-Cookie': `token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`,
        },
      }
    );
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
  } finally {
    await prisma.$disconnect();
  }
}

function getDashboardPath(role: AllRoles): string {
  switch (role) {
    case 'super_admin':
      return '/admin/dashboard';
    case 'sub_admin':
      return '/admin/dashboard';
    case 'department_admin':
      return '/department/dashboard';
    case 'child_admin':
      return '/sub-admin/dashboard';
    case 'teacher':
      return '/faculty/dashboard';
    case 'student':
      return '/student/dashboard';
    default:
      return '/dashboard';
  }
}
