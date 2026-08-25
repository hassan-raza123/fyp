import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { summariseAuditAction } from '@/lib/audit-summary';
import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth';


export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(request, ['super_admin']);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: authResult.error === 'Insufficient permissions' ? 403 : 401 }
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
        summary: summariseAuditAction(activity.action, activity.details),
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

