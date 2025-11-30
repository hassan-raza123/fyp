import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

// GET /api/super-admin/super-admins - Get all super admin users
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(request, ['super_admin']);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Unauthorized' },
        { status: authResult.error === 'Insufficient permissions' ? 403 : 401 }
      );
    }

    // Get all users with super_admin role
    const superAdminUsers = await prisma.users.findMany({
      where: {
        userrole: {
          role: {
            name: 'super_admin',
          },
        },
      },
      include: {
        userrole: {
          include: {
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format the response
    const formattedSuperAdmins = superAdminUsers.map((superAdmin) => ({
      userId: superAdmin.id,
      user: {
        id: superAdmin.id,
        first_name: superAdmin.first_name,
        last_name: superAdmin.last_name,
        email: superAdmin.email,
        status: superAdmin.status,
        phone_number: superAdmin.phone_number,
        createdAt: superAdmin.createdAt,
        last_login: superAdmin.last_login,
      },
      role: 'super_admin',
    }));

    return NextResponse.json({
      success: true,
      data: formattedSuperAdmins,
    });
  } catch (error) {
    console.error('Error fetching super admins:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch super admins' },
      { status: 500 }
    );
  }
}

