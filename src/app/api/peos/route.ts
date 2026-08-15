import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  authorize,
  canAccessProgram,
  forbiddenResponse,
  programScopeFilter,
} from '@/lib/authz';

// GET /api/peos?programId=1
export async function GET(request: NextRequest) {
  try {
    const auth = await authorize(request, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const programIdParam = searchParams.get('programId');
    const programId = programIdParam ? Number(programIdParam) : null;

    if (programId !== null && Number.isNaN(programId)) {
      return NextResponse.json({ error: 'Invalid programId' }, { status: 400 });
    }

    const scope = await programScopeFilter(request, auth.user, programId);
    if ('error' in scope) return scope.error;

    const peos = await prisma.peos.findMany({
      where: {
        ...scope.where,
        status: { not: 'archived' },
      },
      include: {
        program: { select: { id: true, name: true, code: true } },
        ploMappings: {
          include: {
            plo: { select: { id: true, code: true, description: true } },
          },
        },
      },
      orderBy: [{ programId: 'asc' }, { code: 'asc' }],
    });

    return NextResponse.json(peos);
  } catch (error) {
    console.error('Error fetching PEOs:', error);
    return NextResponse.json({ error: 'Failed to fetch PEOs' }, { status: 500 });
  }
}

// POST /api/peos
export async function POST(request: NextRequest) {
  try {
    const auth = await authorize(request, ['super_admin', 'admin']);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const { code, description, programId, status } = body;

    if (!code || !description || !programId) {
      return NextResponse.json(
        { error: 'code, description, and programId are required' },
        { status: 400 }
      );
    }

    // The programme comes from the request body, so it has to be checked —
    // otherwise a department admin can plant PEOs in another department's
    // programme, which feeds straight into its accreditation figures.
    if (!(await canAccessProgram(request, auth.user, Number(programId)))) {
      return forbiddenResponse();
    }

    const peo = await prisma.peos.create({
      data: {
        code: code.trim().toUpperCase(),
        description: description.trim(),
        programId: Number(programId),
        status: status ?? 'active',
      },
      include: {
        program: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json(peo, { status: 201 });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'A PEO with this code already exists for the program' },
        { status: 409 }
      );
    }
    console.error('Error creating PEO:', error);
    return NextResponse.json({ error: 'Failed to create PEO' }, { status: 500 });
  }
}
