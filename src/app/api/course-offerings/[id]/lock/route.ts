import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit-log';
import { authorize, canManageCourseOffering, forbiddenResponse } from '@/lib/authz';

/**
 * PATCH /api/course-offerings/[id]/lock
 * Toggles the results lock on a course offering.
 * Only admins (department admin or super admin) can call this.
 */
export async function PATCH(
  request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params;
  try {
    const auth = await authorize(request, ['super_admin', 'admin']);
    if (!auth.ok) return auth.response;
    const user = auth.user;

    const courseOfferingId = parseInt(params.id);
    if (isNaN(courseOfferingId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid course offering ID.' },
        { status: 400 }
      );
    }

    // The GET below scopes with `canManageCourseOffering`. Locking decides
    // whether faculty can still enter marks, so the write needs it too.
    if (!(await canManageCourseOffering(request, user, courseOfferingId))) {
      return forbiddenResponse();
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

    await writeAuditLog(
      request,
      user,
      nowLocked ? 'offering.lock' : 'offering.unlock',
      { courseOfferingId, lockedAt: updated.lockedAt }
    );

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
  const params = await _params;
  try {
    const auth = await authorize(request, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;

    const courseOfferingId = parseInt(params.id);
    if (isNaN(courseOfferingId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid course offering ID.' },
        { status: 400 }
      );
    }

    if (!(await canManageCourseOffering(request, auth.user, courseOfferingId))) {
      return forbiddenResponse();
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
