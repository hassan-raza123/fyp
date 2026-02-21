import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { success, error } = await requireAuth(request);
  if (!success) return NextResponse.json({ error }, { status: 401 });

  const plan = await prisma.action_plans.findUnique({
    where: { id: parseInt(params.id) },
    include: {
      plo: { select: { code: true, description: true } },
      semester: { select: { name: true } },
      courseOffering: {
        include: { course: { select: { code: true, name: true } } },
      },
      creator: { select: { first_name: true, last_name: true } },
    },
  });

  if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true, data: plan });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { success, user, error } = await requireAuth(request);
  if (!success) return NextResponse.json({ error }, { status: 401 });
  if (user?.role !== 'admin') {
    return NextResponse.json({ error: 'Admins only' }, { status: 403 });
  }

  const body = await request.json();
  const { rootCause, actionTaken, expectedOutcome, targetDate, status } = body;

  const plan = await prisma.action_plans.update({
    where: { id: parseInt(params.id) },
    data: {
      ...(rootCause !== undefined && { rootCause }),
      ...(actionTaken !== undefined && { actionTaken }),
      ...(expectedOutcome !== undefined && { expectedOutcome }),
      ...(targetDate !== undefined && { targetDate: targetDate ? new Date(targetDate) : null }),
      ...(status !== undefined && { status }),
    },
  });

  return NextResponse.json({ success: true, data: plan });
}
