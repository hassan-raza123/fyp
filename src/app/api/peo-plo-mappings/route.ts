import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET /api/peo-plo-mappings?peoId=1  OR  ?programId=1
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const peoId = searchParams.get('peoId');
    const programId = searchParams.get('programId');

    const mappings = await prisma.peoplomappings.findMany({
      where: {
        ...(peoId ? { peoId: Number(peoId) } : {}),
        ...(programId ? { peo: { programId: Number(programId) } } : {}),
      },
      include: {
        peo: { select: { id: true, code: true, description: true } },
        plo: { select: { id: true, code: true, description: true, bloomLevel: true, bloomDomain: true } },
      },
      orderBy: [{ peoId: 'asc' }, { ploId: 'asc' }],
    });

    return NextResponse.json(mappings);
  } catch (error) {
    console.error('Error fetching PEO-PLO mappings:', error);
    return NextResponse.json({ error: 'Failed to fetch mappings' }, { status: 500 });
  }
}

// POST /api/peo-plo-mappings  — body: { peoId, ploId }
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
    const { peoId, ploId } = body;

    if (!peoId || !ploId) {
      return NextResponse.json({ error: 'peoId and ploId are required' }, { status: 400 });
    }

    // Verify PLO belongs to the same program as PEO
    const peo = await prisma.peos.findUnique({ where: { id: Number(peoId) } });
    const plo = await prisma.plos.findUnique({ where: { id: Number(ploId) } });

    if (!peo || !plo) {
      return NextResponse.json({ error: 'PEO or PLO not found' }, { status: 404 });
    }
    if (peo.programId !== plo.programId) {
      return NextResponse.json(
        { error: 'PEO and PLO must belong to the same program' },
        { status: 400 }
      );
    }

    const mapping = await prisma.peoplomappings.create({
      data: { peoId: Number(peoId), ploId: Number(ploId) },
      include: {
        peo: { select: { id: true, code: true, description: true } },
        plo: { select: { id: true, code: true, description: true } },
      },
    });

    return NextResponse.json(mapping, { status: 201 });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json({ error: 'This PEO-PLO mapping already exists' }, { status: 409 });
    }
    console.error('Error creating PEO-PLO mapping:', error);
    return NextResponse.json({ error: 'Failed to create mapping' }, { status: 500 });
  }
}
