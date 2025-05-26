import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/batches/[id] - Get batch details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const batch = await prisma.Batch.findUnique({
      where: { id: params.id },
      include: {
        program: {
          select: {
            name: true,
            code: true,
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
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    return NextResponse.json(batch);
  } catch (error) {
    console.error('Error fetching batch:', error);
    return NextResponse.json(
      { error: 'Failed to fetch batch' },
      { status: 500 }
    );
  }
}

// PUT /api/batches/[id] - Update batch details
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    // Validate required fields
    if (
      !name ||
      !code ||
      !programId ||
      !startDate ||
      !endDate ||
      !maxStudents
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if code is unique (excluding current batch)
    const existingBatch = await prisma.Batch.findFirst({
      where: {
        code,
        id: { not: params.id },
      },
    });

    if (existingBatch) {
      return NextResponse.json(
        { error: 'Batch code already exists' },
        { status: 400 }
      );
    }

    const batch = await prisma.Batch.update({
      where: { id: params.id },
      data: {
        name,
        code,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        maxStudents: parseInt(maxStudents),
        description,
        status,
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

    return NextResponse.json(batch);
  } catch (error) {
    console.error('Error updating batch:', error);
    return NextResponse.json(
      { error: 'Failed to update batch' },
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
    // Check if batch has students
    const batch = await prisma.Batch.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    if (batch._count.students > 0) {
      return NextResponse.json(
        { error: 'Cannot delete batch with enrolled students' },
        { status: 400 }
      );
    }

    await prisma.Batch.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Batch deleted successfully' });
  } catch (error) {
    console.error('Error deleting batch:', error);
    return NextResponse.json(
      { error: 'Failed to delete batch' },
      { status: 500 }
    );
  }
}
