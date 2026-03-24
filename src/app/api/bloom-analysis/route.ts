import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getDepartmentIdFromRequest } from '@/lib/auth';

const BLOOM_ORDER = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'] as const;
const HOT_LEVELS = new Set(['Analyze', 'Evaluate', 'Create']); // Higher Order Thinking
const LOT_LEVELS = new Set(['Remember', 'Understand', 'Apply']); // Lower Order Thinking

type BloomLevel = (typeof BLOOM_ORDER)[number];

type BloomCount = Record<BloomLevel | 'unset', number>;

function emptyCount(): BloomCount {
  return {
    Remember: 0,
    Understand: 0,
    Apply: 0,
    Analyze: 0,
    Evaluate: 0,
    Create: 0,
    unset: 0,
  };
}

/**
 * GET /api/bloom-analysis?programId=
 *
 * Analyses Bloom's taxonomy level distribution for all CLOs and LLOs
 * across a program's curriculum. Returns:
 * - Summary counts per level
 * - HOT% (Higher Order Thinking: Analyze + Evaluate + Create)
 * - LOT% (Lower Order Thinking: Remember + Understand + Apply)
 * - Per-domain breakdown (Cognitive / Affective / Psychomotor)
 * - Per-course table
 * - HEC compliance recommendation (HOT >= 40% target)
 */
export async function GET(request: NextRequest) {
  try {
    const { success, user, error } = await requireAuth(request);
    if (!success) return NextResponse.json({ success: false, error }, { status: 401 });

    // Only admin, faculty, and super_admin can access bloom analysis
    if (!user || !['admin', 'faculty', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId');

    if (!programId) {
      return NextResponse.json({ success: false, error: 'programId is required' }, { status: 400 });
    }

    const pid = parseInt(programId);

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

    // Get all courses in the program via curriculum mapping
    const curriculum = await prisma.program_curriculum.findMany({
      where: { programId: pid },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
            clos: {
              where: { status: { not: 'archived' } },
              select: {
                id: true,
                code: true,
                description: true,
                bloomLevel: true,
                bloomDomain: true,
              },
            },
            llos: {
              where: { status: { not: 'archived' } },
              select: {
                id: true,
                code: true,
                description: true,
                bloomLevel: true,
                bloomDomain: true,
              },
            },
          },
        },
      },
      orderBy: [{ semesterSlot: 'asc' }, { courseId: 'asc' }],
    });

    if (curriculum.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          summary: emptyCount(),
          hotPercent: 0,
          lotPercent: 0,
          unsetPercent: 0,
          total: 0,
          byDomain: { Cognitive: 0, Affective: 0, Psychomotor: 0, unset: 0 },
          byCourse: [],
          recommendation: 'No curriculum courses found for this program.',
          hec_compliant: null,
        },
      });
    }

    // Aggregate counts
    const cloSummary = emptyCount();
    const lloSummary = emptyCount();
    const domainCount: Record<string, number> = {
      Cognitive: 0,
      Affective: 0,
      Psychomotor: 0,
      unset: 0,
    };

    const byCourse = curriculum.map(({ course, semesterSlot }) => {
      const cloBloom = emptyCount();
      const lloBloom = emptyCount();

      for (const clo of course.clos) {
        const level = (clo.bloomLevel as BloomLevel | null) ?? null;
        const key = level ?? 'unset';
        cloBloom[key]++;
        cloSummary[key]++;
        const domain = clo.bloomDomain ?? null;
        if (domain) domainCount[domain] = (domainCount[domain] ?? 0) + 1;
        else domainCount['unset']++;
      }

      for (const llo of course.llos) {
        const level = (llo.bloomLevel as BloomLevel | null) ?? null;
        const key = level ?? 'unset';
        lloBloom[key]++;
        lloSummary[key]++;
        const domain = llo.bloomDomain ?? null;
        if (domain) domainCount[domain] = (domainCount[domain] ?? 0) + 1;
        else domainCount['unset']++;
      }

      return {
        courseId: course.id,
        courseCode: course.code,
        courseName: course.name,
        courseType: course.type,
        semesterSlot,
        clos: course.clos.map((c) => ({
          id: c.id,
          code: c.code,
          bloomLevel: c.bloomLevel ?? null,
          bloomDomain: c.bloomDomain ?? null,
        })),
        llos: course.llos.map((l) => ({
          id: l.id,
          code: l.code,
          bloomLevel: l.bloomLevel ?? null,
          bloomDomain: l.bloomDomain ?? null,
        })),
        cloBloom,
        lloBloom,
      };
    });

    // Combined totals (CLOs + LLOs)
    const combined = emptyCount();
    for (const level of [...BLOOM_ORDER, 'unset'] as Array<BloomLevel | 'unset'>) {
      combined[level] = cloSummary[level] + lloSummary[level];
    }

    const totalWithLevel = BLOOM_ORDER.reduce((sum, l) => sum + combined[l], 0);
    const totalAll = totalWithLevel + combined['unset'];

    const hotCount = HOT_LEVELS_sum(combined);
    const lotCount = LOT_LEVELS_sum(combined);

    const hotPercent = totalWithLevel > 0 ? Math.round((hotCount / totalWithLevel) * 1000) / 10 : 0;
    const lotPercent = totalWithLevel > 0 ? Math.round((lotCount / totalWithLevel) * 1000) / 10 : 0;
    const unsetPercent = totalAll > 0 ? Math.round((combined['unset'] / totalAll) * 1000) / 10 : 0;

    // HEC/Washington Accord recommendation: HOT >= 40% (for senior/advanced programs)
    const hecCompliant = hotPercent >= 40;
    let recommendation = '';
    if (totalAll === 0) {
      recommendation = 'No CLOs or LLOs have been defined for this program yet.';
    } else if (combined['unset'] > 0) {
      recommendation = `${combined['unset']} outcome(s) have no Bloom's level assigned. Assign levels to get accurate analysis.`;
    } else if (hecCompliant) {
      recommendation = `HOT is ${hotPercent}% — meets HEC/Washington Accord recommendation of ≥40% higher-order thinking.`;
    } else {
      recommendation = `HOT is ${hotPercent}% — below the HEC/Washington Accord recommendation of ≥40%. Consider revising CLOs/LLOs to increase higher-order thinking (Analyze, Evaluate, Create).`;
    }

    // Per-level breakdown ordered for charts
    const levelBreakdown = BLOOM_ORDER.map((level) => ({
      level,
      clos: cloSummary[level],
      llos: lloSummary[level],
      total: combined[level],
      isHOT: HOT_LEVELS.has(level),
    }));

    return NextResponse.json({
      success: true,
      data: {
        summary: combined,
        cloSummary,
        lloSummary,
        levelBreakdown,
        hotPercent,
        lotPercent,
        unsetPercent,
        hotCount,
        lotCount,
        total: totalAll,
        totalWithLevel,
        byDomain: domainCount,
        byCourse,
        recommendation,
        hec_compliant: totalWithLevel > 0 ? hecCompliant : null,
      },
    });
  } catch (err) {
    console.error('[GET_BLOOM_ANALYSIS]', err);
    return NextResponse.json({ success: false, error: 'Failed to run Bloom\'s analysis' }, { status: 500 });
  }
}

function HOT_LEVELS_sum(counts: BloomCount): number {
  return Array.from(HOT_LEVELS).reduce((s, l) => s + counts[l as BloomLevel], 0);
}

function LOT_LEVELS_sum(counts: BloomCount): number {
  return Array.from(LOT_LEVELS).reduce((s, l) => s + counts[l as BloomLevel], 0);
}
