import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; ploId: string } }
) {
  const auth = requireAuth(req);
  if (!auth.success) {
    return NextResponse.json(
      { success: false, error: auth.error },
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
  const plo = await prisma.plos.findFirst({
    where: { id: ploId, programId },
  });
  if (!plo) {
    return NextResponse.json(
      { success: false, error: 'PLO not found' },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true, data: plo });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; ploId: string } }
) {
  const auth = requireAuth(req);
  if (!auth.success) {
    return NextResponse.json(
      { success: false, error: auth.error },
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
  const body = await req.json();
  const { code, description, bloomLevel, status } = body;
  if (!code || !description) {
    return NextResponse.json(
      { success: false, error: 'Code and description are required' },
      { status: 400 }
    );
  }
  // Check for duplicate code in the same program (excluding current PLO)
  const existing = await prisma.plos.findFirst({
    where: { code, programId, id: { not: ploId } },
  });
  if (existing) {
    return NextResponse.json(
      { success: false, error: 'PLO code already exists for this program' },
      { status: 409 }
    );
  }
  const updated = await prisma.plos.update({
    where: { id: ploId },
    data: { code, description, bloomLevel, status },
  });
  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; ploId: string } }
) {
  const auth = requireAuth(req);
  if (!auth.success) {
    return NextResponse.json(
      { success: false, error: auth.error },
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
  // Check for dependencies (e.g., CLO mappings or attainments)
  const dependencies = await prisma.cloplomappings.findFirst({
    where: { ploId },
  });
  if (dependencies) {
    return NextResponse.json(
      {
        success: false,
        error: 'Cannot delete: PLO is mapped to one or more CLOs.',
      },
      { status: 409 }
    );
  }
  await prisma.plos.delete({ where: { id: ploId } });
  return NextResponse.json({
    success: true,
    message: 'PLO deleted successfully',
  });
}
