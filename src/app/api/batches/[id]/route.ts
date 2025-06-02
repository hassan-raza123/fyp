import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/api-utils';
import { batches_status } from '@prisma/client';

// GET /api/batches/[id] - Get a single batch by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const batch = await prisma.batches.findUnique({
      where: { id: params.id },
      include: {
        program: {
          select: {
            name: true,
            code: true,
            department: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
        students: {
          select: {
            id: true,
            rollNumber: true,
            user: {
              select: {
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        },
        sections: {
          select: {
            id: true,
            name: true,
            courseOffering: {
              select: {
                course: {
                  select: {
                    name: true,
                    code: true,
                  },
                },
              },
            },
            faculty: {
              select: {
                user: {
                  select: {
                    first_name: true,
                    last_name: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            students: true,
            sections: true,
          },
        },
      },
    });

    if (!batch) {
      return NextResponse.json(
        { success: false, error: 'Batch not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: batch,
    });
  } catch (error) {
    console.error('Error fetching batch:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch batch' },
      { status: 500 }
    );
  }
}

// PUT /api/batches/[id] - Update a batch
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const { success: authSuccess, error: authError } = await requireAuth(
      request
    );
    if (!authSuccess) {
      return NextResponse.json(
        { success: false, error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check role
    const { success: roleSuccess, error: roleError } = requireRole(request, [
      'super_admin',
      'sub_admin',
      'department_admin',
    ]);
    if (!roleSuccess) {
      return NextResponse.json(
        { success: false, error: roleError || 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check if batch exists
    const existingBatch = await prisma.batches.findUnique({
      where: { id: params.id },
    });

    if (!existingBatch) {
      return NextResponse.json(
        { success: false, error: 'Batch not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      name,
      code,
      programId,
      startDate,
      endDate,
      maxStudents,
      description,
      status,
    } = body;

    // Validate dates if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid date format' },
          { status: 400 }
        );
      }

      if (start >= end) {
        return NextResponse.json(
          { success: false, error: 'Start date must be before end date' },
          { status: 400 }
        );
      }
    }

    // Validate maxStudents if provided
    if (maxStudents) {
      const maxStudentsNum = parseInt(maxStudents);
      if (isNaN(maxStudentsNum) || maxStudentsNum <= 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid maxStudents value' },
          { status: 400 }
        );
      }
    }

    // Check if code is unique if being updated
    if (code && code !== existingBatch.code) {
      const codeExists = await prisma.batches.findUnique({
        where: { code: code.trim() },
      });

      if (codeExists) {
        return NextResponse.json(
          { success: false, error: 'Batch code already exists' },
          { status: 400 }
        );
      }
    }

    // Update the batch
    const updatedBatch = await prisma.batches.update({
      where: { id: params.id },
      data: {
        name: name ? name.trim() : undefined,
        code: code ? code.trim() : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        maxStudents: maxStudents ? parseInt(maxStudents) : undefined,
        description: description ? description.trim() : undefined,
        status: status as batches_status,
        programId: programId ? parseInt(programId) : undefined,
      },
      include: {
        program: {
          select: {
            name: true,
            code: true,
            department: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Batch updated successfully',
      data: updatedBatch,
    });
  } catch (error) {
    console.error('Error updating batch:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to update batch',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/batches/[id] - Delete a batch
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const { success: authSuccess, error: authError } = await requireAuth(
      request
    );
    if (!authSuccess) {
      return NextResponse.json(
        { success: false, error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check role
    const { success: roleSuccess, error: roleError } = requireRole(request, [
      'super_admin',
      'sub_admin',
    ]);
    if (!roleSuccess) {
      return NextResponse.json(
        { success: false, error: roleError || 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check if batch exists
    const existingBatch = await prisma.batches.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            students: true,
            sections: true,
          },
        },
      },
    });

    if (!existingBatch) {
      return NextResponse.json(
        { success: false, error: 'Batch not found' },
        { status: 404 }
      );
    }

    // Check if batch has students or sections
    if (
      existingBatch._count.students > 0 ||
      existingBatch._count.sections > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete batch with associated students or sections',
        },
        { status: 400 }
      );
    }

    // Delete the batch
    await prisma.batches.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Batch deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting batch:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to delete batch',
      },
      { status: 500 }
    );
  }
}
