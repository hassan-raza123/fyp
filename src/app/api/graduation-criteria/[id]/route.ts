import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit-log';
import { authorize, canAccessProgram, forbiddenResponse } from '@/lib/authz';

/**
 * GET /api/graduation-criteria/[id]
 */
export async function GET(request: NextRequest, { params: _params }: { params: Promise<{ id: string }> }) {
  const params = await _params;
  try {
    const auth = await authorize(request, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;

    const criteria = await prisma.graduation_criteria.findUnique({
      where: { id: parseInt(params.id) },
      include: { program: { select: { id: true, name: true, code: true } } },
    });

    if (!criteria) {
      return NextResponse.json({ success: false, error: 'Criteria not found' }, { status: 404 });
    }

    // Resolved through the programme this criteria set belongs to.
    if (!(await canAccessProgram(request, auth.user, criteria.programId))) {
      return forbiddenResponse();
    }

    return NextResponse.json({ success: true, data: criteria });
  } catch (err) {
    console.error('[GET_GRADUATION_CRITERIA_ID]', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch criteria' }, { status: 500 });
  }
}

/**
 * PUT /api/graduation-criteria/[id]
 * Updates any subset of graduation criteria fields.
 * Admin-only.
 */
export async function PUT(request: NextRequest, { params: _params }: { params: Promise<{ id: string }> }) {
  const params = await _params;
  try {
    const auth = await authorize(request, ['super_admin', 'admin']);
    if (!auth.ok) return auth.response;

    // The GET above resolves ownership through the programme and the write
    // path must match it. These are the thresholds that decide who graduates.
    const existing = await prisma.graduation_criteria.findUnique({
      where: { id: parseInt(params.id) },
      select: {
        programId: true,
        minCGPA: true,
        minPloAttainmentPercent: true,
        requireAllCourses: true,
        directWeight: true,
        indirectWeight: true,
      },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Criteria not found' },
        { status: 404 }
      );
    }
    if (!(await canAccessProgram(request, auth.user, existing.programId))) {
      return forbiddenResponse();
    }

    const body = await request.json();
    const {
      minCGPA,
      minPloAttainmentPercent,
      requireAllCourses,
      directWeight,
      indirectWeight,
    } = body;

    // Validate weights if both provided
    if (directWeight !== undefined && indirectWeight !== undefined) {
      const dw = parseFloat(directWeight);
      const iw = parseFloat(indirectWeight);
      if (Math.abs(dw + iw - 1.0) > 0.001) {
        return NextResponse.json(
          { success: false, error: 'directWeight + indirectWeight must equal 1.0' },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (minCGPA !== undefined) updateData.minCGPA = parseFloat(minCGPA);
    if (minPloAttainmentPercent !== undefined) updateData.minPloAttainmentPercent = parseFloat(minPloAttainmentPercent);
    if (requireAllCourses !== undefined) updateData.requireAllCourses = Boolean(requireAllCourses);
    if (directWeight !== undefined) updateData.directWeight = parseFloat(directWeight);
    if (indirectWeight !== undefined) updateData.indirectWeight = parseFloat(indirectWeight);

    const criteria = await prisma.graduation_criteria.update({
      where: { id: parseInt(params.id) },
      data: updateData,
      include: { program: { select: { id: true, name: true, code: true } } },
    });

    // These are the thresholds that decide who receives a degree. The
    // before/after pair is the point: an accreditation review asks what the
    // bar was at the time a cohort graduated, not only what it is now.
    await writeAuditLog(request, auth.user, 'graduation_criteria.update', {
      criteriaId: parseInt(params.id),
      programId: existing.programId,
      before: {
        minCGPA: existing.minCGPA,
        minPloAttainmentPercent: existing.minPloAttainmentPercent,
        requireAllCourses: existing.requireAllCourses,
        directWeight: existing.directWeight,
        indirectWeight: existing.indirectWeight,
      },
      after: {
        minCGPA: criteria.minCGPA,
        minPloAttainmentPercent: criteria.minPloAttainmentPercent,
        requireAllCourses: criteria.requireAllCourses,
        directWeight: criteria.directWeight,
        indirectWeight: criteria.indirectWeight,
      },
    });

    return NextResponse.json({ success: true, data: criteria });
  } catch (err: any) {
    if (err?.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Criteria not found' }, { status: 404 });
    }
    console.error('[PUT_GRADUATION_CRITERIA_ID]', err);
    return NextResponse.json({ success: false, error: 'Failed to update criteria' }, { status: 500 });
  }
}
