import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { success, error } = await requireAuth(request);
  if (!success) return NextResponse.json({ error }, { status: 401 });

  const criterion = await prisma.passfailcriteria.findUnique({
    where: { id: parseInt(params.id) },
    include: {
      courseofferings: {
        include: {
          course: { select: { code: true, name: true } },
          semester: { select: { name: true } },
        },
      },
    },
  });

  if (!criterion) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true, data: criterion });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { success, user, error } = await requireAuth(request);
  if (!success) return NextResponse.json({ error }, { status: 401 });
  if (user?.role !== 'admin') {
    return NextResponse.json({ error: 'Admins only' }, { status: 403 });
  }

  const body = await request.json();
  const { minPassPercent, status } = body;

  const criterion = await prisma.passfailcriteria.update({
    where: { id: parseInt(params.id) },
    data: {
      ...(minPassPercent !== undefined && { minPassPercent: parseFloat(minPassPercent) }),
      ...(status !== undefined && { status }),
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true, data: criterion });
}
