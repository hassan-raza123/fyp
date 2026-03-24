import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const updateAdminSchema = z.object({
  first_name: z.string().min(1, 'First name is required').optional(),
  last_name: z.string().min(1, 'Last name is required').optional(),
  email: z.string().email('Invalid email format').optional(),
  phone_number: z.string().nullable().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

// GET /api/admins/[id] - Get admin details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Check authentication
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

    // Handle both sync and async params
    const resolvedParams = params instanceof Promise ? await params : params;
    const userId = parseInt(resolvedParams.id);

    if (!resolvedParams?.id || isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: 'Admin ID is required or invalid' },
        { status: 400 }
      );
    }

    // Get user with admin role
    const adminUser = await prisma.users.findUnique({
      where: { id: userId },
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
    });

    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Check if user has admin role
    const isAdmin = adminUser.userrole?.role?.name === 'admin';
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'User is not an admin' },
        { status: 404 }
      );
    }

    // Format the response
    const formattedAdmin = {
      id: adminUser.faculty?.id || null,
      userId: adminUser.id,
      user: {
        id: adminUser.id,
        first_name: adminUser.first_name,
        last_name: adminUser.last_name,
        email: adminUser.email,
        phone_number: adminUser.phone_number,
        status: adminUser.status,
      },
      employeeId: null,
      designation: adminUser.faculty?.designation || 'Admin',
      department: adminUser.faculty?.department || null,
    };

    return NextResponse.json({
      success: true,
      data: formattedAdmin,
    });
  } catch (error) {
    console.error('Error fetching admin:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch admin' },
      { status: 500 }
    );
  }
}

// PUT /api/admins/[id] - Update admin
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Check authentication
    const { success, user, error } = await requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins and super_admin can update other admins
    if (user?.role !== 'admin' && user?.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Handle both sync and async params
    const resolvedParams = params instanceof Promise ? await params : params;
    const userId = parseInt(resolvedParams.id);

    if (!resolvedParams?.id || isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: 'Admin ID is required or invalid' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validationResult = updateAdminSchema.safeParse(body);
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

    // Check if user exists and is an admin
    const existingUser = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        userrole: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Check if user has admin role
    const isAdmin = existingUser.userrole?.role?.name === 'admin';
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'User is not an admin' },
        { status: 404 }
      );
    }

    // Check if email is already taken by another user
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await prisma.users.findUnique({
        where: { email: validatedData.email },
      });
      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'Email already taken' },
          { status: 400 }
        );
      }
    }

    // Update user data
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        ...(validatedData.first_name && { first_name: validatedData.first_name }),
        ...(validatedData.last_name && { last_name: validatedData.last_name }),
        ...(validatedData.email && { email: validatedData.email }),
        ...(validatedData.phone_number !== undefined && { phone_number: validatedData.phone_number }),
        ...(validatedData.status && { status: validatedData.status }),
        updatedAt: new Date(),
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
    });

    // Update faculty/admin details if faculty record exists
    if (updatedUser.faculty && validatedData.status) {
      await prisma.faculties.update({
        where: { id: updatedUser.faculty.id },
        data: {
          status: validatedData.status,
          updatedAt: new Date(),
        },
      });
    }

    // Format the response
    const formattedAdmin = {
      id: updatedUser.faculty?.id || null,
      userId: updatedUser.id,
      user: {
        id: updatedUser.id,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        email: updatedUser.email,
        phone_number: updatedUser.phone_number,
        status: updatedUser.status,
      },
      employeeId: null,
      designation: updatedUser.faculty?.designation || 'Admin',
      department: updatedUser.faculty?.department || null,
    };

    return NextResponse.json({
      success: true,
      data: formattedAdmin,
    });
  } catch (error) {
    console.error('Error updating admin:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update admin' },
      { status: 500 }
    );
  }
}

// DELETE /api/admins/[id] - Delete admin
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Check authentication
    const { success, user, error } = await requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins and super_admin can delete other admins
    if (user?.role !== 'admin' && user?.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Handle both sync and async params
    const resolvedParams = params instanceof Promise ? await params : params;
    const userId = parseInt(resolvedParams.id);

    if (!resolvedParams?.id || isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: 'Admin ID is required or invalid' },
        { status: 400 }
      );
    }

    // Check if user exists and is an admin
    const existingUser = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        userrole: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Check if user has admin role
    const isAdmin = existingUser.userrole?.role?.name === 'admin';
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'User is not an admin' },
        { status: 404 }
      );
    }

    // Delete related records
    await prisma.userroles.deleteMany({
      where: { userId },
    });

    await prisma.faculties.deleteMany({
      where: { userId },
    });

    // Finally delete the user
    await prisma.users.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: 'Admin deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting admin:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete admin' },
      { status: 500 }
    );
  }
}

