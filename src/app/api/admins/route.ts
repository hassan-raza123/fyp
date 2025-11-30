import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

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

    // Get all users with admin role
    const adminUsers = await prisma.users.findMany({
      where: {
        userrole: {
          role: {
            name: 'admin',
          },
        },
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
      employeeId: admin.faculty?.employeeId || null,
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

