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
    const type = searchParams.get('type') || '';
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

    if (type && type !== 'all') {
      whereClause.type = type;
    }

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    // Get courses with pagination
    const [courses, totalCount] = await Promise.all([
      prisma.courses.findMany({
        where: whereClause,
        include: {
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          prerequisites: {
            include: {
              prerequisite: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
          corequisites: {
            include: {
              corequisite: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
        skip: offset,
        take: limit,
      }),
      prisma.courses.count({
        where: whereClause,
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    const response = {
      success: true,
      data: courses,
      pagination: {
        total: totalCount,
        totalPages,
        currentPage: page,
        limit,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Department courses error:', error);
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
    const {
      code,
      name,
      description,
      creditHours,
      labHours,
      theoryHours,
      type,
      status,
    } = body;

    // Validate required fields
    if (!code || !name || !creditHours || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if course code already exists in the department
    const existingCourse = await prisma.courses.findFirst({
      where: {
        code: code,
        departmentId: departmentId,
      },
    });

    if (existingCourse) {
      return NextResponse.json(
        { error: 'Course code already exists in this department' },
        { status: 400 }
      );
    }

    // Create new course
    const newCourse = await prisma.courses.create({
      data: {
        code,
        name,
        description,
        creditHours,
        labHours: labHours || 0,
        theoryHours: theoryHours || 0,
        type,
        status: status || 'ACTIVE',
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
        prerequisites: {
          include: {
            prerequisite: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        corequisites: {
          include: {
            corequisite: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: newCourse,
      message: 'Course created successfully',
    });
  } catch (error) {
    console.error('Create department course error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
