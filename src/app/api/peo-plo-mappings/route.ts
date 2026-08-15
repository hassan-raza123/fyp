import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  authorize,
  canAccessProgram,
  forbiddenResponse,
  programScopeFilter,
} from '@/lib/authz';

// GET /api/peo-plo-mappings?peoId=1  OR  ?programId=1
export async function GET(request: NextRequest) {
  try {
    const auth = await authorize(request, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const peoId = searchParams.get('peoId');
    const programIdParam = searchParams.get('programId');
    const programId = programIdParam ? Number(programIdParam) : null;

    if (programId !== null && Number.isNaN(programId)) {
      return NextResponse.json({ error: 'Invalid programId' }, { status: 400 });
    }

    // Resolved through the PEO's programme: with a programme named, check it;
    // without one, scope the listing to the caller's department.
    const scope = await programScopeFilter(request, auth.user, programId, 'peo');
    if ('error' in scope) return scope.error;

    const mappings = await prisma.peoplomappings.findMany({
      where: {
        ...(peoId ? { peoId: Number(peoId) } : {}),
        ...scope.where,
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
    const auth = await authorize(request, ['super_admin', 'admin']);
    if (!auth.ok) return auth.response;

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

    // Both ids arrive in the body. Same-programme is not the same question as
    // "your programme" — without this, a foreign admin can wire up mappings in
    // a programme they have no claim to.
    if (!(await canAccessProgram(request, auth.user, peo.programId))) {
      return forbiddenResponse();
    }

    const mapping = await prisma.peoplomappings.create({
      data: { peoId: Number(peoId), ploId: Number(ploId) },
      include: {
        peo: { select: { id: true, code: true, description: true } },
        plo: { select: { id: true, code: true, description: true } },
      },
    });

    // A mapping carries the weight the PEO attainment rollup divides by.
    await writeAuditLog(request, auth.user, 'peo_plo_mapping.create', {
      mappingId: mapping.id,
      peoId: Number(peoId),
      ploId: Number(ploId),
      programId: peo.programId,
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
