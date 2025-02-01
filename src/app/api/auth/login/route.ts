import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import {
  AdminRole,
  AllRoles,
  LoginResponse,
  UserWithRoles,
  UserData,
  TokenPayload,
} from '@/types/auth';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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
        roles: {
          include: {
            role: true,
          },
        },
        student: userType === 'student',
        faculty: userType === 'teacher',
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

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid credentials',
        },
        { status: 401 }
      );
    }

    let actualUserType: AllRoles = userType;
    let redirectPath = '/dashboard';

    if (userType === 'admin') {
      const adminRoles: AdminRole[] = [
        'super_admin',
        'department_admin',
        'child_admin',
      ];
      const userAdminRole = user.roles.find((userRole) =>
        adminRoles.includes(userRole.role.name as AdminRole)
      );

      if (!userAdminRole) {
        return NextResponse.json(
          {
            success: false,
            message: 'Access denied. You do not have admin privileges.',
          },
          { status: 403 }
        );
      }

      actualUserType = userAdminRole.role.name;

      switch (actualUserType) {
        case 'super_admin':
          redirectPath = '/admin/dashboard';
          break;
        case 'department_admin':
          redirectPath = '/department/dashboard';
          break;
        case 'child_admin':
          redirectPath = '/sub-admin/dashboard';
          break;
      }
    } else {
      const hasRole = user.roles.some(
        (userRole) => userRole.role.name === userType
      );

      if (!hasRole) {
        return NextResponse.json(
          {
            success: false,
            message: 'Access denied. Invalid role.',
          },
          { status: 403 }
        );
      }

      redirectPath =
        userType === 'student' ? '/student/dashboard' : '/faculty/dashboard';
    }

    const userData = createUserData(user, actualUserType);

    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: actualUserType,
      userData,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: '24h',
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { last_login: new Date() },
    });

    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        data: {
          user: userData,
          redirectTo: redirectPath,
          token: token,
          userType: actualUserType,
        },
      },
      { status: 200 }
    );

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred during login. Please try again.',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
