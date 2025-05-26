import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/api-utils';
import { batches_status } from '@prisma/client';

// GET /api/batches/[id] - Get batch details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log('Fetching batch with ID:', id);

    const batch = await prisma.batches.findUnique({
      where: { id },
      include: {
        program: {
          select: {
            id: true,
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
            status: true,
            user: {
              select: {
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    if (!batch) {
      console.log('Batch not found for ID:', id);
      return NextResponse.json(
        { success: false, error: 'Batch not found' },
        { status: 404 }
      );
    }

    console.log('Batch found:', batch);
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

// PUT /api/batches/[id] - Update batch details
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = await Promise.resolve(params.id);

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

    const body = await request.json();
    const {
      name,
      programId,
      startDate,
      endDate,
      maxStudents,
      description,
      status,
    } = body;

    // Validate required fields
    if (!name || !programId || !startDate || !endDate || !maxStudents) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if batch exists
    const existingBatch = await prisma.batches.findUnique({
      where: { id },
    });

    if (!existingBatch) {
      return NextResponse.json(
        { success: false, error: 'Batch not found' },
        { status: 404 }
      );
    }

    // Check if name is unique (excluding current batch)
    const nameExists = await prisma.batches.findFirst({
      where: {
        name: name.trim(),
        id: { not: id },
      },
    });

    if (nameExists) {
      return NextResponse.json(
        { success: false, error: 'Batch name already exists' },
        { status: 400 }
      );
    }

    // Validate dates
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

    // Update batch
    const updatedBatch = await prisma.batches.update({
      where: { id },
      data: {
        name: name.trim(),
        startDate: start,
        endDate: end,
        maxStudents: parseInt(maxStudents),
        description: description ? description.trim() : null,
        status: (status || 'upcoming') as batches_status,
        programId: parseInt(programId),
      },
      include: {
        program: {
          select: {
            name: true,
            code: true,
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
      { success: false, error: 'Failed to update batch' },
      { status: 500 }
    );
  }
}

// DELETE /api/batches/[id] - Delete a batch
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = await Promise.resolve(params.id);

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

    // Check if batch exists and has students
    const batch = await prisma.batches.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            students: true,
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

    if (batch._count.students > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete batch with enrolled students' },
        { status: 400 }
      );
    }

    // Delete batch
    await prisma.batches.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Batch deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting batch:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete batch' },
      { status: 500 }
    );
  }
}
