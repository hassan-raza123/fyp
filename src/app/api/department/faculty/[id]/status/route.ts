import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const facultyId = parseInt(params.id);
    const body = await request.json();

    if (!body.status || !['active', 'inactive'].includes(body.status)) {
      return NextResponse.json(
        { error: 'Valid status is required (active or inactive)' },
        { status: 400 }
      );
    }

    // Check if faculty exists and belongs to admin's department
    const existingFaculty = await prisma.faculties.findFirst({
      where: {
        id: facultyId,
        departmentId: departmentId,
      },
    });

    if (!existingFaculty) {
      return NextResponse.json(
        { error: 'Faculty member not found' },
        { status: 404 }
      );
    }

    // Update faculty status
    const updatedFaculty = await prisma.faculties.update({
      where: { id: facultyId },
      data: {
        status: body.status,
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
      data: updatedFaculty,
      message: 'Faculty status updated successfully',
    });
  } catch (error) {
    console.error('Update faculty status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
