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

    // Get the department details
    const department = await prisma.departments.findFirst({
      where: { id: departmentId },
      include: {
        _count: {
          select: {
            programs: true,
            courses: true,
            students: true,
            faculties: true,
          },
        },
        admin: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: department,
    });
  } catch (error) {
    console.error('Department error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request: NextRequest) {
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
    if (!body.name || !body.code) {
      return NextResponse.json(
        { error: 'Department name and code are required' },
        { status: 400 }
      );
    }

    // Check if department code already exists (excluding current department)
    const existingDepartment = await prisma.departments.findFirst({
      where: {
        code: body.code,
        id: { not: departmentId },
      },
    });

    if (existingDepartment) {
      return NextResponse.json(
        { error: 'Department code already exists' },
        { status: 400 }
      );
    }

    // Update department
    const updatedDepartment = await prisma.departments.update({
      where: { id: departmentId },
      data: {
        name: body.name,
        code: body.code,
        description: body.description,
        status: body.status,
      },
      include: {
        _count: {
          select: {
            programs: true,
            courses: true,
            students: true,
            faculties: true,
          },
        },
        admin: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedDepartment,
      message: 'Department updated successfully',
    });
  } catch (error) {
    console.error('Update department error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
