import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit-log';
import { authorize, canAccessProgram, forbiddenResponse } from '@/lib/authz';

/**
 * A curriculum row says which courses a degree requires and in which semester.
 * Both handlers resolve ownership through the owning programme — the listing
 * side already did, and a write that skipped it let a department admin
 * restructure another department's degree.
 */
async function resolveEntry(
  request: NextRequest,
  auth: Extract<Awaited<ReturnType<typeof authorize>>, { ok: true }>,
  entryId: number
): Promise<
  | { ok: true; entry: { programId: number; courseId: number; semesterSlot: number; isRequired: boolean } }
  | { ok: false; response: NextResponse }
> {
  const entry = await prisma.program_curriculum.findUnique({
    where: { id: entryId },
    select: {
      programId: true,
      courseId: true,
      semesterSlot: true,
      isRequired: true,
    },
  });
  if (!entry) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Curriculum entry not found' },
        { status: 404 }
      ),
    };
  }
  if (!(await canAccessProgram(request, auth.user, entry.programId))) {
    return { ok: false, response: forbiddenResponse() };
  }
  return { ok: true, entry };
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(request, ['super_admin', 'admin']);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const resolved = await resolveEntry(request, auth, parseInt(id));
  if (!resolved.ok) return resolved.response;

  const body = await request.json();
  const { semesterSlot, courseCategory, isRequired } = body;

  const entry = await prisma.program_curriculum.update({
    where: { id: parseInt(id) },
    data: {
      ...(semesterSlot !== undefined && { semesterSlot: parseInt(semesterSlot) }),
      ...(courseCategory !== undefined && { courseCategory }),
      ...(isRequired !== undefined && { isRequired }),
    },
    include: {
      course: { select: { id: true, code: true, name: true, creditHours: true, type: true } },
    },
  });

  // Which courses a degree requires, and in which semester, is part of the
  // programme specification an accreditation body reviews.
  await writeAuditLog(request, auth.user, 'curriculum.update', {
    entryId: parseInt(id),
    programId: resolved.entry.programId,
    courseId: resolved.entry.courseId,
    before: {
      semesterSlot: resolved.entry.semesterSlot,
      isRequired: resolved.entry.isRequired,
    },
    after: { semesterSlot: entry.semesterSlot, isRequired: entry.isRequired },
  });

  return NextResponse.json({ success: true, data: entry });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(request, ['super_admin', 'admin']);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const resolved = await resolveEntry(request, auth, parseInt(id));
  if (!resolved.ok) return resolved.response;

  await prisma.program_curriculum.delete({ where: { id: parseInt(id) } });

  await writeAuditLog(request, auth.user, 'curriculum.remove', {
    entryId: parseInt(id),
    programId: resolved.entry.programId,
    courseId: resolved.entry.courseId,
    semesterSlot: resolved.entry.semesterSlot,
    isRequired: resolved.entry.isRequired,
  });

  return NextResponse.json({ success: true, message: 'Removed from curriculum' });
}
