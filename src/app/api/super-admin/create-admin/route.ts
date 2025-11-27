import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';
import { hash } from 'bcryptjs';

// POST /api/super-admin/create-admin - Create admin user and assign department
export async function POST(request: NextRequest) {
  try {
    const { success, user, error } = requireAuth(request);
    if (!success || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only super admin can create admins
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Only super admin can create admin users' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, first_name, last_name, phone_number, departmentId, designation } = body;

    // Validate required fields
    if (!email || !first_name || !last_name) {
      return NextResponse.json(
        { success: false, error: 'Email, first name, and last name are required' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // If department is provided, verify it exists
    if (departmentId) {
      const department = await prisma.departments.findUnique({
        where: { id: parseInt(departmentId) },
      });

      if (!department) {
        return NextResponse.json(
          { success: false, error: 'Department not found' },
          { status: 404 }
        );
      }
    }

    // Hash password (use default password)
    const defaultPassword = '11223344';
    const hashedPassword = await hash(defaultPassword, 12);

    // Generate username from email
    const username = email.split('@')[0];

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

    // Start transaction to create user, assign role, and department
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.users.create({
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

      // Assign admin role
      await tx.userroles.create({
        data: {
          userId: newUser.id,
          roleId: adminRole.id,
          updatedAt: new Date(),
        },
      });

      // If department is provided, create faculty record and assign to department
      if (departmentId) {
        const deptId = parseInt(departmentId);
        
        // Create faculty record for admin
        await tx.faculties.create({
          data: {
            userId: newUser.id,
            departmentId: deptId,
            designation: designation || 'Department Admin',
            status: 'active',
            updatedAt: new Date(),
          },
        });

        // Update department's adminId only if not already set
        const department = await tx.departments.findUnique({
          where: { id: deptId },
          select: { adminId: true },
        });

        if (!department?.adminId) {
          await tx.departments.update({
            where: { id: deptId },
            data: {
              adminId: newUser.id,
              updatedAt: new Date(),
            },
          });
        }
      }

      return newUser;
    });

    return NextResponse.json({
      success: true,
      message: 'Admin created successfully',
      data: {
        id: result.id,
        email: result.email,
        username: result.username,
        first_name: result.first_name,
        last_name: result.last_name,
        status: result.status,
      },
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

