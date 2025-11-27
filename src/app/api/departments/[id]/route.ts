import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';

// GET /api/departments/[id] - Get a single department
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { success, user } = requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only super admin can view department details
    if (user?.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const departmentId = parseInt(id);
    if (isNaN(departmentId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid department ID' },
        { status: 400 }
      );
    }

    const department = await prisma.departments.findUnique({
      where: { id: departmentId },
      include: {
        admin: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            status: true,
          },
        },
        _count: {
          select: {
            faculties: true,
            students: true,
            programs: true,
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

    return NextResponse.json({
      success: true,
      data: {
        id: department.id,
        name: department.name,
        code: department.code,
        description: department.description,
        status: department.status,
        admin: department.admin
          ? {
              id: department.admin.id,
              name: `${department.admin.first_name} ${department.admin.last_name}`,
              email: department.admin.email,
              status: department.admin.status,
            }
          : null,
        counts: {
          faculties: department._count.faculties,
          students: department._count.students,
          programs: department._count.programs,
          courses: department._count.courses,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching department:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch department' },
      { status: 500 }
    );
  }
}

// PUT /api/departments/[id] - Update a department
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { success, user, error } = requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only super admin can update departments
    if (user?.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Only super admin can update departments' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const departmentId = parseInt(id);
    if (isNaN(departmentId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid department ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, code, description, status } = body;

    // Check if department exists
    const existingDepartment = await prisma.departments.findUnique({
      where: { id: departmentId },
    });

    if (!existingDepartment) {
      return NextResponse.json(
        { success: false, error: 'Department not found' },
        { status: 404 }
      );
    }

    // If code is being changed, check if new code already exists
    if (code && code.trim() !== existingDepartment.code) {
      const codeExists = await prisma.departments.findUnique({
        where: { code: code.trim().toUpperCase() },
      });

      if (codeExists) {
        return NextResponse.json(
          { success: false, error: 'Department code already exists' },
          { status: 400 }
        );
      }
    }

    // Update department
    const department = await prisma.departments.update({
      where: { id: departmentId },
      data: {
        ...(name && { name: name.trim() }),
        ...(code && { code: code.trim().toUpperCase() }),
        ...(description !== undefined && {
          description: description?.trim() || null,
        }),
        ...(status && { status }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Department updated successfully',
      data: {
        id: department.id,
        name: department.name,
        code: department.code,
        description: department.description,
        status: department.status,
      },
    });
  } catch (error) {
    console.error('Error updating department:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update department',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/departments/[id] - Delete a department
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { success, user, error } = requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only super admin can delete departments
    if (user?.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Only super admin can delete departments' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const departmentId = parseInt(id);
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
            faculties: true,
            students: true,
            programs: true,
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

    // Check if department has any data
    const hasData =
      department._count.faculties > 0 ||
      department._count.students > 0 ||
      department._count.programs > 0 ||
      department._count.courses > 0;

    if (hasData) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Cannot delete department with existing faculties, students, programs, or courses',
        },
        { status: 400 }
      );
    }

    // Delete department
    await prisma.departments.delete({
      where: { id: departmentId },
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
        error:
          error instanceof Error
            ? error.message
            : 'Failed to delete department',
      },
      { status: 500 }
    );
  }
}

