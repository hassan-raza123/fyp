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

    // Get users who are not already faculty members or students
    const availableUsers = await prisma.users.findMany({
      where: {
        AND: [
          {
            userrole: {
              role: {
                name: {
                  in: ['teacher', 'faculty'],
                },
              },
            },
          },
          {
            faculty: null,
          },
          {
            student: null,
          },
        ],
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone_number: true,
        userrole: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ first_name: 'asc' }, { last_name: 'asc' }],
    });

    // Format the response
    const formattedUsers = availableUsers.map((user) => ({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone_number: user.phone_number,
      role: user.userrole?.role?.name || 'unknown',
    }));

    return NextResponse.json({
      success: true,
      data: formattedUsers,
    });
  } catch (error) {
    console.error('Available users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
