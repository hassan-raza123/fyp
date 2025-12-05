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

    // Fetch all faculties for the department
    const allFaculties = await prisma.faculties.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            status: true,
            userrole: {
              select: {
                role: {
                  select: {
                    name: true,
                  },
                },
              },
            },
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

    // Filter out admin users - only keep faculty role users
    const faculties = allFaculties
      .filter((faculty) => {
        const userRole = faculty.user.userrole?.role?.name;
        return userRole === 'faculty'; // Only include faculty role, exclude admin
      })
      .map((faculty) => ({
        id: faculty.id,
        userId: faculty.userId,
        designation: faculty.designation,
        status: faculty.status,
        createdAt: faculty.createdAt,
        updatedAt: faculty.updatedAt,
        user: {
          id: faculty.user.id,
          first_name: faculty.user.first_name,
          last_name: faculty.user.last_name,
          email: faculty.user.email,
          status: faculty.user.status,
        },
        department: faculty.department,
      }));

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
