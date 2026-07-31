import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { authorize, canAccessProgram, forbiddenResponse } from '@/lib/authz';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const auth = await authorize(request, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;

    // Handle both sync and async params (Next.js 15+ compatibility)
    const resolvedParams = params instanceof Promise ? await params : params;
    
    if (!resolvedParams?.id) {
      return NextResponse.json(
        { success: false, error: 'Program ID is required' },
        { status: 400 }
      );
    }

    const programId = parseInt(resolvedParams.id);
    if (isNaN(programId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid program ID' },
        { status: 400 }
      );
    }

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

    // Get batches for the program
    const batches = await prisma.batches.findMany({
      where: {
        programId,
        status: 'active',
      },
      select: {
        id: true,
        name: true,
        code: true,
        programId: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: batches,
    });
  } catch (error) {
    console.error('Error fetching program batches:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch batches' },
      { status: 500 }
    );
  }
}
