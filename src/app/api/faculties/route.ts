import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getDepartmentIdFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { success, user, error } = await requireAuth(request);
    if (!success || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins can access this endpoint
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get department ID directly from token (fast, no database query)
    const currentDepartmentId = await getDepartmentIdFromRequest(request);
    
    if (!currentDepartmentId) {
      return NextResponse.json(
        { success: false, error: 'Department not assigned. Please contact super admin to assign a department to your account.' },
        { status: 400 }
      );
    }

    // Always filter by current department
    const whereClause: any = {
      status: 'active',
      departmentId: currentDepartmentId,
    };

    const faculties = await prisma.faculties.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            status: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    console.log('Found faculties:', faculties.length);

    return NextResponse.json({
      success: true,
      data: faculties,
    });
  } catch (error) {
    console.error('Error fetching faculties:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch faculties' },
      { status: 500 }
    );
  }
}
