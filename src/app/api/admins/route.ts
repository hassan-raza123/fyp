import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { hash } from 'bcryptjs';
import { getDefaultPassword } from '@/lib/password-utils';
import { z } from 'zod';

const createAdminSchema = z.object({
  email: z.string().email('Invalid email format'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone_number: z.string().nullable().optional(),
  status: z.enum(['active', 'inactive']).optional().default('active'),
});

export async function GET(request: NextRequest) {
  try {
    const { success, user, error } = await requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins and super_admin can view other admins
    if (user?.role !== 'admin' && user?.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get admin's department for scoping (admins only see admins in their department)
    let departmentId: number | null = null;
    if (user?.role === 'admin') {
      const { getDepartmentIdFromRequest } = await import('@/lib/auth');
      departmentId = await getDepartmentIdFromRequest(request);
    }

    // Get all users with admin role, scoped by department for admin role
    const adminUsers = await prisma.users.findMany({
      where: {
        userrole: {
          role: {
            name: 'admin',
          },
        },
        // If requesting user is admin (not super_admin), scope to their department
        ...(departmentId && {
          faculty: {
            departmentId,
          },
        }),
      },
      include: {
        userrole: {
          include: {
            role: true,
          },
        },
        faculty: {
          include: {
            department: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format the response
    const formattedAdmins = adminUsers.map((admin) => ({
      id: admin.faculty?.id || null,
      userId: admin.id,
      user: {
        id: admin.id,
        first_name: admin.first_name,
        last_name: admin.last_name,
        email: admin.email,
        status: admin.status,
      },
      employeeId: null,
      designation: admin.faculty?.designation || 'Admin',
      department: admin.faculty?.department || null,
    }));

    return NextResponse.json({
      success: true,
      data: formattedAdmins,
    });
  } catch (error) {
    console.error('Error fetching admins:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch admins' },
      { status: 500 }
    );
  }
}

// POST /api/admins - Create a new admin
export async function POST(request: NextRequest) {
  try {
    const { success, user, error } = await requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins and super_admin can create other admins
    if (user?.role !== 'admin' && user?.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validationResult = createAdminSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error.errors[0]?.message || 'Validation failed',
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Check if email already exists
    const existingUser = await prisma.users.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password (use role-based default password)
    const defaultPassword = getDefaultPassword('admin');
    const hashedPassword = await hash(defaultPassword, 12);

    // Generate username from email
    const username = validatedData.email.split('@')[0];

    // Get admin role
    const adminRole = await prisma.roles.findUnique({
      where: { name: 'admin' },
    });

    if (!adminRole) {
      return NextResponse.json(
        { success: false, error: 'Admin role not found' },
        { status: 500 }
      );
    }

    // Get current user's department if admin
    const { getDepartmentIdFromRequest } = await import('@/lib/auth');
    const departmentId = await getDepartmentIdFromRequest(request);

    // Start transaction to create user and assign admin role
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.users.create({
        data: {
          email: validatedData.email,
          username,
          password_hash: hashedPassword,
          first_name: validatedData.first_name,
          last_name: validatedData.last_name,
          phone_number: validatedData.phone_number || null,
          status: validatedData.status || 'active',
          email_verified: false,
          profile_image: null,
          last_login: null,
          updatedAt: new Date(),
        },
      });

      // Assign admin role
      await tx.userroles.create({
        data: {
          userId: newUser.id,
          roleId: adminRole.id,
          updatedAt: new Date(),
        },
      });

      // If department is available, create faculty record
      if (departmentId) {
        await tx.faculties.create({
          data: {
            userId: newUser.id,
            departmentId,
            designation: 'Admin',
            status: validatedData.status || 'active',
            updatedAt: new Date(),
          },
        });
      }

      return newUser;
    });

    // Format the response
    const formattedAdmin = {
      id: null,
      userId: result.id,
      user: {
        id: result.id,
        first_name: result.first_name,
        last_name: result.last_name,
        email: result.email,
        status: result.status,
      },
      employeeId: null,
      designation: 'Admin',
      department: null,
    };

    return NextResponse.json({
      success: true,
      data: formattedAdmin,
      message: 'Admin created successfully',
      defaultPassword,
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create admin',
      },
      { status: 500 }
    );
  }
}

