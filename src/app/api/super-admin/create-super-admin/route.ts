import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';
import { hash } from 'bcryptjs';
import { sendAdminAssignmentEmail } from '@/lib/email-utils';
import { getDefaultPassword } from '@/lib/password-utils';

// POST /api/super-admin/create-super-admin - Create super admin user
export async function POST(request: NextRequest) {
  try {
    const { success, user, error } = requireAuth(request);
    if (!success || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only super admin can create other super admins
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Only super admin can create super admin users' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, first_name, last_name, phone_number } = body;

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

    // Hash password (use role-based default password)
    const defaultPassword = getDefaultPassword('super_admin');
    const hashedPassword = await hash(defaultPassword, 12);

    // Generate username from email
    const username = email.split('@')[0];

    // Get super_admin role
    const superAdminRole = await prisma.roles.findUnique({
      where: { name: 'super_admin' },
    });

    if (!superAdminRole) {
      return NextResponse.json(
        { success: false, error: 'Super admin role not found' },
        { status: 500 }
      );
    }

    // Start transaction to create user and assign super_admin role
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

      // Assign super_admin role
      await tx.userroles.create({
        data: {
          userId: newUser.id,
          roleId: superAdminRole.id,
          updatedAt: new Date(),
        },
      });

      return newUser;
    });

    // Send email notification
    try {
      await sendAdminAssignmentEmail({
        email: result.email,
        firstName: result.first_name,
        lastName: result.last_name,
        departmentName: 'System',
        departmentCode: 'SYS',
        password: defaultPassword,
        role: 'super_admin',
      });
    } catch (emailError) {
      console.error('Error sending super admin creation email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Super admin created successfully',
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
    console.error('Error creating super admin:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create super admin',
      },
      { status: 500 }
    );
  }
}

