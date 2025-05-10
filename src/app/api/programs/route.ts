import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Prisma, program_status } from '@prisma/client';
import { requireRole, requireAuth } from '@/lib/api-utils';

type ProgramWithCounts = Prisma.programGetPayload<{
  include: {
    department: true;
    _count: {
      select: {
        students: true;
        courses: true;
      };
    };
  };
}> & {
  totalCreditHours: number;
  duration: number;
};

/**
 * @swagger
 * /api/programs:
 *   get:
 *     summary: Get all programs
 *     description: Retrieve a list of programs with optional filtering and pagination
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
 *         description: Search term for program code or name
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *         description: Filter by department ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, archived]
 *         description: Filter by program status
 *     responses:
 *       200:
 *         description: List of programs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 programs:
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
 *                       totalCreditHours:
 *                         type: number
 *                       duration:
 *                         type: number
 *                       department:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           code:
 *                             type: string
 *                       status:
 *                         type: string
 *                         enum: [active, inactive, archived]
 *                       _count:
 *                         type: object
 *                         properties:
 *                           students:
 *                             type: integer
 *                           courses:
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
 *     summary: Create a new program
 *     description: Create a new program with the provided information
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
 *               - departmentId
 *               - totalCreditHours
 *               - duration
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               departmentId:
 *                 type: integer
 *               totalCreditHours:
 *                 type: number
 *               duration:
 *                 type: number
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive, archived]
 *     responses:
 *       200:
 *         description: Program created successfully
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
 *                     departmentId:
 *                       type: integer
 *                     totalCreditHours:
 *                       type: number
 *                     duration:
 *                       type: number
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
export async function GET(request: NextRequest) {
  try {
    // Check authentication and role
    const { success, user, error } = requireRole(request, [
      'super_admin',
      'sub_admin',
      'department_admin',
      'teacher',
      'student',
    ]);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const departmentId = searchParams.get('departmentId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {};
    if (departmentId) where.departmentId = parseInt(departmentId);
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [programs, total] = await Promise.all([
      prisma.program.findMany({
        where,
        include: {
          department: true,
          _count: {
            select: {
              students: true,
              courses: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.program.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: programs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching programs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch programs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('1. Starting program creation process');

    // Check authentication and get user data
    const { success, user, error } = requireAuth(request);
    console.log('2. Auth check result:', { success, user: user?.email, error });

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error,
        },
        { status: 401 }
      );
    }

    // Check if user has required role
    const userRoles = user?.role.split(',') || [];
    const allowedRoles = ['super_admin', 'sub_admin', 'department_admin'];
    const hasRequiredRole = userRoles.some((role: string) =>
      allowedRoles.includes(role)
    );
    console.log('3. Role check result:', { userRoles, hasRequiredRole });

    if (!hasRequiredRole) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 403 }
      );
    }

    let body;
    try {
      body = await request.json();
      console.log('4. Request body:', body);
    } catch (e) {
      console.error('Failed to parse request body:', e);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
        },
        { status: 400 }
      );
    }

    const {
      name,
      code,
      departmentId,
      totalCreditHours,
      duration,
      description,
      status = 'active',
    } = body;

    // Validate required fields
    if (!name?.trim()) {
      console.log('5. Validation failed: name missing');
      return NextResponse.json(
        {
          success: false,
          error: 'Program name is required',
        },
        { status: 400 }
      );
    }
    if (!code?.trim()) {
      console.log('6. Validation failed: code missing');
      return NextResponse.json(
        {
          success: false,
          error: 'Program code is required',
        },
        { status: 400 }
      );
    }
    if (!departmentId) {
      console.log('7. Validation failed: departmentId missing');
      return NextResponse.json(
        {
          success: false,
          error: 'Department is required',
        },
        { status: 400 }
      );
    }
    if (
      !totalCreditHours ||
      isNaN(Number(totalCreditHours)) ||
      Number(totalCreditHours) <= 0
    ) {
      console.log('8. Validation failed: invalid totalCreditHours');
      return NextResponse.json(
        {
          success: false,
          error: 'Valid total credit hours is required',
        },
        { status: 400 }
      );
    }
    if (!duration || isNaN(Number(duration)) || Number(duration) <= 0) {
      console.log('9. Validation failed: invalid duration');
      return NextResponse.json(
        {
          success: false,
          error: 'Valid duration is required',
        },
        { status: 400 }
      );
    }

    // Validate status
    if (!Object.values(program_status).includes(status as program_status)) {
      console.log('10. Validation failed: invalid status');
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid status value',
        },
        { status: 400 }
      );
    }

    // Check if department exists
    console.log('11. Checking department:', departmentId);
    const department = await prisma.department.findUnique({
      where: { id: Number(departmentId) },
    });
    console.log('12. Department check result:', department);

    if (!department) {
      return NextResponse.json(
        {
          success: false,
          error: 'Department not found',
        },
        { status: 404 }
      );
    }

    // Check if program code is unique
    console.log('13. Checking program code uniqueness:', code);
    const existingProgram = await prisma.program.findUnique({
      where: { code },
    });
    console.log('14. Program code check result:', existingProgram);

    if (existingProgram) {
      return NextResponse.json(
        {
          success: false,
          error: 'Program code already exists',
        },
        { status: 400 }
      );
    }

    // Create the program
    console.log('15. Creating program with data:', {
      name: name.trim(),
      code: code.trim(),
      departmentId: Number(departmentId),
      totalCreditHours: Number(totalCreditHours),
      duration: Number(duration),
      description: description?.trim() || null,
      status: status as program_status,
    });

    const program = (await prisma.program.create({
      data: {
        name: name.trim(),
        code: code.trim(),
        departmentId: Number(departmentId),
        totalCreditHours: Number(totalCreditHours),
        duration: Number(duration),
        description: description?.trim() || null,
        status: status as program_status,
        updatedAt: new Date(),
      } as Prisma.programUncheckedCreateInput,
      include: {
        department: true,
        _count: {
          select: {
            students: true,
            courses: true,
          },
        },
      },
    })) as ProgramWithCounts;

    console.log('16. Program created successfully:', program);

    return NextResponse.json({
      success: true,
      message: 'Program created successfully',
      data: {
        id: program.id,
        name: program.name,
        code: program.code,
        description: program.description,
        status: program.status,
        totalCreditHours: program.totalCreditHours,
        duration: program.duration,
        department: {
          id: program.department.id,
          name: program.department.name,
          code: program.department.code,
        },
        stats: {
          students: program._count.students,
          courses: program._count.courses,
        },
      },
    });
  } catch (error) {
    console.error('18. Error in program creation:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
