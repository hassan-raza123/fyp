import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  authorize,
  canManageCourseOffering,
  assertResultsUnlocked,
  forbidden,
} from '@/lib/authz';
import { writeAuditLog } from '@/lib/audit-log';

/**
 * Load the assessment item together with the course offering it belongs to, so
 * authorization and the results lock can both be checked before mutating it.
 */
async function loadItem(itemId: number) {
  return prisma.assessmentitems.findUnique({
    where: { id: itemId },
    include: {
      assessment: { select: { id: true, courseOfferingId: true } },
    },
  });
}

export async function PUT(
  req: NextRequest,
  { params: _params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const params = await _params;
  try {
    const auth = await authorize(req, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;

    const data = await req.json();
    const { questionNo, description, marks, cloId, lloId, rubricId } = data;

    const itemId = parseInt(params.itemId);
    if (isNaN(itemId)) {
      return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 });
    }

    const existing = await loadItem(itemId);
    if (!existing) {
      return NextResponse.json(
        { error: 'Assessment item not found' },
        { status: 404 }
      );
    }

    const offeringId = existing.assessment.courseOfferingId;

    if (!(await canManageCourseOffering(req, auth.user, offeringId))) {
      return forbidden('You do not have access to this course offering')
        .response;
    }

    // Changing an item's marks or CLO mapping rewrites attainment inputs, so it
    // is blocked once results are locked.
    const locked = await assertResultsUnlocked(auth.user, offeringId);
    if (locked) return locked;

    // Validate CLO/LLO mapping: must have one or the other, never both, never neither
    const hasClo = cloId !== undefined && cloId !== null && cloId !== '';
    const hasLlo = lloId !== undefined && lloId !== null && lloId !== '';

    if (!hasClo && !hasLlo) {
      return NextResponse.json(
        { error: 'Assessment item must be mapped to either a CLO (theory) or an LLO (lab)' },
        { status: 400 }
      );
    }

    if (hasClo && hasLlo) {
      return NextResponse.json(
        { error: 'Assessment item can only be mapped to one outcome: either a CLO or an LLO, not both' },
        { status: 400 }
      );
    }

    const updatedItem = await prisma.assessmentitems.update({
      where: { id: itemId },
      data: {
        questionNo,
        description,
        marks,
        // Set the active mapping and explicitly clear the other
        cloId: hasClo ? Number(cloId) : null,
        lloId: hasLlo ? Number(lloId) : null,
        // undefined leaves the existing rubric untouched; null detaches it
        ...(rubricId === undefined
          ? {}
          : { rubricId: rubricId === null ? null : Number(rubricId) }),
      },
      include: {
        clo: true,
        llo: true,
      },
    });

    await writeAuditLog(req, auth.user, 'assessment_item.update', {
      itemId,
      assessmentId: existing.assessment.id,
      courseOfferingId: offeringId,
      before: {
        questionNo: existing.questionNo,
        marks: existing.marks,
        cloId: existing.cloId,
        lloId: existing.lloId,
      },
      after: {
        questionNo,
        marks,
        cloId: hasClo ? Number(cloId) : null,
        lloId: hasLlo ? Number(lloId) : null,
      },
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error updating assessment item:', error);
    return NextResponse.json(
      { error: 'Failed to update assessment item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params: _params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const params = await _params;
  try {
    const auth = await authorize(req, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;

    const itemId = parseInt(params.itemId);
    if (isNaN(itemId)) {
      return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 });
    }

    const existing = await loadItem(itemId);
    if (!existing) {
      return NextResponse.json(
        { error: 'Assessment item not found' },
        { status: 404 }
      );
    }

    const offeringId = existing.assessment.courseOfferingId;

    if (!(await canManageCourseOffering(req, auth.user, offeringId))) {
      return forbidden('You do not have access to this course offering')
        .response;
    }

    const locked = await assertResultsUnlocked(auth.user, offeringId);
    if (locked) return locked;

    await prisma.assessmentitems.delete({
      where: { id: itemId },
    });

    await writeAuditLog(req, auth.user, 'assessment_item.delete', {
      itemId,
      assessmentId: existing.assessment.id,
      courseOfferingId: offeringId,
      questionNo: existing.questionNo,
      marks: existing.marks,
      cloId: existing.cloId,
      lloId: existing.lloId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting assessment item:', error);
    return NextResponse.json(
      { error: 'Failed to delete assessment item' },
      { status: 500 }
    );
  }
}
