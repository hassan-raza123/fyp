import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { success, error } = await requireAuth(request);
  if (!success) return NextResponse.json({ error }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const courseOfferingId = searchParams.get('courseOfferingId');

  const criteria = await prisma.passfailcriteria.findMany({
    where: courseOfferingId ? { courseOfferingId: parseInt(courseOfferingId) } : {},
    include: {
      courseofferings: {
        include: {
          course: { select: { id: true, code: true, name: true } },
          semester: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ success: true, data: criteria });
}

export async function POST(request: NextRequest) {
  const { success, user, error } = await requireAuth(request);
  if (!success) return NextResponse.json({ error }, { status: 401 });
  if (user?.role !== 'admin') {
    return NextResponse.json({ error: 'Admins only' }, { status: 403 });
  }

  const body = await request.json();
  const { courseOfferingId, minPassPercent, minCloAttainmentPercent } = body;

  if (!courseOfferingId) {
    return NextResponse.json({ error: 'courseOfferingId is required' }, { status: 400 });
  }

  const existing = await prisma.passfailcriteria.findUnique({
    where: { courseOfferingId: parseInt(courseOfferingId) },
  });
  if (existing) {
    return NextResponse.json(
      { error: 'Criteria already exists for this offering. Use Edit to update.' },
      { status: 409 }
    );
  }

  const criterion = await prisma.passfailcriteria.create({
    data: {
      courseOfferingId: parseInt(courseOfferingId),
      minPassPercent: parseFloat(minPassPercent ?? '50'),
      minCloAttainmentPercent: minCloAttainmentPercent != null ? parseFloat(minCloAttainmentPercent) : null,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true, data: criterion }, { status: 201 });
}
