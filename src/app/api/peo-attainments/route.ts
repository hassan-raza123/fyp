import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getDepartmentIdFromRequest } from '@/lib/auth';

/**
 * GET /api/peo-attainments?programId=&semesterId=
 *
 * Derives PEO attainment from PLO attainments.
 * For each PEO:
 *   1. Find all PLOs mapped to it via peoplomappings
 *   2. Look up ploattainments for the given programId + semesterId
 *   3. Average the attainmentPercent of mapped PLOs
 *
 * Requires PLO attainments to be calculated first (POST /api/plo-attainments).
 */
export async function GET(request: NextRequest) {
  try {
    const { success, user, error } = await requireAuth(request);
    if (!success) return NextResponse.json({ success: false, error }, { status: 401 });

    // Only admin, faculty, and super_admin can access PEO attainments
    if (!user || !['admin', 'faculty', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId');
    const semesterId = searchParams.get('semesterId');

    if (!programId) {
      return NextResponse.json({ success: false, error: 'programId is required' }, { status: 400 });
    }

    const pid = parseInt(programId);
    const sid = semesterId ? parseInt(semesterId) : null;

    // For admin: validate programId belongs to their department
    if (user.role === 'admin') {
      const departmentId = await getDepartmentIdFromRequest(request);
      if (!departmentId) {
        return NextResponse.json({ success: false, error: 'Department not found for your account' }, { status: 400 });
      }
      const program = await prisma.programs.findUnique({ where: { id: pid }, select: { departmentId: true } });
      if (!program || program.departmentId !== departmentId) {
        return NextResponse.json({ success: false, error: 'Program does not belong to your department' }, { status: 403 });
      }
    }

    // Fetch all PEOs for the program with their PLO mappings
    const peos = await prisma.peos.findMany({
      where: { programId: pid, status: { not: 'archived' } },
      include: {
        ploMappings: {
          include: {
            plo: {
              select: { id: true, code: true, description: true },
            },
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    if (peos.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        meta: { message: 'No PEOs found for this program' },
      });
    }

    // Fetch graduation criteria threshold for this program
    const gradCriteria = await prisma.graduation_criteria.findUnique({
      where: { programId: pid },
      select: { minPloAttainmentPercent: true },
    });
    const threshold = gradCriteria?.minPloAttainmentPercent ?? 50;

    // Fetch PLO attainments for this program + semester
    const ploAttainmentsWhere: Record<string, unknown> = { programId: pid };
    if (sid) ploAttainmentsWhere.semesterId = sid;

    const ploAttainments = await prisma.ploattainments.findMany({
      where: ploAttainmentsWhere,
      orderBy: sid ? undefined : [{ semesterId: 'desc' }, { calculatedAt: 'desc' }],
    });

    // Build a map: ploId → attainmentPercent (use latest if multiple semesters)
    const ploAttainmentMap = new Map<number, number>();
    for (const pa of ploAttainments) {
      if (!ploAttainmentMap.has(pa.ploId)) {
        ploAttainmentMap.set(pa.ploId, pa.attainmentPercent);
      }
    }

    const hasPloData = ploAttainmentMap.size > 0;

    // Calculate PEO attainments
    const result = peos.map((peo) => {
      const mappedPLOs = peo.ploMappings.map((m) => ({
        ploId: m.ploId,
        ploCode: m.plo.code,
        ploDescription: m.plo.description,
        attainmentPercent: ploAttainmentMap.get(m.ploId) ?? null,
      }));

      const withData = mappedPLOs.filter((p) => p.attainmentPercent !== null);
      let avgAttainment: number | null = null;
      if (withData.length > 0) {
        avgAttainment =
          withData.reduce((sum, p) => sum + (p.attainmentPercent as number), 0) / withData.length;
        avgAttainment = Math.round(avgAttainment * 100) / 100;
      }

      return {
        peoId: peo.id,
        code: peo.code,
        description: peo.description,
        status: peo.status,
        mappedPLOs,
        avgAttainment,
        threshold,
        isAchieved: avgAttainment !== null ? avgAttainment >= threshold : null,
        plosWithData: withData.length,
        totalMappedPLOs: mappedPLOs.length,
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        programId: pid,
        semesterId: sid,
        threshold,
        hasPloData,
        message: !hasPloData
          ? 'No PLO attainment data found. Please calculate PLO attainments first.'
          : undefined,
      },
    });
  } catch (err) {
    console.error('[GET_PEO_ATTAINMENTS]', err);
    return NextResponse.json({ success: false, error: 'Failed to calculate PEO attainments' }, { status: 500 });
  }
}
