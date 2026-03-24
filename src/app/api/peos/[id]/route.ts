import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET /api/peos/[id]
export async function GET(request: NextRequest, { params: _params }: { params: Promise<{ id: string }> }) {
  const params = await _params;
  try {
    const auth = await requireAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    const auth = await requireAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!['admin', 'super_admin'].includes(auth.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
    const auth = await requireAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!['admin', 'super_admin'].includes(auth.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.peos.update({
      where: { id: Number(params.id) },
      data: { status: 'archived' },
    });

    return NextResponse.json({ success: true, message: 'PEO archived successfully' });
  } catch (error) {
    console.error('Error archiving PEO:', error);
    return NextResponse.json({ error: 'Failed to archive PEO' }, { status: 500 });
  }
}
