import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getUserIdFromRequest } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import { Prisma, department_status, department, user } from '@prisma/client';

const departmentInclude = {
  admin: true,
  _count: {
    select: {
      program: true,
      faculty: true,
      student: true,
    },
  },
} as const;

type DepartmentWithIncludes = department & {
  admin: user | null;
  _count: {
    program: number;
    faculty: number;
    student: number;
  };
};

type DepartmentWithAdmin = department & {
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

/**
 * @swagger
 * /api/departments:
 *   get:
 *     summary: Get all departments
 *     description: Retrieve a list of departments with optional filtering and pagination
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for department code or name
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, archived]
 *         description: Filter by department status
 *     responses:
 *       200:
 *         description: List of departments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 departments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       code:
 *                         type: string
 *                       name:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [active, inactive, archived]
 *                       admin:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           email:
 *                             type: string
 *                           first_name:
 *                             type: string
 *                           last_name:
 *                             type: string
 *                       _count:
 *                         type: object
 *                         properties:
 *                           programs:
 *                             type: integer
 *                           faculty:
 *                             type: integer
 *                           students:
 *                             type: integer
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Create a new department
 *     description: Create a new department with the provided information
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive, archived]
 *     responses:
 *       200:
 *         description: Department created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     code:
 *                       type: string
 *                     status:
 *                       type: string
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
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
    const total = await prisma.department.count({ where });

    // Get departments with pagination and sorting
    const departments = await prisma.department.findMany({
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
            faculty: true,
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
    const formattedDepartments = departments.map((dept) => ({
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
        faculty: dept._count.faculty,
        students: dept._count.students,
      },
    }));

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
    const existingDepartment = await prisma.department.findUnique({
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

    // Get current user's ID from the request
    // const userId = getUserIdFromRequest(request);
    // if (!userId) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       error: 'User ID not found',
    //     },
    //     { status: 401 }
    //   );
    // }

    const department = (await prisma.department.create({
      data: {
        name,
        code,
        description,
        status: status as department_status,
        // adminId: userId,
        updatedAt: new Date(),
      },
      include: {
        admin: true,
        _count: {
          select: {
            programs: true,
            faculty: true,
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
        faculty: department._count.faculty,
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
