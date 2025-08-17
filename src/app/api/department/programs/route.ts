import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get user info from headers (set by middleware)
    const userId = request.headers.get('x-user-id');
    const userEmail = request.headers.get('x-user-email');
    const userRole = request.headers.get('x-user-role');

    if (!userId || !userEmail || !userRole) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get department admin's department
    const departmentAdmin = await prisma.users.findFirst({
      where: {
        id: parseInt(userId),
        departmentAdmin: {
          isNot: null,
        },
      },
      include: {
        departmentAdmin: true,
      },
    });

    if (!departmentAdmin?.departmentAdmin) {
      return NextResponse.json(
        { error: 'Department admin not found or no department assigned' },
        { status: 404 }
      );
    }

    const departmentId = departmentAdmin.departmentAdmin.id;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      departmentId: departmentId,
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    // Get programs with pagination
    const [programs, totalCount] = await Promise.all([
      prisma.programs.findMany({
        where: whereClause,
        include: {
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          _count: {
            select: {
              students: true,
              courses: true,
            },
          },
        },
        orderBy: { name: 'asc' },
        skip: offset,
        take: limit,
      }),
      prisma.programs.count({
        where: whereClause,
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    const response = {
      success: true,
      data: programs,
      pagination: {
        total: totalCount,
        totalPages,
        currentPage: page,
        limit,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Department programs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user info from headers
    const userId = request.headers.get('x-user-id');
    const userEmail = request.headers.get('x-user-email');
    const userRole = request.headers.get('x-user-role');

    if (!userId || !userEmail || !userRole) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get department admin's department
    const departmentAdmin = await prisma.users.findFirst({
      where: {
        id: parseInt(userId),
        departmentAdmin: {
          isNot: null,
        },
      },
      include: {
        departmentAdmin: true,
      },
    });

    if (!departmentAdmin?.departmentAdmin) {
      return NextResponse.json(
        { error: 'Department admin not found or no department assigned' },
        { status: 404 }
      );
    }

    const departmentId = departmentAdmin.departmentAdmin.id;

    // Get request body
    const body = await request.json();
    const { name, code, description, duration, totalCreditHours, status } =
      body;

    // Validate required fields
    if (!name || !code || !duration || !totalCreditHours) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if program code already exists in the department
    const existingProgram = await prisma.programs.findFirst({
      where: {
        code: code,
        departmentId: departmentId,
      },
    });

    if (existingProgram) {
      return NextResponse.json(
        { error: 'Program code already exists in this department' },
        { status: 400 }
      );
    }

    // Create new program
    const newProgram = await prisma.programs.create({
      data: {
        name,
        code,
        description,
        duration,
        totalCreditHours,
        status: status || 'active',
        departmentId: departmentId,
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
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
      data: newProgram,
      message: 'Program created successfully',
    });
  } catch (error) {
    console.error('Create department program error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
