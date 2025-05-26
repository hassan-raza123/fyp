import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/api-utils';

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
        { code: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Execute the query
    const batches = await prisma.$queryRaw`
      SELECT b.*, 
        p.name as program_name, 
        p.code as program_code,
        (SELECT COUNT(*) FROM students WHERE batchId = b.id) as student_count
      FROM batches b
      LEFT JOIN programs p ON b.programId = p.id
      ORDER BY b.createdAt DESC
    `;

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
    const program = await prisma.program.findUnique({
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

    // Check if code is unique
    console.log('Checking if batch code is unique...');
    const existingBatch = await prisma.$queryRaw`
      SELECT * FROM batches WHERE code = ${code.trim()}
    `;

    if (Array.isArray(existingBatch) && existingBatch.length > 0) {
      console.error('Batch code already exists:', code);
      return NextResponse.json(
        { success: false, error: 'Batch code already exists' },
        { status: 400 }
      );
    }
    console.log('Batch code is unique');

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
      // Use a direct database query to bypass Prisma client validation
      await prisma.$transaction(async (tx) => {
        // First check if batch with this code already exists
        const existingRecord = await tx.$queryRaw`
          SELECT COUNT(*) as count FROM batches WHERE code = ${code.trim()}
        `;

        const count = (existingRecord as any)[0]?.count || 0;

        if (count > 0) {
          throw new Error('Batch code already exists');
        }

        // Insert the batch
        await tx.$executeRaw`
          INSERT INTO batches (
            id, name, code, startDate, endDate, maxStudents, 
            description, status, programId, createdAt, updatedAt
          ) VALUES (
            UUID(), ${name.trim()}, ${code.trim()}, ${start}, ${end}, ${maxStudentsNum},
            ${description ? description.trim() : null}, ${
          status || 'upcoming'
        }, ${parseInt(programId)},
            NOW(), NOW()
          )
        `;
      });

      // Query the newly created batch
      const createdBatches: any = await prisma.$queryRaw`
        SELECT * FROM batches WHERE code = ${code.trim()} ORDER BY createdAt DESC LIMIT 1
      `;

      const createdBatch =
        Array.isArray(createdBatches) && createdBatches.length > 0
          ? createdBatches[0]
          : null;

      console.log('Successfully created batch:', createdBatch);
      return NextResponse.json({
        success: true,
        message: 'Batch created successfully',
        data: createdBatch,
      });
    } catch (dbError) {
      console.error('Database error while creating batch:', dbError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create batch in database',
          details:
            dbError instanceof Error
              ? dbError.message
              : 'Unknown database error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in batch creation:', error);
    // Return more specific error message
    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to create batch: ${error.message}`,
          details: error.stack,
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create batch',
        details: 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
