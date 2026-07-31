import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { authorize, canAccessProgram, forbiddenResponse } from '@/lib/authz';
import { plo_status } from '@prisma/client';

// GET /api/programs/[id]/plos
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // PLOs are program-level configuration: admins only.
    const auth = await authorize(request, ['super_admin', 'admin']);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const programId = parseInt(id);
    if (isNaN(programId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid program ID' },
        { status: 400 }
      );
    }

    // The admin role alone is not enough — a department admin runs one
    // department, and this programme may belong to another.
    if (!(await canAccessProgram(request, auth.user, programId))) {
      return forbiddenResponse();
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
        error: 'Failed to fetch PLOs',
      },
      { status: 500 }
    );
  }
}

// POST /api/programs/[id]/plos
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorize(request, ['super_admin', 'admin']);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const programId = parseInt(id);
    if (isNaN(programId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid program ID' },
        { status: 400 }
      );
    }

    // A PLO belongs to a programme, and a programme belongs to a department.
    if (!(await canAccessProgram(request, auth.user, programId))) {
      return forbiddenResponse();
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
        error: 'Failed to create PLO',
      },
      { status: 500 }
    );
  }
}
