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

    // Build the where clause based on user role
    const whereClause: any = {
      NOT: {
        id: user.userId, // Exclude current user
      },
    };

    // If user is sub_admin, exclude super_admin users
    if (user.role === 'sub_admin') {
      whereClause.userrole = {
        role: {
          NOT: {
            name: 'super_admin',
          },
        },
      };
    }

    const users = await prisma.users.findMany({
      where: whereClause,
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
            departmentId: true,
            designation: true,
            status: true,
          },
        },
        student: {
          select: {
            rollNumber: true,
            departmentId: true,
            programId: true,
            status: true,
          },
        },
      },
    });

    // Format the response
    const formattedUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      status: user.status,
      role: user.userrole?.role.name || 'No Role',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      ...(user.faculty && {
        faculty: {
          departmentId: user.faculty.departmentId,
          designation: user.faculty.designation,
          status: user.faculty.status,
        },
      }),
      ...(user.student && {
        student: {
          rollNumber: user.student.rollNumber,
          departmentId: user.student.departmentId,
          programId: user.student.programId,
          status: user.student.status,
        },
      }),
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
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
    const { email, password, first_name, last_name, phone_number } = body;

    // Validate required fields
    if (!email || !first_name || !last_name) {
      return NextResponse.json(
        {
          error: 'Required fields missing: email, first name, and last name',
        },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password (use provided password or default)
    const defaultPassword = '11223344';
    const hashedPassword = await hash(password || defaultPassword, 12);

    // Generate username from email
    const username = email.split('@')[0];

    // Create user with basic information only
    const newUser = await prisma.users.create({
      data: {
        email,
        username,
        password_hash: hashedPassword,
        first_name,
        last_name,
        phone_number: phone_number || null,
        status: 'active',
        email_verified: false,
        profile_image: null,
        last_login: null,
        updatedAt: new Date(),
      },
    });

    // Send welcome email with credentials
    try {
      // Implement email sending logic here
      console.log('Welcome email would be sent here');
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        status: newUser.status,
      },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create user',
      },
      { status: 500 }
    );
  }
}
