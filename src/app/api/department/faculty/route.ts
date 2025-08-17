import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get the department admin's department
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

    if (!departmentAdmin || !departmentAdmin.departmentAdmin) {
      return NextResponse.json(
        { error: 'Department admin not found' },
        { status: 403 }
      );
    }

    const departmentId = departmentAdmin.departmentAdmin.id;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const departmentFilter = searchParams.get('departmentId') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      departmentId: departmentId, // Only show faculty from admin's department
    };

    if (search) {
      whereClause.OR = [
        { employeeId: { contains: search, mode: 'insensitive' } },
        { designation: { contains: search, mode: 'insensitive' } },
        { user: { first_name: { contains: search, mode: 'insensitive' } } },
        { user: { last_name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (departmentFilter && departmentFilter !== 'all') {
      whereClause.departmentId = parseInt(departmentFilter);
    }

    // Get total count
    const totalCount = await prisma.faculty.count({
      where: whereClause,
    });

    // Get faculty with pagination
    const faculty = await prisma.faculty.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone_number: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            sections: true,
            courses: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        user: {
          first_name: 'asc',
        },
      },
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: faculty,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Department faculty error:', error);
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
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get the department admin's department
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

    if (!departmentAdmin || !departmentAdmin.departmentAdmin) {
      return NextResponse.json(
        { error: 'Department admin not found' },
        { status: 403 }
      );
    }

    const departmentId = departmentAdmin.departmentAdmin.id;
    const body = await request.json();

    // Validate required fields
    if (!body.employeeId || !body.designation || !body.userId) {
      return NextResponse.json(
        { error: 'Employee ID, designation, and user ID are required' },
        { status: 400 }
      );
    }

    // Check if faculty already exists
    const existingFaculty = await prisma.faculty.findFirst({
      where: {
        OR: [{ employeeId: body.employeeId }, { userId: body.userId }],
      },
    });

    if (existingFaculty) {
      return NextResponse.json(
        {
          error:
            'Faculty member already exists with this employee ID or user ID',
        },
        { status: 400 }
      );
    }

    // Create new faculty
    const newFaculty = await prisma.faculty.create({
      data: {
        employeeId: body.employeeId,
        designation: body.designation,
        status: body.status || 'active',
        userId: body.userId,
        departmentId: departmentId, // Automatically assign to admin's department
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone_number: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: newFaculty,
      message: 'Faculty member created successfully',
    });
  } catch (error) {
    console.error('Create faculty error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
