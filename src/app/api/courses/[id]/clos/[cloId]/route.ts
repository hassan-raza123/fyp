import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize, canManageCourse, forbidden } from '@/lib/authz';
import { writeAuditLog } from '@/lib/audit-log';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; cloId: string }> }
) {
  const auth = await authorize(req, ['super_admin', 'admin', 'faculty']);
  if (!auth.ok) return auth.response;

  const { id, cloId: cloIdParam } = await params;
  const courseId = Number(id);
  const cloId = Number(cloIdParam);
  if (isNaN(courseId) || isNaN(cloId))
    return NextResponse.json(
      { success: false, error: 'Invalid id' },
      { status: 400 }
    );

  if (!(await canManageCourse(req, auth.user, courseId))) {
    return forbidden('You do not have access to this course').response;
  }

  const existing = await prisma.clos.findFirst({
    where: { id: cloId, courseId },
  });
  if (!existing) {
    return NextResponse.json(
      { success: false, error: 'CLO not found for this course' },
      { status: 404 }
    );
  }

  const { code, description, bloomLevel, status } = await req.json();

  const clo = await prisma.clos.update({
    where: { id: cloId, courseId },
    data: { code, description, bloomLevel, status },
  });

  await writeAuditLog(req, auth.user, 'clo.update', {
    cloId,
    courseId,
    before: {
      code: existing.code,
      description: existing.description,
      bloomLevel: existing.bloomLevel,
      status: existing.status,
    },
    after: { code, description, bloomLevel, status },
  });

  return NextResponse.json({ success: true, data: clo });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; cloId: string }> }
) {
  const auth = await authorize(req, ['super_admin', 'admin', 'faculty']);
  if (!auth.ok) return auth.response;

  const { id, cloId: cloIdParam } = await params;
  const courseId = Number(id);
  const cloId = Number(cloIdParam);
  if (isNaN(courseId) || isNaN(cloId))
    return NextResponse.json(
      { success: false, error: 'Invalid id' },
      { status: 400 }
    );

  if (!(await canManageCourse(req, auth.user, courseId))) {
    return forbidden('You do not have access to this course').response;
  }

  const existing = await prisma.clos.findFirst({
    where: { id: cloId, courseId },
  });
  if (!existing) {
    return NextResponse.json(
      { success: false, error: 'CLO not found for this course' },
      { status: 404 }
    );
  }

  await prisma.clos.delete({ where: { id: cloId, courseId } });

  await writeAuditLog(req, auth.user, 'clo.delete', {
    cloId,
    courseId,
    code: existing.code,
    description: existing.description,
  });

  return NextResponse.json({ success: true });
}
