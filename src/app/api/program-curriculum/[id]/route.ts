import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { success, user, error } = await requireAuth(request);
  if (!success) return NextResponse.json({ error }, { status: 401 });
  if (user?.role !== 'admin') {
    return NextResponse.json({ error: 'Admins only' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { semesterSlot, courseCategory, isRequired } = body;

  const entry = await prisma.program_curriculum.update({
    where: { id: parseInt(id) },
    data: {
      ...(semesterSlot !== undefined && { semesterSlot: parseInt(semesterSlot) }),
      ...(courseCategory !== undefined && { courseCategory }),
      ...(isRequired !== undefined && { isRequired }),
    },
    include: {
      course: { select: { id: true, code: true, name: true, creditHours: true, type: true } },
    },
  });

  return NextResponse.json({ success: true, data: entry });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { success, user, error } = await requireAuth(request);
  if (!success) return NextResponse.json({ error }, { status: 401 });
  if (user?.role !== 'admin') {
    return NextResponse.json({ error: 'Admins only' }, { status: 403 });
  }

  const { id } = await params;

  await prisma.program_curriculum.delete({ where: { id: parseInt(id) } });

  return NextResponse.json({ success: true, message: 'Removed from curriculum' });
}
