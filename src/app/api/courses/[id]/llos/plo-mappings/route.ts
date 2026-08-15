import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize, canAccessCourse, forbiddenResponse } from '@/lib/authz';

/**
 * GET /api/courses/[id]/llos/plo-mappings
 *
 * The LLO half of `../clos/plo-mappings`.
 *
 * This route did not exist. `faculty/results/llo-attainments` has been calling
 * it since the page was written, and its `catch` only logs to the console — so
 * the "LLO-PLO Mappings" panel rendered "No LLO-PLO mappings found" forever,
 * whatever the mappings actually were, and nothing said why.
 *
 * The response shape is the one that page renders: one row per LLO, each with
 * the PLOs it maps to and the weight of each.
 */
export async function GET(
  request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params;
  try {
    const auth = await authorize(request, [
      'super_admin',
      'admin',
      'faculty',
      'student',
    ]);
    if (!auth.ok) return auth.response;

    const courseId = parseInt(params.id, 10);
    if (Number.isNaN(courseId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid course ID' },
        { status: 400 }
      );
    }

    // Staff by department, a student by enrolment — the same rule the CLO
    // equivalent uses.
    if (!(await canAccessCourse(request, auth.user, courseId))) {
      return forbiddenResponse();
    }

    const llos = await prisma.llos.findMany({
      where: { courseId, status: 'active' },
      select: { id: true, code: true, description: true },
      orderBy: { code: 'asc' },
    });

    if (llos.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const mappings = await prisma.lloplomappings.findMany({
      where: { lloId: { in: llos.map((l) => l.id) } },
      include: {
        plo: {
          select: {
            id: true,
            code: true,
            description: true,
            program: { select: { id: true, name: true, code: true } },
          },
        },
      },
      orderBy: { weight: 'desc' },
    });

    const byLlo = new Map<number, typeof mappings>();
    for (const llo of llos) byLlo.set(llo.id, []);
    for (const mapping of mappings) {
      byLlo.get(mapping.lloId)?.push(mapping);
    }

    const data = llos.map((llo) => ({
      llo,
      plos: (byLlo.get(llo.id) ?? []).map((mapping) => ({
        ploId: mapping.ploId,
        ploCode: mapping.plo.code,
        ploDescription: mapping.plo.description,
        programName: mapping.plo.program.name,
        programCode: mapping.plo.program.code,
        // Weights are stored as a 0..1 share; the panel shows them as a
        // percentage and sums them, so convert here rather than in the view.
        weight: Math.round(mapping.weight * 100),
      })),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching LLO-PLO mappings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch LLO-PLO mappings' },
      { status: 500 }
    );
  }
}
