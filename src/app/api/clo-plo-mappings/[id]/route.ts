import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize, canManageCourse, forbidden } from '@/lib/authz';
import { writeAuditLog } from '@/lib/audit-log';
import type { UpdateCLOPLOMappingDTO } from '@/types/clo-plo-mapping';

export async function PUT(
  request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params;
  try {
    const auth = await authorize(request, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;

    const id = Number(params.id);
    if (Number.isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid mapping ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { weight } = body as UpdateCLOPLOMappingDTO;

    if (weight === undefined) {
      return NextResponse.json(
        { success: false, error: 'Weight is required' },
        { status: 400 }
      );
    }

    if (weight < 0 || weight > 1) {
      return NextResponse.json(
        { success: false, error: 'Weight must be between 0 and 1' },
        { status: 400 }
      );
    }

    const existing = await prisma.cloplomappings.findUnique({
      where: { id },
      include: { clo: { select: { courseId: true, code: true } } },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Mapping not found' },
        { status: 404 }
      );
    }

    if (!(await canManageCourse(request, auth.user, existing.clo.courseId))) {
      return forbidden('You do not have access to this course').response;
    }

    const mapping = await prisma.cloplomappings.update({
      where: { id },
      data: { weight },
      include: {
        clo: true,
        plo: true,
      },
    });

    await writeAuditLog(request, auth.user, 'clo_plo_mapping.update', {
      mappingId: id,
      cloId: existing.cloId,
      ploId: existing.ploId,
      courseId: existing.clo.courseId,
      previousWeight: existing.weight,
      newWeight: weight,
    });

    return NextResponse.json({ success: true, data: mapping });
  } catch (error) {
    console.error('Error updating CLO-PLO mapping:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params;
  try {
    const auth = await authorize(request, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;

    const id = Number(params.id);
    if (Number.isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid mapping ID' },
        { status: 400 }
      );
    }

    const existing = await prisma.cloplomappings.findUnique({
      where: { id },
      include: { clo: { select: { courseId: true, code: true } } },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Mapping not found' },
        { status: 404 }
      );
    }

    if (!(await canManageCourse(request, auth.user, existing.clo.courseId))) {
      return forbidden('You do not have access to this course').response;
    }

    await prisma.cloplomappings.delete({ where: { id } });

    await writeAuditLog(request, auth.user, 'clo_plo_mapping.delete', {
      mappingId: id,
      cloId: existing.cloId,
      ploId: existing.ploId,
      courseId: existing.clo.courseId,
      weight: existing.weight,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting CLO-PLO mapping:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
