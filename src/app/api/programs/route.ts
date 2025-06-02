import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Prisma, programs_status } from '@prisma/client';
import { requireRole, requireAuth } from '@/lib/api-utils';

type ProgramWithCounts = Prisma.programsGetPayload<{
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
        { name: { contains: search } },
        { code: { contains: search } },
      ];
    }

    const [programs, total] = await Promise.all([
      prisma.programs.findMany({
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
      prisma.programs.count({ where }),
    ]);

    // Transform the data to match the expected format in the frontend
    const transformedPrograms = programs.map((program) => ({
      ...program,
      _count: {
        ...program._count,
        courses: program._count.courses,
      },
    }));

    return NextResponse.json({
      success: true,
      data: transformedPrograms,
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
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch programs',
      },
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
    if (!Object.values(programs_status).includes(status as programs_status)) {
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
    const department = await prisma.departments.findUnique({
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

    // Check if program code already exists
    const existingProgram = await prisma.programs.findUnique({
      where: { code },
    });

    if (existingProgram) {
      return NextResponse.json(
        {
          success: false,
          error: 'Program code already exists',
        },
        { status: 400 }
      );
    }

    // Create program
    const program = await prisma.programs.create({
      data: {
        name,
        code,
        departmentId: Number(departmentId),
        totalCreditHours: Number(totalCreditHours),
        duration: Number(duration),
        description,
        status: status as programs_status,
      },
      include: {
        department: true,
        _count: {
          select: {
            students: true,
            courses: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Program created successfully',
      data: program,
    });
  } catch (error) {
    console.error('Error creating program:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
