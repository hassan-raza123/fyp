import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { z } from 'zod';

const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().optional(),
});

// GET - Get super admin profile
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(request, ['super_admin']);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Unauthorized' },
        { status: authResult.error === 'Insufficient permissions' ? 403 : 401 }
      );
    }

    const user = authResult.user;

    const superAdmin = await prisma.users.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone_number: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        last_login: true,
      },
    });

    if (!superAdmin) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: superAdmin.id,
        firstName: superAdmin.first_name,
        lastName: superAdmin.last_name,
        email: superAdmin.email,
        phoneNumber: superAdmin.phone_number || '',
        status: superAdmin.status,
        createdAt: superAdmin.createdAt,
        updatedAt: superAdmin.updatedAt,
        lastLogin: superAdmin.last_login,
      },
    });
  } catch (error) {
    console.error('Error fetching super admin profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PUT - Update super admin profile
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireRole(request, ['super_admin']);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Unauthorized' },
        { status: authResult.error === 'Insufficient permissions' ? 403 : 401 }
      );
    }

    const user = authResult.user;

    const body = await request.json();
    const validatedData = updateProfileSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        {
          success: false,
          error: validatedData.error.errors[0]?.message || 'Validation failed',
        },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, phoneNumber } = validatedData.data;

    // Check if email is already taken by another user
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser && existingUser.id !== user.userId) {
      return NextResponse.json(
        { success: false, error: 'Email already taken' },
        { status: 400 }
      );
    }

    // Update user
    const updatedUser = await prisma.users.update({
      where: { id: user.userId },
      data: {
        first_name: firstName,
        last_name: lastName,
        email,
        phone_number: phoneNumber || null,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone_number: true,
        status: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updatedUser.id,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        email: updatedUser.email,
        phoneNumber: updatedUser.phone_number || '',
        status: updatedUser.status,
      },
    });
  } catch (error) {
    console.error('Error updating super admin profile:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to update profile',
      },
      { status: 500 }
    );
  }
}

