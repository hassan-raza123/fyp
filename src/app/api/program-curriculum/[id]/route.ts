import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize, canAccessProgram, forbiddenResponse } from '@/lib/authz';

/**
 * A curriculum row says which courses a degree requires and in which semester.
 * Both handlers resolve ownership through the owning programme — the listing
 * side already did, and a write that skipped it let a department admin
 * restructure another department's degree.
 */
async function assertOwnsEntry(
  request: NextRequest,
  auth: Extract<Awaited<ReturnType<typeof authorize>>, { ok: true }>,
  entryId: number
): Promise<NextResponse | null> {
  const entry = await prisma.program_curriculum.findUnique({
    where: { id: entryId },
    select: { programId: true },
  });
  if (!entry) {
    return NextResponse.json(
      { error: 'Curriculum entry not found' },
      { status: 404 }
    );
  }
  if (!(await canAccessProgram(request, auth.user, entry.programId))) {
    return forbiddenResponse();
  }
  return null;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(request, ['super_admin', 'admin']);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const denied = await assertOwnsEntry(request, auth, parseInt(id));
  if (denied) return denied;

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

  return NextResponse.json({ success: true, data: entry });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(request, ['super_admin', 'admin']);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const denied = await assertOwnsEntry(request, auth, parseInt(id));
  if (denied) return denied;

  await prisma.program_curriculum.delete({ where: { id: parseInt(id) } });

  return NextResponse.json({ success: true, message: 'Removed from curriculum' });
}
