import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; cloId: string }> }
) {
  const { id, cloId: cloIdParam } = await params;
  const courseId = Number(id);
  const cloId = Number(cloIdParam);
  if (isNaN(courseId) || isNaN(cloId))
    return NextResponse.json(
      { success: false, error: 'Invalid id' },
      { status: 400 }
    );

  const { code, description, bloomLevel, status } = await req.json();

  const clo = await prisma.clos.update({
    where: { id: cloId, courseId },
    data: { code, description, bloomLevel, status },
  });

  return NextResponse.json({ success: true, data: clo });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; cloId: string }> }
) {
  const { id, cloId: cloIdParam } = await params;
  const courseId = Number(id);
  const cloId = Number(cloIdParam);
  if (isNaN(courseId) || isNaN(cloId))
    return NextResponse.json(
      { success: false, error: 'Invalid id' },
      { status: 400 }
    );

  await prisma.clos.delete({ where: { id: cloId, courseId } });

  return NextResponse.json({ success: true });
}
