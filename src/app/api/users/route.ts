import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { requireAuth } from '@/lib/api-utils';

// GET /api/users - Get all users
export async function GET(request: NextRequest) {
  try {
    // Check authentication and get user data
    const { success, user, error } = requireAuth(request);
    if (!success) {
      return NextResponse.json({ error }, { status: 401 });
    }

    // Check if user has admin role
    if (user?.role !== 'super_admin' && user?.role !== 'sub_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      where: {
        userrole: {
          none: {
            role: {
              name: 'super_admin',
            },
          },
        },
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        userrole: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
        faculty: {
          select: {
            employeeId: true,
            departmentId: true,
          },
        },
        student: {
          select: {
            rollNumber: true,
            departmentId: true,
            programId: true,
          },
        },
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    // Check authentication and get user data
    const { success, user: authUser, error } = requireAuth(request);
    if (!success) {
      return NextResponse.json({ error }, { status: 401 });
    }

    // Check if user has admin role
    if (authUser?.role !== 'super_admin' && authUser?.role !== 'sub_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      email,
      first_name,
      last_name,
      role,
      departmentId,
      programId,
      employeeId,
      rollNumber,
    } = body;

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      );
    }

    // Check if trying to create super admin
    if (role === 'super_admin') {
      return NextResponse.json(
        { error: 'Super admin role cannot be assigned to new users' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['sub_admin', 'department_admin', 'teacher', 'student'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      );
    }

    // Validate role-specific fields
    if (role === 'student' && (!rollNumber || !departmentId || !programId)) {
      return NextResponse.json(
        {
          error:
            'Roll number, department, and program are required for students',
        },
        { status: 400 }
      );
    }

    if (role === 'teacher' && (!employeeId || !departmentId)) {
      return NextResponse.json(
        { error: 'Employee ID and department are required for teachers' },
        { status: 400 }
      );
    }

    if (role === 'department_admin' && !departmentId) {
      return NextResponse.json(
        { error: 'Department is required for department admin' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Set default password and hash it
    const defaultPassword = '11223344';
    const hashedPassword = await hash(defaultPassword, 12);

    // Get the role ID
    const roleRecord = await prisma.role.findUnique({
      where: { name: role },
    });

    if (!roleRecord) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      );
    }

    // Create user with role and related data
    const newUser = await prisma.user.create({
      data: {
        email,
        password_hash: hashedPassword,
        first_name: first_name || null,
        last_name: last_name || null,
        status: 'active',
        updatedAt: new Date(),
        userrole: {
          create: {
            roleId: roleRecord.id,
            updatedAt: new Date(),
          },
        },
        ...(role === 'student' && {
          student: {
            create: {
              rollNumber,
              departmentId: parseInt(departmentId),
              programId: parseInt(programId),
              batch: new Date().getFullYear().toString(),
              admissionDate: new Date(),
              updatedAt: new Date(),
            },
          },
        }),
        ...(role === 'teacher' && {
          faculty: {
            create: {
              employeeId,
              departmentId: parseInt(departmentId),
              designation: 'Teacher',
              joiningDate: new Date(),
              updatedAt: new Date(),
            },
          },
        }),
      },
      include: {
        student: role === 'student',
        faculty: role === 'teacher',
      },
    });

    return NextResponse.json({
      id: newUser.id,
      email: newUser.email,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      status: newUser.status,
      role,
      ...(role === 'student' && {
        student: {
          rollNumber: newUser.student?.rollNumber,
          departmentId: newUser.student?.departmentId,
          programId: newUser.student?.programId,
        },
      }),
      ...(role === 'teacher' && {
        faculty: {
          employeeId: newUser.faculty?.employeeId,
          departmentId: newUser.faculty?.departmentId,
        },
      }),
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
