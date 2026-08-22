import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize, canManageCourseOffering } from '@/lib/authz';
import { getStorage, validateUpload } from '@/lib/storage';
import { writeAuditLog } from '@/lib/audit-log';

/**
 * Evidence files attached to an assessment: the question paper, and samples of
 * marked student work. A PEC course file is expected to carry these, and the
 * product previously had no way to store a file at all.
 */

const VALID_KINDS = new Set([
  'question_paper',
  'marked_script',
  'rubric_document',
  'supporting_document',
]);

async function resolveOffering(assessmentId: number) {
  const a = await prisma.assessments.findUnique({
    where: { id: assessmentId },
    select: { id: true, courseOfferingId: true },
  });
  return a;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const assessmentId = Number(id);
    if (!Number.isInteger(assessmentId)) {
      return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
    }

    const auth = await authorize(request, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;

    const assessment = await resolveOffering(assessmentId);
    if (!assessment) {
      return NextResponse.json({ success: false, error: 'Assessment not found' }, { status: 404 });
    }
    if (!(await canManageCourseOffering(request, auth.user, assessment.courseOfferingId))) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const files = await prisma.attachments.findMany({
      where: { assessmentId },
      select: {
        id: true, originalName: true, mimeType: true, sizeBytes: true,
        kind: true, label: true, createdAt: true,
        uploader: { select: { first_name: true, last_name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: files });
  } catch (error) {
    console.error('Failed to list attachments:', error);
    return NextResponse.json({ success: false, error: 'Failed to list attachments' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const assessmentId = Number(id);
    if (!Number.isInteger(assessmentId)) {
      return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
    }

    const auth = await authorize(request, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;

    const assessment = await resolveOffering(assessmentId);
    if (!assessment) {
      return NextResponse.json({ success: false, error: 'Assessment not found' }, { status: 404 });
    }
    if (!(await canManageCourseOffering(request, auth.user, assessment.courseOfferingId))) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const form = await request.formData();
    const file = form.get('file');
    const kind = String(form.get('kind') ?? '');
    const label = form.get('label') ? String(form.get('label')) : null;

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'No file supplied' }, { status: 400 });
    }
    if (!VALID_KINDS.has(kind)) {
      return NextResponse.json(
        { success: false, error: `kind must be one of: ${[...VALID_KINDS].join(', ')}` },
        { status: 400 }
      );
    }

    // Validate before reading the whole thing into memory where we can.
    const invalid = validateUpload(file.type, file.size);
    if (invalid) {
      return NextResponse.json({ success: false, error: invalid }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    // Re-check post-read: `file.size` is client-reported and the body may
    // disagree with it.
    const invalidAfterRead = validateUpload(file.type, bytes.byteLength);
    if (invalidAfterRead) {
      return NextResponse.json({ success: false, error: invalidAfterRead }, { status: 400 });
    }

    const stored = await getStorage().putFile(bytes, {
      originalName: file.name,
      mimeType: file.type,
    });

    const record = await prisma.attachments.create({
      data: {
        storageKey: stored.key,
        originalName: stored.originalName,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
        kind: kind as 'question_paper',
        label,
        uploadedBy: auth.user.userId,
        assessmentId,
      },
      select: { id: true, originalName: true, kind: true, sizeBytes: true, createdAt: true },
    });

    await writeAuditLog(request, auth.user, 'attachment.upload', {
      attachmentId: record.id,
      assessmentId,
      kind,
      originalName: record.originalName,
      sizeBytes: record.sizeBytes,
    });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    console.error('Failed to upload attachment:', error);
    return NextResponse.json({ success: false, error: 'Failed to upload attachment' }, { status: 500 });
  }
}
