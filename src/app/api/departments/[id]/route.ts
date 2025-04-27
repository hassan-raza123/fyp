import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  requireAuth,
  getUserIdFromRequest,
  requireRole,
} from '@/lib/api-utils';
import { department_status } from '@prisma/client';

const prismaClient = new PrismaClient();

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
    faculty: number;
    students: number;
  };
};

// GET /api/departments/[id] - Get department details
export async function GET(
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

    const department = await prisma.department.findUnique({
      where: { id: departmentId },
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
            faculty: true,
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

    return NextResponse.json({
      success: true,
      data: {
        ...department,
        createdAt: department.createdAt.toISOString(),
        updatedAt: department.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching department:', error);
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
    const { id } = await params;

    const authResult = await requireRole(request, ['super_admin', 'sub_admin']);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    const departmentId = parseInt(id);
    if (isNaN(departmentId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid department ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = departmentUpdateSchema.parse(body);

    // Check if department exists
    const existingDepartment = await prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!existingDepartment) {
      return NextResponse.json(
        { success: false, error: 'Department not found' },
        { status: 404 }
      );
    }

    // Check if code is already taken by another department
    if (validatedData.code !== existingDepartment.code) {
      const codeExists = await prisma.department.findFirst({
        where: {
          code: validatedData.code,
          id: { not: departmentId },
        },
      });

      if (codeExists) {
        return NextResponse.json(
          { success: false, error: 'Department code already exists' },
          { status: 400 }
        );
      }
    }

    // Update department
    const updatedDepartment = await prisma.department.update({
      where: { id: departmentId },
      data: {
        name: validatedData.name,
        code: validatedData.code,
        description: validatedData.description,
        status: validatedData.status,
        adminId: validatedData.adminId,
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
            faculty: true,
            students: true,
          },
        },
      },
    });

    // Format the response to match frontend expectations
    const formattedDepartment = {
      id: updatedDepartment.id,
      name: updatedDepartment.name,
      code: updatedDepartment.code,
      description: updatedDepartment.description,
      status: updatedDepartment.status,
      hod: updatedDepartment.admin
        ? {
            id: updatedDepartment.admin.id,
            name: `${updatedDepartment.admin.first_name} ${updatedDepartment.admin.last_name}`,
            email: updatedDepartment.admin.email,
          }
        : null,
      stats: {
        programs: updatedDepartment._count.programs,
        faculty: updatedDepartment._count.faculty,
        students: updatedDepartment._count.students,
      },
    };

    return NextResponse.json({
      success: true,
      message: 'Department updated successfully',
      data: formattedDepartment,
    });
  } catch (error) {
    console.error('Error updating department:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
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
    const { id } = await params;

    const authResult = await requireRole(request, ['super_admin', 'sub_admin']);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    const departmentId = parseInt(id);
    if (isNaN(departmentId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid department ID' },
        { status: 400 }
      );
    }

    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        _count: {
          select: {
            programs: true,
            faculty: true,
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
      department._count.faculty > 0 ||
      department._count.students > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete department with related data',
        },
        { status: 400 }
      );
    }

    // Delete department
    await prisma.department.delete({
      where: { id: departmentId },
    });

    return NextResponse.json({
      success: true,
      message: 'Department deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting department:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
