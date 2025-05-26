import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/api-utils';
import { batches_status } from '@prisma/client';

// GET /api/batches - Get all batches with optional filters
export async function GET(request: NextRequest) {
  try {
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
        { description: { contains: search } },
      ];
    }

    // Execute the query using Prisma
    const batches = await prisma.batches.findMany({
      where,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

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
  console.log('Starting batch creation process...');

  try {
    // Check authentication
    console.log('Checking authentication...');
    const { success: authSuccess, error: authError } = await requireAuth(
      request
    );
    if (!authSuccess) {
      console.error('Authentication failed:', authError);
      return NextResponse.json(
        { success: false, error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }
    console.log('Authentication successful');

    // Check role
    console.log('Checking user role...');
    const { success: roleSuccess, error: roleError } = requireRole(request, [
      'super_admin',
      'sub_admin',
      'department_admin',
    ]);
    if (!roleSuccess) {
      console.error('Role check failed:', roleError);
      return NextResponse.json(
        { success: false, error: roleError || 'Insufficient permissions' },
        { status: 403 }
      );
    }
    console.log('Role check successful');

    // Parse request body
    console.log('Parsing request body...');
    const body = await request.json();
    console.log('Received batch creation request:', body);

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
    console.log('Validating required fields...');
    if (
      !name ||
      !code ||
      !programId ||
      !startDate ||
      !endDate ||
      !maxStudents
    ) {
      console.error('Missing required fields:', {
        name: !name,
        code: !code,
        programId: !programId,
        startDate: !startDate,
        endDate: !endDate,
        maxStudents: !maxStudents,
      });
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    console.log('Required fields validation passed');

    // Validate program exists
    console.log('Checking if program exists...');
    const program = await prisma.programs.findUnique({
      where: { id: parseInt(programId) },
    });

    if (!program) {
      console.error('Program not found:', programId);
      return NextResponse.json(
        { success: false, error: 'Program not found' },
        { status: 400 }
      );
    }
    console.log('Program found:', program);

    // Validate dates
    console.log('Validating dates...');
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.error('Invalid dates:', { startDate, endDate });
      return NextResponse.json(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (start >= end) {
      console.error('Start date must be before end date:', { start, end });
      return NextResponse.json(
        { success: false, error: 'Start date must be before end date' },
        { status: 400 }
      );
    }
    console.log('Date validation passed');

    // Validate maxStudents
    console.log('Validating maxStudents...');
    const maxStudentsNum = parseInt(maxStudents);
    if (isNaN(maxStudentsNum) || maxStudentsNum <= 0) {
      console.error('Invalid maxStudents:', maxStudents);
      return NextResponse.json(
        { success: false, error: 'Invalid maxStudents value' },
        { status: 400 }
      );
    }
    console.log('maxStudents validation passed');

    // Create batch using Prisma ORM directly
    console.log('Attempting to create batch in database using Prisma...');
    try {
      // Check if batch name already exists
      const existingBatch = await prisma.batches.findFirst({
        where: { name: code.trim() },
      });

      if (existingBatch) {
        return NextResponse.json(
          { success: false, error: 'Batch name already exists' },
          { status: 400 }
        );
      }

      // Create the batch using Prisma's create method
      const newBatch = await prisma.batches.create({
        data: {
          name: name.trim(),
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
            },
          },
        },
      });

      console.log('Successfully created batch:', newBatch);
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
          details:
            error instanceof Error ? error.stack : 'Unknown error occurred',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in batch creation:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to create batch',
        details:
          error instanceof Error ? error.stack : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
