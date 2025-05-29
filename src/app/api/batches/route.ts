import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/api-utils';
import { batches_status } from '@prisma/client';

// GET /api/batches - Get all batches with optional filters
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { success, user, error } = requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build query conditions
    const where: any = {};

    if (programId) {
      where.programId = parseInt(programId);
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { description: { contains: search } },
      ];
    }

    console.log('Fetching batches with conditions:', where);

    // Execute the query using Prisma
    const batches = await prisma.batches.findMany({
      where,
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
        _count: {
          select: {
            students: true,
            sections: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('Found batches:', batches.length);

    return NextResponse.json({
      success: true,
      data: batches,
    });
  } catch (error) {
    console.error('Error fetching batches:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch batches' },
      { status: 500 }
    );
  }
}

// POST /api/batches - Create a new batch
export async function POST(request: NextRequest) {
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
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate program exists
    const program = await prisma.programs.findUnique({
      where: { id: parseInt(programId) },
    });

    if (!program) {
      return NextResponse.json(
        { success: false, error: 'Program not found' },
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

    // Validate maxStudents
    const maxStudentsNum = parseInt(maxStudents);
    if (isNaN(maxStudentsNum) || maxStudentsNum <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid maxStudents value' },
        { status: 400 }
      );
    }

    // Check if batch code already exists
    const existingBatch = await prisma.batches.findUnique({
      where: { code: code.trim() },
    });

    if (existingBatch) {
      return NextResponse.json(
        { success: false, error: 'Batch code already exists' },
        { status: 400 }
      );
    }

    // Create the batch
    const newBatch = await prisma.batches.create({
      data: {
        name: name.trim(),
        code: code.trim(),
        startDate: start,
        endDate: end,
        maxStudents: maxStudentsNum,
        description: description ? description.trim() : null,
        status: (status || 'upcoming') as batches_status,
        programId: parseInt(programId),
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
      message: 'Batch created successfully',
      data: newBatch,
    });
  } catch (error) {
    console.error('Error creating batch:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to create batch',
      },
      { status: 500 }
    );
  }
}
