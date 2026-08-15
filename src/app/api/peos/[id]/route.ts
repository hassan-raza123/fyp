import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize, canAccessProgram, forbiddenResponse } from '@/lib/authz';
import { writeAuditLog } from '@/lib/audit-log';

// GET /api/peos/[id]
export async function GET(request: NextRequest, { params: _params }: { params: Promise<{ id: string }> }) {
  const params = await _params;
  try {
    const auth = await authorize(request, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;

    const peo = await prisma.peos.findUnique({
      where: { id: Number(params.id) },
      include: {
        program: { select: { id: true, name: true, code: true } },
        ploMappings: {
          include: {
            plo: {
              select: { id: true, code: true, description: true, bloomLevel: true, bloomDomain: true },
            },
          },
        },
      },
    });

    if (!peo) {
      return NextResponse.json({ error: 'PEO not found' }, { status: 404 });
    }

    // Resolved through the programme the PEO belongs to.
    if (!(await canAccessProgram(request, auth.user, peo.programId))) {
      return forbiddenResponse();
    }

    return NextResponse.json(peo);
  } catch (error) {
    console.error('Error fetching PEO:', error);
    return NextResponse.json({ error: 'Failed to fetch PEO' }, { status: 500 });
  }
}

// PUT /api/peos/[id]
export async function PUT(request: NextRequest, { params: _params }: { params: Promise<{ id: string }> }) {
  const params = await _params;
  try {
    const auth = await authorize(request, ['super_admin', 'admin']);
    if (!auth.ok) return auth.response;

    // The GET above resolves ownership through the programme; the write path
    // has to do the same. Without it a department admin could rewrite the
    // programme educational objectives of any programme in the university.
    const existing = await prisma.peos.findUnique({
      where: { id: Number(params.id) },
      select: { programId: true, code: true, description: true, status: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'PEO not found' }, { status: 404 });
    }
    if (!(await canAccessProgram(request, auth.user, existing.programId))) {
      return forbiddenResponse();
    }

    const body = await request.json();
    const { code, description, status } = body;

    const peo = await prisma.peos.update({
      where: { id: Number(params.id) },
      data: {
        ...(code ? { code: code.trim().toUpperCase() } : {}),
        ...(description ? { description: description.trim() } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        program: { select: { id: true, name: true, code: true } },
      },
    });

    await writeAuditLog(request, auth.user, 'peo.update', {
      peoId: Number(params.id),
      programId: existing.programId,
      before: {
        code: existing.code,
        description: existing.description,
        status: existing.status,
      },
      after: { code: peo.code, description: peo.description, status: peo.status },
    });

    return NextResponse.json(peo);
  } catch (error) {
    console.error('Error updating PEO:', error);
    return NextResponse.json({ error: 'Failed to update PEO' }, { status: 500 });
  }
}

// DELETE /api/peos/[id]
export async function DELETE(request: NextRequest, { params: _params }: { params: Promise<{ id: string }> }) {
  const params = await _params;
  try {
    const auth = await authorize(request, ['super_admin', 'admin']);
    if (!auth.ok) return auth.response;

    const existing = await prisma.peos.findUnique({
      where: { id: Number(params.id) },
      select: { programId: true, code: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'PEO not found' }, { status: 404 });
    }
    if (!(await canAccessProgram(request, auth.user, existing.programId))) {
      return forbiddenResponse();
    }

    await prisma.peos.update({
      where: { id: Number(params.id) },
      data: { status: 'archived' },
    });

    await writeAuditLog(request, auth.user, 'peo.archive', {
      peoId: Number(params.id),
      programId: existing.programId,
      code: existing.code,
    });

    return NextResponse.json({ success: true, message: 'PEO archived successfully' });
  } catch (error) {
    console.error('Error archiving PEO:', error);
    return NextResponse.json({ error: 'Failed to archive PEO' }, { status: 500 });
  }
}
