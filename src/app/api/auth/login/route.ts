import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import {
  AdminRole,
  AllRoles,
  LoginResponse,
  UserWithRoles,
  UserData,
  TokenPayload,
} from '@/types/auth';

const prisma = new PrismaClient();

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

function createUserData(user: UserWithRoles, userType: AllRoles): UserData {
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

export async function POST(
  request: NextRequest
): Promise<NextResponse<LoginResponse>> {
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

    const user = (await prisma.user.findUnique({
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
    })) as UserWithRoles | null;

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
    const userRoles = user.userrole.map((ur) => ur.role.name);
    let actualRole: AllRoles;

    // If user is trying to login as admin, check their admin role
    if (userType === 'admin') {
      // Check if user has any admin role
      const adminRoles = ['super_admin', 'sub_admin', 'department_admin', 'child_admin'];
      const userAdminRole = userRoles.find((role) => adminRoles.includes(role));
      
      if (!userAdminRole) {
        return NextResponse.json(
          {
            success: false,
            message: 'User does not have admin privileges',
          },
          { status: 403 }
        );
      }
      
      actualRole = userAdminRole as AdminRole;
    } else {
      // For non-admin types (student, teacher), check exact role match
      if (!userRoles.includes(userType)) {
        return NextResponse.json(
          {
            success: false,
            message: `User does not have ${userType} role`,
          },
          { status: 403 }
        );
      }
      actualRole = userType;
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
        message: 'Login successful',
        data: {
          user: userData,
          redirectTo,
          token,
          userType: actualRole,
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
    console.error('Login error:', error);
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
