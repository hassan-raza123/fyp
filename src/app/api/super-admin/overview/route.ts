import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';

function getActivitySummary(activity: any) {
  // Try to parse details JSON
  let details: any = {};
  try {
    details =
      typeof activity.details === 'string'
        ? JSON.parse(activity.details)
        : activity.details;
  } catch {
    details = activity.details;
  }
  const entity = details?.entity || details?.changes?.entity || 'entity';
  const field = details?.field || details?.changes?.field || '';
  const oldValue = details?.oldValue || details?.changes?.oldValue || '';
  const newValue = details?.newValue || details?.changes?.newValue || '';
  const action = activity.action || 'ACTION';
  const userRole = details?.userRole || '';
  const entityId = details?.entityId || details?.changes?.entityId || '';
  // Compose a readable message
  if (action === 'UPDATE') {
    return `Updated ${entity} (${field}) from '${oldValue}' to '${newValue}' [ID: ${entityId}]`;
  } else if (action === 'CREATE') {
    return `Created ${entity} (${field}) with value '${newValue}' [ID: ${entityId}]`;
  } else if (action === 'LOGIN') {
    return `User logged in [ID: ${entityId}]`;
  } else if (action === 'LOGOUT') {
    return `User logged out [ID: ${entityId}]`;
  } else {
    return `${action} on ${entity} (${field}) [ID: ${entityId}]`;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { success, user, error } = await requireAuth(request);
    if (!success || user?.role !== 'super_admin') {
      return NextResponse.json(
        { error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Super admin relevant statistics
    const totalDepartments = await prisma.departments.count({
      where: { status: 'active' },
    });
    const totalAdmins = await prisma.users.count({
      where: {
        status: 'active',
        userrole: {
          role: {
            name: 'admin',
          },
        },
      },
    });
    const assignedDepartments = await prisma.departments.count({
      where: {
        status: 'active',
        adminId: {
          not: null,
        },
      },
    });
    const unassignedDepartments = totalDepartments - assignedDepartments;

    // Get recent activities from audit logs (only department and admin related)
    const recentActivities = await prisma.auditlogs.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      where: {
        OR: [
          { action: { contains: 'DEPARTMENT' } },
          { action: { contains: 'ADMIN' } },
          { action: { contains: 'CREATE' } },
          { action: { contains: 'UPDATE' } },
        ],
      },
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
            userrole: {
              include: {
                role: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Get current semester
    const currentSemester = await prisma.semesters.findFirst({
      where: {
        status: 'active',
      },
      select: {
        name: true,
        startDate: true,
        endDate: true,
      },
    });

    return NextResponse.json({
      stats: {
        totalDepartments,
        totalAdmins,
        assignedDepartments,
        unassignedDepartments,
      },
      recentActivities: recentActivities.map((activity) => ({
        id: activity.id,
        summary: getActivitySummary(activity),
        createdAt: activity.createdAt,
        user: `${activity.user.first_name} ${activity.user.last_name}`,
        userRole: activity.user.userrole?.role.name || 'No Role',
        userEmail: activity.user.email,
      })),
      currentSemester,
    });
  } catch (error) {
    console.error('Error fetching super admin overview data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

