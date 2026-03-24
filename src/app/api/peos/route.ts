import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET /api/peos?programId=1
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId');

    const peos = await prisma.peos.findMany({
      where: {
        ...(programId ? { programId: Number(programId) } : {}),
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
    const auth = await requireAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!['admin', 'super_admin'].includes(auth.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { code, description, programId, status } = body;

    if (!code || !description || !programId) {
      return NextResponse.json(
        { error: 'code, description, and programId are required' },
        { status: 400 }
      );
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
