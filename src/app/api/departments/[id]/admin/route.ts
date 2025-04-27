import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
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

    // Validate adminId if provided
    if (adminId !== null) {
      const admin = await prisma.user.findUnique({
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
      const isDepartmentAdmin = admin.userrole.some(
        (ur) => ur.role.name === 'department_admin'
      );

      if (!isDepartmentAdmin) {
        return NextResponse.json(
          { success: false, error: 'User is not a department admin' },
          { status: 400 }
        );
      }
    }

    // Update department
    const updatedDepartment = await prisma.department.update({
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
