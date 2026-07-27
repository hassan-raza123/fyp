import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  authorize,
  canManageCourseOffering,
  assertResultsUnlocked,
  forbidden,
} from '@/lib/authz';
import { writeAuditLog } from '@/lib/audit-log';

export async function PATCH(
  request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params;
  try {
    // Staff only — this changes a student's result status/remarks.
    const auth = await authorize(request, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;

    const resultId = parseInt(params.id);
    if (isNaN(resultId)) {
      return NextResponse.json({ error: 'Invalid result ID' }, { status: 400 });
    }

    const body = await request.json();
    const { status, remarks } = body;

    if (!status && !remarks) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }

    const existing = await prisma.studentassessmentresults.findUnique({
      where: { id: resultId },
      include: {
        assessment: { select: { courseOfferingId: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }

    const offeringId = existing.assessment.courseOfferingId;

    if (!(await canManageCourseOffering(request, auth.user, offeringId))) {
      return forbidden('You do not have access to this course offering')
        .response;
    }

    const locked = await assertResultsUnlocked(auth.user, offeringId);
    if (locked) return locked;

    const updatedResult = await prisma.studentassessmentresults.update({
      where: { id: resultId },
      data: {
        ...(status && { status }),
        ...(remarks && { remarks }),
      },
    });

    await writeAuditLog(request, auth.user, 'marks.update', {
      resultId,
      studentId: existing.studentId,
      assessmentId: existing.assessmentId,
      courseOfferingId: offeringId,
      before: { status: existing.status, remarks: existing.remarks },
      after: { status: status ?? existing.status, remarks: remarks ?? existing.remarks },
    });

    return NextResponse.json(updatedResult);
  } catch (error) {
    console.error('Error updating assessment result:', error);
    return NextResponse.json(
      { error: 'Failed to update assessment result' },
      { status: 500 }
    );
  }
}
