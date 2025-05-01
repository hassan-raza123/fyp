import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/api-utils';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hash } from 'bcryptjs';
import { student, faculty } from '@prisma/client';

// GET /api/users - Get all users
export async function GET(request: NextRequest) {
  try {
    // Check authentication and role
    const { success, user, error } = requireRole(request, [
      'super_admin',
      'sub_admin',
      'department_admin',
      'teacher',
    ]);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all users with their roles
    const users = await prisma.user.findMany({
      where: {
        userrole: {
          some: {
            role: {
              name: {
                in: ['super_admin', 'sub_admin', 'department_admin', 'teacher'],
              },
            },
          },
        },
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        userrole: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Format the response
    const formattedUsers = users.map((user) => ({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      roles: user.userrole.map((ur) => ur.role.name),
    }));

    return NextResponse.json({
      success: true,
      data: formattedUsers,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
export async function POST(request: Request) {
  try {
    // Get the session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has admin role
    const userRoles = session.user.role.split(',');
    const isAdmin = userRoles.some((role) =>
      ['super_admin', 'sub_admin'].includes(role)
    );

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const data = await request.json();
    const {
      email,
      password,
      first_name,
      last_name,
      role,
      phone_number,
      departmentId,
      programId,
      rollNumber,
      designation,
    } = data;

    // Validate required fields
    if (!email || !password || !first_name || !last_name || !role) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['sub_admin', 'department_admin', 'teacher', 'student'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid role',
        },
        { status: 400 }
      );
    }

    // Validate role-specific fields
    if (role === 'student' && (!rollNumber || !departmentId || !programId)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Roll number, department, and program are required for students',
        },
        { status: 400 }
      );
    }

    if (role === 'teacher' && (!departmentId || !designation)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Department and designation are required for teachers',
        },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email already exists',
        },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Get role ID
    const roleRecord = await prisma.role.findUnique({
      where: { name: role },
    });

    if (!roleRecord) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid role',
        },
        { status: 400 }
      );
    }

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        password_hash: hashedPassword,
        first_name,
        last_name,
        phone_number,
        userrole: {
          create: {
            roleId: roleRecord.id,
          },
        },
      },
    });

    // Create role-specific records
    let studentRecord: student | null = null;
    let facultyRecord: faculty | null = null;

    if (role === 'student') {
      studentRecord = await prisma.student.create({
        data: {
          rollNumber,
          departmentId,
          programId,
          userId: newUser.id,
        },
      });
    } else if (role === 'teacher') {
      facultyRecord = await prisma.faculty.create({
        data: {
          designation,
          departmentId,
          userId: newUser.id,
        },
      });
    }

    // Fetch the complete user data
    const completeUser = await prisma.user.findUnique({
      where: { id: newUser.id },
      include: {
        userrole: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!completeUser) {
      throw new Error('Failed to fetch created user');
    }

    return NextResponse.json({
      success: true,
      data: {
        id: completeUser.id,
        email: completeUser.email,
        first_name: completeUser.first_name,
        last_name: completeUser.last_name,
        phone_number: completeUser.phone_number,
        role: completeUser.userrole[0].role.name,
        ...(studentRecord && {
          student: {
            rollNumber: studentRecord.rollNumber,
            departmentId: studentRecord.departmentId,
            programId: studentRecord.programId,
          },
        }),
        ...(facultyRecord && {
          faculty: {
            designation: facultyRecord.designation,
            departmentId: facultyRecord.departmentId,
          },
        }),
      },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create user',
      },
      { status: 500 }
    );
  }
}
