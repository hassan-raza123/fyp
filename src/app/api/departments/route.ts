import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET /api/departments - Get all departments (for admin selection or super admin view)
export async function GET(request: NextRequest) {
  try {
    const { success, user } = await requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Super admin can see all departments with their admins
    // Regular admin can only see active departments for selection
    const isSuperAdmin = user?.role === 'super_admin';

    if (isSuperAdmin) {
      const departments = await prisma.departments.findMany({
        where: {
          status: 'active',
        },
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
        orderBy: {
          name: 'asc',
        },
      });

      return NextResponse.json({
        success: true,
        data: departments.map((dept) => ({
          id: dept.id,
          name: dept.name,
          code: dept.code,
          description: dept.description,
          status: dept.status,
          admin: dept.admin
            ? {
                id: dept.admin.id,
                name: `${dept.admin.first_name} ${dept.admin.last_name}`,
                email: dept.admin.email,
                status: dept.admin.status,
              }
            : null,
          counts: {
            faculties: dept._count.faculties,
            students: dept._count.students,
            programs: dept._count.programs,
            courses: dept._count.courses,
          },
        })),
      });
    } else {
      // Regular admin - just list for selection
      const departments = await prisma.departments.findMany({
        where: {
          status: 'active',
        },
        select: {
          id: true,
          name: true,
          code: true,
          description: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return NextResponse.json({
        success: true,
        data: departments,
      });
    }
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}

// POST /api/departments - Create a new department
export async function POST(request: NextRequest) {
  try {
    const { success, user, error } = await requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only super admin can create departments
    if (user?.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Only super admin can create departments' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, code, description } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Department name is required' },
        { status: 400 }
      );
    }

    if (!code || !code.trim()) {
      return NextResponse.json(
        { success: false, error: 'Department code is required' },
        { status: 400 }
      );
    }

    // Check if department code already exists
    const existingDepartment = await prisma.departments.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (existingDepartment) {
      return NextResponse.json(
        { success: false, error: 'Department code already exists' },
        { status: 400 }
      );
    }

    // Create department
    const department = await prisma.departments.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description?.trim() || null,
        status: 'active',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Department created successfully',
      data: {
        id: department.id,
        name: department.name,
        code: department.code,
        description: department.description,
      },
    });
  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create department',
      },
      { status: 500 }
    );
  }
}

