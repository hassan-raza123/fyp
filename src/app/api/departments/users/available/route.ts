import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and get user data
    const { success, user, error } = requireAuth(request);
    if (!success) {
      return NextResponse.json({ success: false, error }, { status: 401 });
    }

    // Check if user has admin role
    if (user?.role !== 'super_admin' && user?.role !== 'sub_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get all users who can be assigned as faculty
    const availableUsers = await prisma.$queryRaw`
      SELECT DISTINCT u.id, u.first_name, u.last_name, u.email
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.userId
      LEFT JOIN faculty f ON u.id = f.userId
      WHERE (
        -- Users with no roles
        ur.id IS NULL
        OR 
        -- Users with department_admin role
        ur.roleId IN (SELECT id FROM roles WHERE name = 'department_admin')
        OR
        -- Users who are faculty but not active in any department
        (f.id IS NOT NULL AND f.status = 'inactive')
      )
      AND u.id NOT IN (
        -- Exclude users who are active faculty in any department
        SELECT userId FROM faculty WHERE status = 'active'
      )
    `;

    return NextResponse.json({
      success: true,
      users: availableUsers,
    });
  } catch (error) {
    console.error('Error fetching available users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch available users' },
      { status: 500 }
    );
  }
}
