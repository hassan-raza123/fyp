import { NextRequest, NextResponse } from 'next/server';
import { authorize, canManageCourseOffering } from '@/lib/authz';
import { buildCourseFile } from '@/lib/course-file';

/**
 * GET /api/course-offerings/[id]/course-file
 *
 * Assembles the PEC course file for one offering — the per-course evidence
 * package a Programme Evaluator actually asks for, as opposed to the
 * programme-level reports the system already produced.
 *
 * Read-only, and scoped exactly like every other view of an offering: faculty
 * get the offerings they teach, department admins their own department, super
 * admins everything.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const courseOfferingId = Number(id);

    if (!Number.isInteger(courseOfferingId) || courseOfferingId <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid course offering id' },
        { status: 400 }
      );
    }

    const auth = await authorize(request, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;

    const allowed = await canManageCourseOffering(
      request,
      auth.user,
      courseOfferingId
    );
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'You do not have access to this course offering' },
        { status: 403 }
      );
    }

    const payload = await buildCourseFile(courseOfferingId);
    return NextResponse.json({ success: true, data: payload });
  } catch (error) {
    console.error('Failed to build course file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to build course file' },
      { status: 500 }
    );
  }
}
