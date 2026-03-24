import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/ploattainments/trends?programId=X
 *
 * Returns PLO attainment history across all semesters for a given program.
 * Shape: {
 *   plos: { id, code, description }[],
 *   semesters: string[],        // ordered semester names
 *   series: {                   // one entry per PLO
 *     ploId: number,
 *     ploCode: string,
 *     data: { semester: string, attainmentPercent: number | null }[]
 *   }[]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { success, error } = await requireAuth(request);
    if (!success) {
      return NextResponse.json({ success: false, error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId');

    if (!programId) {
      return NextResponse.json(
        { success: false, error: 'programId query parameter is required.' },
        { status: 400 }
      );
    }

    // Fetch all PLO attainments for this program, including PLO and semester info
    const attainments = await prisma.ploattainments.findMany({
      where: {
        programId: parseInt(programId),
        status: 'active',
      },
      include: {
        plo: { select: { id: true, code: true, description: true } },
        semester: { select: { id: true, name: true, startDate: true } },
      },
      orderBy: { semester: { startDate: 'asc' } },
    });

    if (attainments.length === 0) {
      return NextResponse.json({
        success: true,
        data: { plos: [], semesters: [], series: [] },
      });
    }

    // Collect unique semesters (sorted by startDate via the query order)
    const semesterMap = new Map<string, string>(); // name → name (deduped, preserving order)
    for (const a of attainments) {
      if (!semesterMap.has(a.semester.name)) {
        semesterMap.set(a.semester.name, a.semester.name);
      }
    }
    const semesters = Array.from(semesterMap.keys());

    // Collect unique PLOs
    const ploMap = new Map<number, { id: number; code: string; description: string }>();
    for (const a of attainments) {
      if (!ploMap.has(a.plo.id)) {
        ploMap.set(a.plo.id, a.plo);
      }
    }

    // Build attainment lookup: ploId → semesterName → percent
    const lookup = new Map<number, Map<string, number>>();
    for (const a of attainments) {
      if (!lookup.has(a.ploId)) {
        lookup.set(a.ploId, new Map());
      }
      lookup.get(a.ploId)!.set(a.semester.name, a.attainmentPercent);
    }

    // Build series
    const series = Array.from(ploMap.values()).map((plo) => ({
      ploId: plo.id,
      ploCode: plo.code,
      description: plo.description,
      data: semesters.map((sem) => ({
        semester: sem,
        attainmentPercent: lookup.get(plo.id)?.get(sem) ?? null,
      })),
    }));

    return NextResponse.json({
      success: true,
      data: {
        plos: Array.from(ploMap.values()),
        semesters,
        series,
      },
    });
  } catch (error) {
    console.error('[PLO_TRENDS]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch PLO trend data.' },
      { status: 500 }
    );
  }
}
