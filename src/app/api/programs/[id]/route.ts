import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { programs_status } from '@prisma/client';
import { requireAuth } from '@/lib/api-utils';
import { Prisma } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const { success, user, error } = requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const program = await prisma.programs.findUnique({
      where: { id: parseInt(params.id) },
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

    if (!program) {
      return NextResponse.json(
        {
          success: false,
          error: 'Program not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
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
    console.error('Error fetching program:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch program',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const { success, user, error } = requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      code,
      departmentId,
      totalCreditHours,
      duration,
      description,
      status,
    } = body;

    // Check if program exists
    const existingProgram = await prisma.programs.findUnique({
      where: { id: parseInt(params.id) },
    });

    if (!existingProgram) {
      return NextResponse.json(
        {
          success: false,
          error: 'Program not found',
        },
        { status: 404 }
      );
    }

    // Check if new code is unique
    if (code && code !== existingProgram.code) {
      const codeExists = await prisma.programs.findUnique({
        where: { code },
      });

      if (codeExists) {
        return NextResponse.json(
          {
            success: false,
            error: 'Program code already exists',
          },
          { status: 400 }
        );
      }
    }

    // Check if department exists
    if (departmentId) {
      const department = await prisma.departments.findUnique({
        where: { id: departmentId },
      });

      if (!department) {
        return NextResponse.json(
          {
            success: false,
            error: 'Department not found',
          },
          { status: 404 }
        );
      }
    }

    const program = await prisma.programs.update({
      where: { id: parseInt(params.id) },
      data: {
        name,
        code,
        departmentId,
        totalCreditHours,
        duration,
        description,
        status: status as programs_status,
      } as Prisma.programsUncheckedUpdateInput,
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
    console.error('Error updating program:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to update program',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const { success, user, error } = requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if program exists
    const program = await prisma.programs.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        _count: {
          select: {
            students: true,
            courses: true,
          },
        },
      },
    });

    if (!program) {
      return NextResponse.json(
        {
          success: false,
          error: 'Program not found',
        },
        { status: 404 }
      );
    }

    // Check for dependencies
    if (program._count.students > 0 || program._count.courses > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete program with active students or courses',
          details: {
            students: program._count.students,
            courses: program._count.courses,
          },
        },
        { status: 400 }
      );
    }

    // Delete program
    await prisma.programs.delete({
      where: { id: parseInt(params.id) },
    });

    return NextResponse.json({
      success: true,
      message: 'Program deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting program:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to delete program',
      },
      { status: 500 }
    );
  }
}
