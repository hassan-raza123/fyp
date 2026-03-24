import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getFacultyIdFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest, { params: _params }: { params: Promise<{ id: string }> }) {
  const { success, error } = await requireAuth(request);
  const params = await _params;
  if (!success) return NextResponse.json({ error }, { status: 401 });

  const plan = await prisma.action_plans.findUnique({
    where: { id: parseInt(params.id) },
    include: {
      plo: { select: { code: true, description: true } },
      clo: { select: { code: true, description: true } },
      llo: { select: { code: true, description: true } },
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

export async function PUT(request: NextRequest, { params: _params }: { params: Promise<{ id: string }> }) {
  const { success, user, error } = await requireAuth(request);
  const params = await _params;
  if (!success) return NextResponse.json({ error }, { status: 401 });

  if (user?.role !== 'admin' && user?.role !== 'faculty') {
    return NextResponse.json({ error: 'Admins and faculty only' }, { status: 403 });
  }

  const body = await request.json();
  const {
    rootCause,
    actionTaken,
    expectedOutcome,
    targetDate,
    status,
    actualOutcome,
    implementedAt,
    followUpAttainmentValue,
    isLoopClosed,
    nextReviewDate,
  } = body;

  // Faculty can only update CQI loop-closure fields on plans for their courses.
  // Admin can update everything.
  if (user?.role === 'faculty') {
    const facultyId = await getFacultyIdFromRequest(request);
    if (!facultyId) {
      return NextResponse.json({ error: 'Faculty record not found' }, { status: 403 });
    }

    // Verify the plan belongs to one of the faculty's course offerings
    const plan = await prisma.action_plans.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        courseOffering: {
          include: { sections: { select: { facultyId: true } } },
        },
      },
    });

    if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const isFacultyInOffering = plan.courseOffering.sections.some(
      (s) => s.facultyId === facultyId
    );
    if (!isFacultyInOffering) {
      return NextResponse.json(
        { error: 'You can only update action plans for your own courses' },
        { status: 403 }
      );
    }

    // Faculty may only update CQI loop-closure fields
    const updatedPlan = await prisma.action_plans.update({
      where: { id: parseInt(params.id) },
      data: {
        ...(actualOutcome !== undefined && { actualOutcome }),
        ...(implementedAt !== undefined && {
          implementedAt: implementedAt ? new Date(implementedAt) : null,
        }),
        ...(followUpAttainmentValue !== undefined && {
          followUpAttainmentValue:
            followUpAttainmentValue !== null ? parseFloat(followUpAttainmentValue) : null,
        }),
        ...(isLoopClosed !== undefined && { isLoopClosed }),
        ...(nextReviewDate !== undefined && {
          nextReviewDate: nextReviewDate ? new Date(nextReviewDate) : null,
        }),
        // Faculty can also move status to in_progress or completed
        ...(status !== undefined &&
          ['in_progress', 'completed'].includes(status) && { status }),
      },
    });

    return NextResponse.json({ success: true, data: updatedPlan });
  }

  // Admin: full update
  const plan = await prisma.action_plans.update({
    where: { id: parseInt(params.id) },
    data: {
      ...(rootCause !== undefined && { rootCause }),
      ...(actionTaken !== undefined && { actionTaken }),
      ...(expectedOutcome !== undefined && { expectedOutcome }),
      ...(targetDate !== undefined && { targetDate: targetDate ? new Date(targetDate) : null }),
      ...(status !== undefined && { status }),
      // CQI loop closure
      ...(actualOutcome !== undefined && { actualOutcome }),
      ...(implementedAt !== undefined && {
        implementedAt: implementedAt ? new Date(implementedAt) : null,
      }),
      ...(followUpAttainmentValue !== undefined && {
        followUpAttainmentValue:
          followUpAttainmentValue !== null ? parseFloat(followUpAttainmentValue) : null,
      }),
      ...(isLoopClosed !== undefined && { isLoopClosed }),
      ...(nextReviewDate !== undefined && {
        nextReviewDate: nextReviewDate ? new Date(nextReviewDate) : null,
      }),
    },
  });

  return NextResponse.json({ success: true, data: plan });
}
