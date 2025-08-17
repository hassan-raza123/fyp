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

    // Get users who are not already faculty members
    const availableUsers = await prisma.users.findMany({
      where: {
        AND: [
          {
            OR: [{ role: 'teacher' }, { role: 'faculty' }],
          },
          {
            // Not already a faculty member
            faculty: null,
          },
          {
            // Not already a student
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
        role: true,
      },
      orderBy: [{ first_name: 'asc' }, { last_name: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      data: availableUsers,
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
