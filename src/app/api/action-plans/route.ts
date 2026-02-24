import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getFacultyIdFromRequest } from '@/lib/auth';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  const { success, user, error } = await requireAuth(request);
  if (!success) return NextResponse.json({ error }, { status: 401 });

  // Admin sees all plans; faculty sees only plans for their course offerings
  if (user?.role !== 'admin' && user?.role !== 'faculty') {
    return NextResponse.json({ error: 'Admins and faculty only' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const semesterId = searchParams.get('semesterId');
  const ploId = searchParams.get('ploId');
  const status = searchParams.get('status');
  const programId = searchParams.get('programId');

  const where: Prisma.action_plansWhereInput = {};
  if (semesterId) where.semesterId = parseInt(semesterId);
  if (ploId) where.ploId = parseInt(ploId);
  if (status) where.status = status as Prisma.EnumAction_plan_statusFilter['equals'];
  if (programId) where.plo = { programId: parseInt(programId) };

  // Faculty: restrict to course offerings where they teach a section
  if (user?.role === 'faculty') {
    const facultyId = await getFacultyIdFromRequest(request);
    if (!facultyId) {
      return NextResponse.json({ error: 'Faculty record not found' }, { status: 403 });
    }
    where.courseOffering = {
      sections: { some: { facultyId } },
    };
  }

  const plans = await prisma.action_plans.findMany({
    where,
    include: {
      plo: { select: { id: true, code: true, description: true } },
      clo: { select: { id: true, code: true, description: true } },
      llo: { select: { id: true, code: true, description: true } },
      semester: { select: { id: true, name: true } },
      courseOffering: {
        include: {
          course: { select: { id: true, code: true, name: true } },
        },
      },
      creator: { select: { first_name: true, last_name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ success: true, data: plans });
}

export async function POST(request: NextRequest) {
  const { success, user, error } = await requireAuth(request);
  if (!success) return NextResponse.json({ error }, { status: 401 });
  if (user?.role !== 'admin') {
    return NextResponse.json({ error: 'Admins only' }, { status: 403 });
  }

  const body = await request.json();
  const {
    courseOfferingId,
    ploId,
    cloId,
    lloId,
    semesterId,
    attainmentValue,
    threshold,
    rootCause,
    actionTaken,
    expectedOutcome,
    targetDate,
  } = body;

  if (!courseOfferingId || !ploId || !semesterId || attainmentValue === undefined) {
    return NextResponse.json(
      { error: 'courseOfferingId, ploId, semesterId, and attainmentValue are required' },
      { status: 400 }
    );
  }

  const plan = await prisma.action_plans.create({
    data: {
      courseOfferingId: parseInt(courseOfferingId),
      ploId: parseInt(ploId),
      cloId: cloId ? parseInt(cloId) : null,
      lloId: lloId ? parseInt(lloId) : null,
      semesterId: parseInt(semesterId),
      attainmentValue: parseFloat(attainmentValue),
      threshold: parseFloat(threshold ?? '50'),
      rootCause: rootCause ?? null,
      actionTaken: actionTaken ?? null,
      expectedOutcome: expectedOutcome ?? null,
      targetDate: targetDate ? new Date(targetDate) : null,
      status: 'pending',
      createdBy: user!.userId,
    },
    include: {
      plo: { select: { code: true, description: true } },
      clo: { select: { code: true, description: true } },
      llo: { select: { code: true, description: true } },
      semester: { select: { name: true } },
      courseOffering: { include: { course: { select: { code: true, name: true } } } },
    },
  });

  return NextResponse.json({ success: true, data: plan }, { status: 201 });
}
