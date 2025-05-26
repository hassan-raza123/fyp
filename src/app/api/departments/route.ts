import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import { Prisma, department_status, departments, users } from '@prisma/client';

const departmentInclude = {
  admin: true,
  _count: {
    select: {
      programs: true,
      faculties: true,
      students: true,
    },
  },
} as const;

type DepartmentWithIncludes = departments & {
  admin: users | null;
  _count: {
    programs: number;
    faculties: number;
    students: number;
  };
};

type DepartmentWithAdmin = departments & {
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

// GET /api/departments - List all departments
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { success, user, error } = requireAuth(request);
    if (!success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    if (user?.role !== 'super_admin' && user?.role !== 'sub_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortField = searchParams.get('sortField') || 'name';
    const sortDirection = searchParams.get('sortDirection') || 'asc';
    const searchQuery = searchParams.get('searchQuery') || '';
    const searchField = searchParams.get('searchField') || 'name';

    // Build where clause for search
    const where: any = {};
    if (searchQuery) {
      where[searchField] = {
        contains: searchQuery,
        mode: 'insensitive',
      };
    }

    // Get total count for pagination
    const total = await prisma.departments.count({ where });

    // Get departments with pagination and sorting
    const departments = await prisma.departments.findMany({
      where,
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
      orderBy: {
        [sortField]: sortDirection,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Format the response
    const formattedDepartments = departments.map(
      (dept: DepartmentWithAdmin) => ({
        id: dept.id,
        name: dept.name,
        code: dept.code,
        description: dept.description,
        status: dept.status,
        createdAt: dept.createdAt,
        updatedAt: dept.updatedAt,
        adminId: dept.adminId,
        admin: dept.admin
          ? {
              id: dept.admin.id,
              first_name: dept.admin.first_name,
              last_name: dept.admin.last_name,
              email: dept.admin.email,
            }
          : null,
        _count: {
          programs: dept._count.programs,
          faculties: dept._count.faculties,
          students: dept._count.students,
        },
      })
    );

    return NextResponse.json({
      success: true,
      data: formattedDepartments,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/departments:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch departments',
      },
      { status: 500 }
    );
  }
}

// POST /api/departments - Create new department
export async function POST(request: NextRequest) {
  try {
    // Check authentication and get user data
    const { success, user, error } = requireAuth(request);
    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error,
        },
        { status: 401 }
      );
    }

    // Check if user has admin role
    if (user?.role !== 'super_admin' && user?.role !== 'sub_admin') {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, code, description, status = 'active' } = body;

    if (!name || !code) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name and code are required',
        },
        { status: 400 }
      );
    }

    // Validate status
    if (!['active', 'inactive'].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid status value',
        },
        { status: 400 }
      );
    }

    // Check if department code already exists
    const existingDepartment = await prisma.departments.findUnique({
      where: { code },
    });

    if (existingDepartment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Department code already exists',
        },
        { status: 400 }
      );
    }

    const department = (await prisma.departments.create({
      data: {
        name,
        code,
        description,
        status: status as department_status,
        updatedAt: new Date(),
      },
      include: {
        admin: true,
        _count: {
          select: {
            programs: true,
            faculties: true,
            students: true,
          },
        },
      },
    })) as DepartmentWithAdmin;

    const formattedDepartment = {
      id: department.id,
      name: department.name,
      code: department.code,
      description: department.description,
      status: department.status,
      hod: department.admin
        ? {
            id: department.admin.id,
            name: `${department.admin.first_name} ${department.admin.last_name}`,
            email: department.admin.email,
          }
        : null,
      stats: {
        programs: department._count.programs,
        faculties: department._count.faculties,
        students: department._count.students,
      },
    };

    return NextResponse.json({
      success: true,
      message: 'Department created successfully',
      data: formattedDepartment,
    });
  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
