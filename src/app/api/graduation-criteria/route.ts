import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/graduation-criteria
 * Returns all programs with their graduation criteria (null if not configured yet).
 * Admin-only.
 */
export async function GET(request: NextRequest) {
  try {
    const { success, user, error } = await requireAuth(request);
    if (!success) return NextResponse.json({ success: false, error }, { status: 401 });
    if (user?.role !== 'admin' && user?.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Admins only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId');

    const programs = await prisma.programs.findMany({
      where: programId ? { id: parseInt(programId) } : {},
      include: {
        graduation_criteria: true,
      },
      orderBy: { name: 'asc' },
    });

    const result = programs.map((program) => ({
      programId: program.id,
      programName: program.name,
      programCode: program.code,
      criteria: program.graduation_criteria ?? null,
    }));

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error('[GET_GRADUATION_CRITERIA]', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch graduation criteria' }, { status: 500 });
  }
}

/**
 * POST /api/graduation-criteria
 * Creates graduation criteria for a program. Returns 409 if already exists.
 * Admin-only.
 */
export async function POST(request: NextRequest) {
  try {
    const { success, user, error } = await requireAuth(request);
    if (!success) return NextResponse.json({ success: false, error }, { status: 401 });
    if (user?.role !== 'admin' && user?.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Admins only' }, { status: 403 });
    }

    const body = await request.json();
    const {
      programId,
      minCGPA,
      minPloAttainmentPercent,
      requireAllCourses,
      directWeight,
      indirectWeight,
    } = body;

    if (!programId) {
      return NextResponse.json({ success: false, error: 'programId is required' }, { status: 400 });
    }

    const dWeight = directWeight !== undefined ? parseFloat(directWeight) : 0.7;
    const iWeight = indirectWeight !== undefined ? parseFloat(indirectWeight) : 0.3;

    if (Math.abs(dWeight + iWeight - 1.0) > 0.001) {
      return NextResponse.json(
        { success: false, error: 'directWeight + indirectWeight must equal 1.0' },
        { status: 400 }
      );
    }

    // Check for existing criteria
    const existing = await prisma.graduation_criteria.findUnique({
      where: { programId: parseInt(programId) },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Graduation criteria already exist for this program. Use PUT to update.' },
        { status: 409 }
      );
    }

    const criteria = await prisma.graduation_criteria.create({
      data: {
        programId: parseInt(programId),
        minCGPA: minCGPA !== undefined ? parseFloat(minCGPA) : 2.0,
        minPloAttainmentPercent: minPloAttainmentPercent !== undefined ? parseFloat(minPloAttainmentPercent) : 50.0,
        requireAllCourses: requireAllCourses !== undefined ? Boolean(requireAllCourses) : true,
        directWeight: dWeight,
        indirectWeight: iWeight,
      },
      include: { program: { select: { id: true, name: true, code: true } } },
    });

    return NextResponse.json({ success: true, data: criteria }, { status: 201 });
  } catch (err) {
    console.error('[POST_GRADUATION_CRITERIA]', err);
    return NextResponse.json({ success: false, error: 'Failed to create graduation criteria' }, { status: 500 });
  }
}
