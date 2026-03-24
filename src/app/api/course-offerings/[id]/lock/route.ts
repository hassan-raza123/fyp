import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

/**
 * PATCH /api/course-offerings/[id]/lock
 * Toggles the results lock on a course offering.
 * Only admins (department admin or super admin) can call this.
 */
export async function PATCH(
  request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  try {
    const { success, user, error } = await requireAuth(request);
    if (!success) {
      return NextResponse.json({ success: false, error }, { status: 401 });
    }

    if (user?.role !== 'admin' && user?.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Only admins can lock or unlock results.' },
        { status: 403 }
      );
    }

    const courseOfferingId = parseInt(params.id);
    if (isNaN(courseOfferingId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid course offering ID.' },
        { status: 400 }
      );
    }

    const offering = await prisma.courseofferings.findUnique({
      where: { id: courseOfferingId },
      select: { id: true, isResultsLocked: true },
    });

    if (!offering) {
      return NextResponse.json(
        { success: false, error: 'Course offering not found.' },
        { status: 404 }
      );
    }

    const nowLocked = !offering.isResultsLocked;

    const updated = await prisma.courseofferings.update({
      where: { id: courseOfferingId },
      data: {
        isResultsLocked: nowLocked,
        lockedAt: nowLocked ? new Date() : null,
        lockedBy: nowLocked ? user.userId : null,
      },
      select: {
        id: true,
        isResultsLocked: true,
        lockedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: nowLocked
        ? 'Results locked. No further marks can be entered.'
        : 'Results unlocked. Marks entry is now open.',
      data: updated,
    });
  } catch (error) {
    console.error('[LOCK_RESULTS]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to toggle results lock.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/course-offerings/[id]/lock
 * Returns the current lock status for a course offering.
 */
export async function GET(
  request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  try {
    const { success, error } = await requireAuth(request);
    if (!success) {
      return NextResponse.json({ success: false, error }, { status: 401 });
    }

    const courseOfferingId = parseInt(params.id);
    if (isNaN(courseOfferingId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid course offering ID.' },
        { status: 400 }
      );
    }

    const offering = await prisma.courseofferings.findUnique({
      where: { id: courseOfferingId },
      select: {
        id: true,
        isResultsLocked: true,
        lockedAt: true,
        lockedByUser: { select: { first_name: true, last_name: true } },
      },
    });

    if (!offering) {
      return NextResponse.json(
        { success: false, error: 'Course offering not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: offering });
  } catch (error) {
    console.error('[GET_LOCK_STATUS]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lock status.' },
      { status: 500 }
    );
  }
}
