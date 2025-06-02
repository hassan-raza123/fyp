import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { requireRole } from '@/lib/role';

// GET /api/batches/[id]/students - Get students in a batch
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const batch = await prisma.Batch.findUnique({
      where: { id: params.id },
      include: {
        students: {
          include: {
            user: {
              select: {
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    return NextResponse.json(batch.students);
  } catch (error) {
    console.error('Error fetching batch students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch batch students' },
      { status: 500 }
    );
  }
}

// POST /api/batches/[id]/students - Add students to a batch
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication and authorization check
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const roleResult = requireRole(request, ['admin']);
    if (!roleResult.success) {
      return NextResponse.json({ error: roleResult.error }, { status: 403 });
    }

    const { studentIds } = await request.json();

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { error: 'Student IDs array is required' },
        { status: 400 }
      );
    }

    // Check if batch exists and get its program
    const batch = await prisma.Batch.findUnique({
      where: { id: params.id },
      select: { programId: true },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // Check if all students exist and belong to the same program
    const students = await prisma.student.findMany({
      where: {
        id: { in: studentIds.map((id) => parseInt(id)) },
      },
      select: {
        id: true,
        programId: true,
        batchId: true,
      },
    });

    // Check if all students exist
    if (students.length !== studentIds.length) {
      return NextResponse.json(
        { error: 'One or more students not found' },
        { status: 404 }
      );
    }

    // Check if all students belong to the correct program
    const invalidProgramStudents = students.filter(
      (student) => student.programId !== batch.programId
    );

    if (invalidProgramStudents.length > 0) {
      return NextResponse.json(
        {
          error: "Some students do not belong to the batch's program",
          invalidStudents: invalidProgramStudents,
        },
        { status: 400 }
      );
    }

    // Check if any students are already assigned to a batch
    const alreadyAssignedStudents = students.filter(
      (student) => student.batchId !== null
    );

    if (alreadyAssignedStudents.length > 0) {
      return NextResponse.json(
        {
          error: 'Some students are already assigned to a batch',
          alreadyAssignedStudents: alreadyAssignedStudents,
        },
        { status: 400 }
      );
    }

    // Update students in batch
    await prisma.student.updateMany({
      where: {
        id: { in: studentIds.map((id) => parseInt(id)) },
      },
      data: {
        batchId: params.id,
      },
    });

    return NextResponse.json({ success: true, count: studentIds.length });
  } catch (error) {
    console.error('Error adding students to batch:', error);
    return NextResponse.json(
      { error: 'Failed to add students to batch' },
      { status: 500 }
    );
  }
}

// DELETE /api/batches/[id]/students - Remove students from a batch
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication and authorization check
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const roleResult = requireRole(request, ['admin']);
    if (!roleResult.success) {
      return NextResponse.json({ error: roleResult.error }, { status: 403 });
    }

    const { studentIds } = await request.json();

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { error: 'Student IDs array is required' },
        { status: 400 }
      );
    }

    // Check if batch exists
    const batch = await prisma.Batch.findUnique({
      where: { id: params.id },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // Check if all students belong to this batch
    const students = await prisma.student.findMany({
      where: {
        id: { in: studentIds.map((id) => parseInt(id)) },
        batchId: params.id,
      },
    });

    if (students.length !== studentIds.length) {
      return NextResponse.json(
        { error: 'Some students are not assigned to this batch' },
        { status: 400 }
      );
    }

    // Remove students from batch
    await prisma.student.updateMany({
      where: {
        id: { in: studentIds.map((id) => parseInt(id)) },
        batchId: params.id,
      },
      data: {
        batchId: null,
      },
    });

    return NextResponse.json({ success: true, count: studentIds.length });
  } catch (error) {
    console.error('Error removing students from batch:', error);
    return NextResponse.json(
      { error: 'Failed to remove students from batch' },
      { status: 500 }
    );
  }
}
