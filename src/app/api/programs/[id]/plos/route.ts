import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';
import { plo_status } from '@prisma/client';

// GET /api/programs/[id]/plos
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

    const programId = parseInt(params.id);
    if (isNaN(programId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid program ID' },
        { status: 400 }
      );
    }

    // Check if program exists
    const program = await prisma.programs.findUnique({
      where: { id: programId },
    });

    if (!program) {
      return NextResponse.json(
        { success: false, error: 'Program not found' },
        { status: 404 }
      );
    }

    // Get PLOs for the program
    const plos = await prisma.plos.findMany({
      where: {
        programId,
      },
      orderBy: {
        code: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: plos,
    });
  } catch (error) {
    console.error('Error fetching PLOs:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch PLOs',
      },
      { status: 500 }
    );
  }
}

// POST /api/programs/[id]/plos
export async function POST(
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

    const programId = parseInt(params.id);
    if (isNaN(programId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid program ID' },
        { status: 400 }
      );
    }

    // Check if program exists
    const program = await prisma.programs.findUnique({
      where: { id: programId },
    });

    if (!program) {
      return NextResponse.json(
        { success: false, error: 'Program not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { code, description, bloomLevel, status = 'active' } = body;

    // Validate required fields
    if (!code?.trim()) {
      return NextResponse.json(
        { success: false, error: 'PLO code is required' },
        { status: 400 }
      );
    }

    if (!description?.trim()) {
      return NextResponse.json(
        { success: false, error: 'PLO description is required' },
        { status: 400 }
      );
    }

    // Check if PLO code already exists for this program
    const existingPLO = await prisma.plos.findFirst({
      where: {
        programId,
        code,
      },
    });

    if (existingPLO) {
      return NextResponse.json(
        { success: false, error: 'PLO code already exists for this program' },
        { status: 400 }
      );
    }

    // Create PLO
    const plo = await prisma.plos.create({
      data: {
        code,
        description,
        bloomLevel,
        status: status as plo_status,
        programId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'PLO created successfully',
      data: plo,
    });
  } catch (error) {
    console.error('Error creating PLO:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create PLO',
      },
      { status: 500 }
    );
  }
}

// PUT /api/programs/[id]/plos/[ploId]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; ploId: string } }
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

    const programId = parseInt(params.id);
    const ploId = parseInt(params.ploId);

    if (isNaN(programId) || isNaN(ploId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid program or PLO ID' },
        { status: 400 }
      );
    }

    // Check if PLO exists
    const existingPLO = await prisma.plos.findFirst({
      where: {
        id: ploId,
        programId,
      },
    });

    if (!existingPLO) {
      return NextResponse.json(
        { success: false, error: 'PLO not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { code, description, bloomLevel, status } = body;

    // Check if new code already exists for this program
    if (code && code !== existingPLO.code) {
      const codeExists = await prisma.plos.findFirst({
        where: {
          programId,
          code,
          id: { not: ploId },
        },
      });

      if (codeExists) {
        return NextResponse.json(
          { success: false, error: 'PLO code already exists for this program' },
          { status: 400 }
        );
      }
    }

    // Update PLO
    const plo = await prisma.plos.update({
      where: { id: ploId },
      data: {
        code,
        description,
        bloomLevel,
        status: status as plo_status,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'PLO updated successfully',
      data: plo,
    });
  } catch (error) {
    console.error('Error updating PLO:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update PLO',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/programs/[id]/plos/[ploId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; ploId: string } }
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

    const programId = parseInt(params.id);
    const ploId = parseInt(params.ploId);

    if (isNaN(programId) || isNaN(ploId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid program or PLO ID' },
        { status: 400 }
      );
    }

    // Check if PLO exists
    const existingPLO = await prisma.plos.findFirst({
      where: {
        id: ploId,
        programId,
      },
      include: {
        _count: {
          select: {
            cloMappings: true,
            ploAttainments: true,
          },
        },
      },
    });

    if (!existingPLO) {
      return NextResponse.json(
        { success: false, error: 'PLO not found' },
        { status: 404 }
      );
    }

    // Check for dependencies
    if (
      existingPLO._count.cloMappings > 0 ||
      existingPLO._count.ploAttainments > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete PLO with existing CLO mappings or attainments',
          details: {
            cloMappings: existingPLO._count.cloMappings,
            ploAttainments: existingPLO._count.ploAttainments,
          },
        },
        { status: 400 }
      );
    }

    // Delete PLO
    await prisma.plos.delete({
      where: { id: ploId },
    });

    return NextResponse.json({
      success: true,
      message: 'PLO deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting PLO:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete PLO',
      },
      { status: 500 }
    );
  }
}
