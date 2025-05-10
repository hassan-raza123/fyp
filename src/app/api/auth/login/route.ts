import { NextRequest, NextResponse } from 'next/server';
import { User, UserStatus } from '@/lib/database/entities/User';
import { UserRole } from '@/lib/database/entities/UserRole';
import { Role } from '@/lib/database/entities/Role';
import { OTP } from '@/lib/database/entities/OTP';
import { z } from 'zod';
import nodemailer from 'nodemailer';
const bcrypt = require('bcryptjs');
import { createToken } from '@/lib/jwt';
import { AUTH_TOKEN_COOKIE, COOKIE_OPTIONS } from '@/constants/auth';
import {
  AdminRole,
  AllRoles,
  LoginResponse,
  UserWithRoles,
  UserData,
  TokenPayload,
} from '@/types/auth';
import { getRepository } from '@/lib/database/dbConnect';

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate a user and return a JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - userType
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               userType:
 *                 type: string
 *                 enum: [student, teacher, admin]
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     userData:
 *                       type: object
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Invalid credentials
 *       429:
 *         description: Too many login attempts
 *       500:
 *         description: Internal server error
 */

// Rate limiting setup
const rateLimit = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
const MAX_OTP_REQUESTS = 10;

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
): AllRoles {
  switch (userType) {
    case 'student':
      return 'student';
    case 'teacher':
      return 'teacher';
    case 'admin':
      return 'super_admin';
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
    };
  }

  if (userType === 'teacher' && user.faculty) {
    return {
      ...baseData,
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

async function saveOTP(
  email: string,
  userType: string,
  otp: string
): Promise<void> {
  const otpRepo = await getRepository(OTP);

  // Delete any existing unused OTPs for this user
  await otpRepo.delete({
    email,
    userType,
    isUsed: false,
  });

  // Save new OTP
  const hashedOTP = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

  const newOTP = otpRepo.create({
    email,
    userType,
    code: hashedOTP,
    expiresAt,
    isUsed: false,
  });

  await otpRepo.save(newOTP);
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
      (timestamp) => now - timestamp < RATE_LIMIT_WINDOW
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

    // Get repositories
    const userRepo = await getRepository(User);
    const userRoleRepo = await getRepository(UserRole);
    const roleRepo = await getRepository(Role);

    // Find user by email
    const user = await userRepo.findOne({
      where: { email },
      relations: ['student', 'faculty'],
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email or password',
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
          message: 'Invalid email or password',
        },
        { status: 401 }
      );
    }

    // Get user roles
    const userRoles = await userRoleRepo.find({
      where: { user: { id: user.id } },
      relations: ['role'],
    });

    // Map user type to role
    const expectedRole = mapUserTypeToRole(userType);

    // Check if user has the expected role
    const hasExpectedRole = userRoles.some(
      (userRole) => userRole.role.name === expectedRole
    );

    if (!hasExpectedRole) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid user type for this account',
        },
        { status: 403 }
      );
    }

    // Check if user is active
    if (user.status !== UserStatus.ACTIVE) {
      return NextResponse.json(
        {
          success: false,
          message: 'Your account is not active. Please contact support.',
        },
        { status: 403 }
      );
    }

    // Generate and send OTP for admin users or unverified emails
    const isAdmin = isAdminRole(expectedRole);
    if (isAdmin || !user.email_verified) {
      const otp = generateOTP();
      await sendOTPEmail(email, otp);
      await saveOTP(email, userType, otp);

      // Update rate limit
      recentRequests.push(now);
      rateLimit.set(email, recentRequests);

      return NextResponse.json({
        success: true,
        message: 'OTP sent to your email',
        requiresOTP: true,
      });
    }

    // Create user data for token
    const userData = createUserData(user, expectedRole);

    // Create token payload
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: expectedRole,
      userData,
    };

    // Create token
    const token = await createToken(tokenPayload);

    // Create response
    const response: LoginResponse = {
      success: true,
      message: 'Login successful',
      user: userData,
    };

    // Set cookie and return response
    const res = NextResponse.json(response);
    res.cookies.set(AUTH_TOKEN_COOKIE, token, COOKIE_OPTIONS);

    return res;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred during login',
      } as LoginResponse,
      { status: 500 }
    );
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
