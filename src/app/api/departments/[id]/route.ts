import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/api-utils';
import { department_status } from '@prisma/client';

// Validation schema for department update
const departmentUpdateSchema = z.object({
  name: z.string().min(1, 'Department name is required').max(255),
  code: z
    .string()
    .min(1, 'Department code is required')
    .max(10, 'Department code must be at most 10 characters'),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']),
  adminId: z.number().optional(),
});

type DepartmentWithAdmin = {
  id: number;
  name: string;
  code: string;
  description: string | null;
  status: department_status;
  adminId: number | null;
  createdAt: Date;
  updatedAt: Date;
  admin: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  _count: {
    programs: number;
    faculties: number;
    students: number;
  };
};

// GET /api/departments/[id] - Get department details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
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

    const department = await prisma.departments.findUnique({
      where: { id: departmentId },
      include: {
        _count: {
          select: {
            faculties: true,
            students: true,
            courses: true,
          },
        },
      },
    });

    if (!department) {
      return NextResponse.json(
        { success: false, error: 'Department not found' },
        { status: 404 }
      );
    }

    // Fetch department admins
    const admins = await prisma.users.findMany({
      where: {
        AND: [
          {
            faculty: {
              departmentId: departmentId,
            },
          },
          {
            userrole: {
              role: {
                name: 'department_admin',
              },
            },
          },
        ],
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
      },
    });

    const formattedAdmins = admins.map((admin) => ({
      id: admin.id,
      first_name: admin.first_name,
      last_name: admin.last_name,
      email: admin.email,
      isHead: admin.id === department.adminId,
    }));

    // Fetch faculty members
    const facultyMembers = await prisma.faculties.findMany({
      where: {
        departmentId: departmentId,
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    const formattedFaculty = facultyMembers.map((faculty) => ({
      id: faculty.id,
      first_name: faculty.user.first_name,
      last_name: faculty.user.last_name,
      email: faculty.user.email,
      designation: faculty.designation,
      status: faculty.status,
    }));

    // Fetch programs
    const programs = await prisma.programs.findMany({
      where: {
        departmentId: departmentId,
      },
      include: {
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      department,
      admins: formattedAdmins,
      faculty: formattedFaculty,
      programs,
    });
  } catch (error) {
    console.error('Error fetching department details:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/departments/[id] - Update department
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and get user data
    const { success, user, error } = await requireAuth(request);
    if (!success) {
      return NextResponse.json({ error }, { status: 401 });
    }

    // Check if user has admin role
    if (user?.role !== 'super_admin' && user?.role !== 'sub_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { name, code, description, status, adminId } = body;

    // Validate required fields
    if (!name || !code) {
      return NextResponse.json(
        { error: 'Name and code are required' },
        { status: 400 }
      );
    }

    // Parse department ID
    const departmentId = parseInt(params.id);
    if (isNaN(departmentId)) {
      return NextResponse.json(
        { error: 'Invalid department ID' },
        { status: 400 }
      );
    }

    // Check if department exists
    const existingDepartment = await prisma.departments.findUnique({
      where: { id: departmentId },
    });

    if (!existingDepartment) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }

    // Start a transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // Update department
      const updatedDepartment = await tx.departments.update({
        where: { id: departmentId },
        data: {
          name,
          code,
          description,
          status: status as department_status,
          adminId: adminId ? parseInt(adminId) : null,
          updatedAt: new Date(),
        },
        include: {
          admin: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
          _count: {
            select: {
              programs: true,
              faculties: true,
              students: true,
            },
          },
        },
      });

      return updatedDepartment;
    });

    // Format the response to match frontend expectations
    const formattedDepartment = {
      id: result.id,
      name: result.name,
      code: result.code,
      description: result.description,
      status: result.status,
      hod: result.admin
        ? {
            id: result.admin.id,
            name: `${result.admin.first_name} ${result.admin.last_name}`,
            email: result.admin.email,
          }
        : null,
      stats: {
        programs: result._count.programs,
        faculties: result._count.faculties,
        students: result._count.students,
      },
    };

    return NextResponse.json({
      success: true,
      message: 'Department updated successfully',
      data: formattedDepartment,
    });
  } catch (error) {
    console.error('Error updating department:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/departments/[id] - Delete department
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireRole(request, ['super_admin', 'sub_admin']);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
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

    // Check if department exists
    const department = await prisma.departments.findUnique({
      where: { id: departmentId },
      include: {
        _count: {
          select: {
            programs: true,
            faculties: true,
            students: true,
          },
        },
      },
    });

    if (!department) {
      return NextResponse.json(
        { success: false, error: 'Department not found' },
        { status: 404 }
      );
    }

    // Check if department has any related data
    if (
      department._count.programs > 0 ||
      department._count.faculties > 0 ||
      department._count.students > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Cannot delete department with related data. Please remove all programs, faculty, and students first.',
          details: {
            programs: department._count.programs,
            faculties: department._count.faculties,
            students: department._count.students,
          },
        },
        { status: 400 }
      );
    }

    // Start a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Remove any department admin role assignments
      await tx.userroles.deleteMany({
        where: {
          user: {
            faculty: {
              departmentId: departmentId,
            },
          },
          role: {
            name: 'department_admin',
          },
        },
      });

      // Delete the department
      await tx.departments.delete({
        where: { id: departmentId },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Department deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting department:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete department',
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
