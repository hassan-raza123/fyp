import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit-log';
import { authorize, canManageCourseOffering, forbiddenResponse } from '@/lib/authz';

// GET /api/rubrics/[id]
export async function GET(request: NextRequest, { params: _params }: { params: Promise<{ id: string }> }) {
  const params = await _params;
  try {
    const auth = await authorize(request, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;

    const rubric = await prisma.rubrics.findUnique({
      where: { id: Number(params.id) },
      include: {
        clo: { select: { id: true, code: true, description: true } },
        llo: { select: { id: true, code: true, description: true } },
        criteria: { orderBy: { id: 'asc' } },
      },
    });

    if (!rubric) {
      return NextResponse.json({ error: 'Rubric not found' }, { status: 404 });
    }

    // Resolved through the offering the rubric marks against.
    if (
      rubric.courseOfferingId !== null &&
      !(await canManageCourseOffering(request, auth.user, rubric.courseOfferingId))
    ) {
      return forbiddenResponse();
    }

    return NextResponse.json(rubric);
  } catch (error) {
    console.error('Error fetching rubric:', error);
    return NextResponse.json({ error: 'Failed to fetch rubric' }, { status: 500 });
  }
}

// PUT /api/rubrics/[id]
export async function PUT(request: NextRequest, { params: _params }: { params: Promise<{ id: string }> }) {
  const params = await _params;
  try {
    const auth = await authorize(request, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;

    // The GET above resolves ownership through the rubric's course offering.
    // A rubric decides how marks are awarded, so the write path needs it too.
    const existing = await prisma.rubrics.findUnique({
      where: { id: Number(params.id) },
      select: { courseOfferingId: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Rubric not found' }, { status: 404 });
    }
    if (
      !(await canManageCourseOffering(request, auth.user, existing.courseOfferingId))
    ) {
      return forbiddenResponse();
    }

    const body = await request.json();
    const { title, criteria } = body;

    const rubric = await prisma.rubrics.update({
      where: { id: Number(params.id) },
      data: {
        ...(title ? { title: title.trim() } : {}),
        ...(criteria
          ? {
              criteria: {
                deleteMany: {},
                create: criteria.map(
                  (c: {
                    description: string;
                    excellent: string;
                    good: string;
                    satisfactory: string;
                    unsatisfactory: string;
                    weight?: number;
                  }) => ({
                    description: c.description,
                    excellent: c.excellent,
                    good: c.good,
                    satisfactory: c.satisfactory,
                    unsatisfactory: c.unsatisfactory,
                    weight: c.weight ?? 1,
                  })
                ),
              },
            }
          : {}),
      },
      include: {
        clo: { select: { id: true, code: true } },
        llo: { select: { id: true, code: true } },
        criteria: true,
      },
    });

    // `criteria` is replaced wholesale (deleteMany + create), so an edit can
    // silently change what every existing score on this rubric meant.
    await writeAuditLog(request, auth.user, 'rubric.update', {
      rubricId: Number(params.id),
      courseOfferingId: existing.courseOfferingId,
      titleChanged: title !== undefined,
      criteriaReplaced: criteria !== undefined,
      criteriaCount: rubric.criteria.length,
    });

    return NextResponse.json(rubric);
  } catch (error) {
    console.error('Error updating rubric:', error);
    return NextResponse.json({ error: 'Failed to update rubric' }, { status: 500 });
  }
}

// DELETE /api/rubrics/[id]
export async function DELETE(request: NextRequest, { params: _params }: { params: Promise<{ id: string }> }) {
  const params = await _params;
  try {
    const auth = await authorize(request, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;

    const existing = await prisma.rubrics.findUnique({
      where: { id: Number(params.id) },
      select: { courseOfferingId: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Rubric not found' }, { status: 404 });
    }
    if (
      !(await canManageCourseOffering(request, auth.user, existing.courseOfferingId))
    ) {
      return forbiddenResponse();
    }

    await prisma.rubrics.delete({ where: { id: Number(params.id) } });

    await writeAuditLog(request, auth.user, 'rubric.delete', {
      rubricId: Number(params.id),
      courseOfferingId: existing.courseOfferingId,
    });

    return NextResponse.json({ success: true, message: 'Rubric deleted' });
  } catch (error) {
    console.error('Error deleting rubric:', error);
    return NextResponse.json({ error: 'Failed to delete rubric' }, { status: 500 });
  }
}
