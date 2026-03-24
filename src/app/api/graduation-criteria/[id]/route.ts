import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/graduation-criteria/[id]
 */
export async function GET(request: NextRequest, { params: _params }: { params: Promise<{ id: string }> }) {
  const params = await _params;
  try {
    const { success, user, error } = await requireAuth(request);
    if (!success) return NextResponse.json({ success: false, error }, { status: 401 });

    const criteria = await prisma.graduation_criteria.findUnique({
      where: { id: parseInt(params.id) },
      include: { program: { select: { id: true, name: true, code: true } } },
    });

    if (!criteria) {
      return NextResponse.json({ success: false, error: 'Criteria not found' }, { status: 404 });
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
    const { success, user, error } = await requireAuth(request);
    if (!success) return NextResponse.json({ success: false, error }, { status: 401 });
    if (user?.role !== 'admin' && user?.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Admins only' }, { status: 403 });
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

    return NextResponse.json({ success: true, data: criteria });
  } catch (err: any) {
    if (err?.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Criteria not found' }, { status: 404 });
    }
    console.error('[PUT_GRADUATION_CRITERIA_ID]', err);
    return NextResponse.json({ success: false, error: 'Failed to update criteria' }, { status: 500 });
  }
}
