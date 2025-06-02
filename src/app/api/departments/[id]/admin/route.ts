import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';

interface UserWithRole {
  id: number;
  userrole: {
    role: {
      name: string;
    };
  }[];
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const departmentId = parseInt(params.id);
    if (isNaN(departmentId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid department ID' },
        { status: 400 }
      );
    }

    const { adminId } = await request.json();

    // Check if department exists
    const department = await prisma.departments.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      return NextResponse.json(
        { success: false, error: 'Department not found' },
        { status: 404 }
      );
    }

    // Validate adminId if provided
    if (adminId !== null) {
      const admin = await prisma.users.findUnique({
        where: { id: adminId },
        include: {
          userrole: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!admin) {
        return NextResponse.json(
          { success: false, error: 'Admin not found' },
          { status: 404 }
        );
      }

      // Check if user has department_admin role
      const isDepartmentAdmin =
        admin.userrole?.role.name === 'department_admin';

      if (!isDepartmentAdmin) {
        return NextResponse.json(
          { success: false, error: 'User is not a department admin' },
          { status: 400 }
        );
      }
    }

    // Update department
    const updatedDepartment = await prisma.departments.update({
      where: { id: departmentId },
      data: { adminId },
      include: {
        admin: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedDepartment,
    });
  } catch (error) {
    console.error('Error assigning department admin:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to assign department admin',
      },
      { status: 500 }
    );
  }
}
