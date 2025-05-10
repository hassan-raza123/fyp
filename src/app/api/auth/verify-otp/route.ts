import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, role_name } from '@prisma/client';
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

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP
 *     description: Verify the OTP sent to user's email and complete the login process
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - userType
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *               userType:
 *                 type: string
 *                 enum: [student, teacher, admin]
 *     responses:
 *       200:
 *         description: OTP verification successful
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
 *         description: Invalid OTP
 *       403:
 *         description: User does not have required role
 *       429:
 *         description: Too many OTP verification attempts
 *       500:
 *         description: Internal server error
 */
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
    const otpRecord = await prisma.$queryRaw`
      SELECT id, code, expiresAt, isUsed 
      FROM OTP 
      WHERE email = ${email} 
      AND userType = ${userType} 
      AND isUsed = false 
      ORDER BY createdAt DESC 
      LIMIT 1
    `;

    console.log('OTP Record:', otpRecord); // Debug log

    if (!otpRecord || !Array.isArray(otpRecord) || otpRecord.length === 0) {
      console.log('No valid OTP found for:', { email, userType }); // Debug log
      return NextResponse.json(
        {
          success: false,
          message: 'No valid OTP found. Please request a new OTP.',
        },
        { status: 400 }
      );
    }

    const otpData = otpRecord[0] as {
      id: number;
      code: string;
      expiresAt: Date;
      isUsed: boolean;
    };

    // Check if OTP is expired
    if (new Date(otpData.expiresAt) < new Date()) {
      console.log('OTP expired:', otpData.expiresAt); // Debug log
      return NextResponse.json(
        {
          success: false,
          message: 'OTP has expired. Please request a new OTP.',
        },
        { status: 400 }
      );
    }

    // Verify OTP
    const isOTPValid = await bcrypt.compare(otp, otpData.code);
    if (!isOTPValid) {
      console.log('OTP mismatch:', { provided: otp, stored: otpData.code }); // Debug log
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid OTP code. Please try again.',
        },
        { status: 400 }
      );
    }

    // Mark OTP as used
    await prisma.$executeRaw`
      UPDATE OTP 
      SET isUsed = true,
          updatedAt = NOW()
      WHERE id = ${otpData.id}
    `;

    // Get user data
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
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    // Get user roles from database
    const userRoles = user.userrole.map((ur) => ur.role.name as role_name);
    let actualRole: AllRoles;

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

      // Get the first admin role found
      actualRole = userRoles.find(isAdminRole) as AdminRole;
    } else {
      // Handle students and teachers
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
      actualRole = userType;

      // For non-admin users, mark email as verified after first successful OTP verification
      if (!user.email_verified) {
        await prisma.user.update({
          where: { id: user.id },
          data: { email_verified: true },
        });
      }
    }

    // Create user data based on role
    const userData = createUserData(user, actualRole);

    // Create JWT token
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: actualRole,
      userData,
    };

    const token = await createToken(tokenPayload);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login: new Date() },
    });

    // Determine redirect path based on role
    const redirectTo = getDashboardPath(actualRole);

    return NextResponse.json(
      {
        success: true,
        message: 'OTP verified successfully. Redirecting to dashboard...',
        data: {
          user: userData,
          redirectTo,
          token,
          userType: actualRole,
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
