import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize, forbidden } from '@/lib/authz';
import { writeAuditLog } from '@/lib/audit-log';
import { findUnattainedOutcomes } from '@/lib/obe';

/**
 * Closing the loop.
 *
 * GET  — list outcomes that missed their target and have no action plan yet.
 * POST — create draft action plans for those outcomes in one step.
 *
 * Without this an admin has to read every attainment table by hand to notice
 * which outcomes need attention, which is exactly the step that gets skipped.
 */

async function assertProgramInDepartment(
  request: NextRequest,
  role: string,
  programId: number
): Promise<NextResponse | null> {
  if (role === 'super_admin') return null;

  const { getDepartmentIdFromRequest } = await import('@/lib/auth');
  const departmentId = await getDepartmentIdFromRequest(request);
  if (!departmentId) {
    return NextResponse.json(
      { success: false, error: 'Department not found for your account' },
      { status: 400 }
    );
  }

  const program = await prisma.programs.findUnique({
    where: { id: programId },
    select: { departmentId: true },
  });

  if (!program || program.departmentId !== departmentId) {
    return forbidden('Program does not belong to your department').response;
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authorize(request, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId');
    const semesterId = searchParams.get('semesterId');

    if (!programId || !semesterId) {
      return NextResponse.json(
        { success: false, error: 'programId and semesterId are required' },
        { status: 400 }
      );
    }

    const pid = Number(programId);
    const sid = Number(semesterId);

    const denied = await assertProgramInDepartment(request, auth.user.role, pid);
    if (denied) return denied;

    const unattained = await findUnattainedOutcomes(pid, sid);

    // Skip outcomes that already have a plan for this semester
    const existingPlans = await prisma.action_plans.findMany({
      where: { semesterId: sid, plo: { programId: pid } },
      select: { ploId: true, cloId: true, lloId: true },
    });

    const covered = new Set(
      existingPlans.flatMap((p) =>
        [
          p.cloId !== null ? `clo:${p.cloId}` : null,
          p.lloId !== null ? `llo:${p.lloId}` : null,
          p.cloId === null && p.lloId === null ? `plo:${p.ploId}` : null,
        ].filter(Boolean) as string[]
      )
    );

    const suggestions = unattained.filter(
      (o) => !covered.has(`${o.kind}:${o.outcomeId}`)
    );

    return NextResponse.json({
      success: true,
      data: suggestions,
      meta: {
        totalUnattained: unattained.length,
        alreadyPlanned: unattained.length - suggestions.length,
      },
    });
  } catch (error) {
    console.error('[GET_ACTION_PLAN_SUGGESTIONS]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load action plan suggestions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authorize(request, ['super_admin', 'admin']);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const { programId, semesterId } = body;

    if (!programId || !semesterId) {
      return NextResponse.json(
        { success: false, error: 'programId and semesterId are required' },
        { status: 400 }
      );
    }

    const pid = Number(programId);
    const sid = Number(semesterId);

    const denied = await assertProgramInDepartment(request, auth.user.role, pid);
    if (denied) return denied;

    const unattained = await findUnattainedOutcomes(pid, sid);
    if (unattained.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All outcomes met their targets — no action plans needed.',
        data: [],
      });
    }

    // Every action plan row requires a ploId, so a CLO/LLO shortfall is filed
    // against a PLO it maps to.
    const cloIds = unattained.filter((o) => o.kind === 'clo').map((o) => o.outcomeId);
    const lloIds = unattained.filter((o) => o.kind === 'llo').map((o) => o.outcomeId);

    const [cloMappings, lloMappings] = await Promise.all([
      cloIds.length
        ? prisma.cloplomappings.findMany({
            where: { cloId: { in: cloIds } },
            select: { cloId: true, ploId: true, weight: true },
            orderBy: { weight: 'desc' },
          })
        : [],
      lloIds.length
        ? prisma.lloplomappings.findMany({
            where: { lloId: { in: lloIds } },
            select: { lloId: true, ploId: true, weight: true },
            orderBy: { weight: 'desc' },
          })
        : [],
    ]);

    const primaryPloForClo = new Map<number, number>();
    for (const m of cloMappings) {
      if (!primaryPloForClo.has(m.cloId)) primaryPloForClo.set(m.cloId, m.ploId);
    }
    const primaryPloForLlo = new Map<number, number>();
    for (const m of lloMappings) {
      if (!primaryPloForLlo.has(m.lloId)) primaryPloForLlo.set(m.lloId, m.ploId);
    }

    const existingPlans = await prisma.action_plans.findMany({
      where: { semesterId: sid, plo: { programId: pid } },
      select: { ploId: true, cloId: true, lloId: true },
    });
    const covered = new Set(
      existingPlans.flatMap((p) =>
        [
          p.cloId !== null ? `clo:${p.cloId}` : null,
          p.lloId !== null ? `llo:${p.lloId}` : null,
          p.cloId === null && p.lloId === null ? `plo:${p.ploId}` : null,
        ].filter(Boolean) as string[]
      )
    );

    const created = [];
    const skipped: string[] = [];

    for (const outcome of unattained) {
      if (covered.has(`${outcome.kind}:${outcome.outcomeId}`)) continue;

      let ploId: number | undefined;
      if (outcome.kind === 'plo') ploId = outcome.outcomeId;
      else if (outcome.kind === 'clo') ploId = primaryPloForClo.get(outcome.outcomeId);
      else ploId = primaryPloForLlo.get(outcome.outcomeId);

      // An outcome mapped to no PLO cannot be filed; report it rather than
      // dropping it silently, because that mapping gap is itself a problem.
      if (!ploId) {
        skipped.push(`${outcome.code} (not mapped to any PLO)`);
        continue;
      }

      const gap = (outcome.threshold - outcome.attainmentPercent).toFixed(1);
      const scope =
        outcome.kind === 'plo'
          ? outcome.code
          : `${outcome.code} in ${outcome.courseCode ?? 'course'}`;

      const plan = await prisma.action_plans.create({
        data: {
          ploId,
          cloId: outcome.kind === 'clo' ? outcome.outcomeId : null,
          lloId: outcome.kind === 'llo' ? outcome.outcomeId : null,
          semesterId: sid,
          courseOfferingId: outcome.courseOfferingId ?? null,
          attainmentValue: outcome.attainmentPercent,
          threshold: outcome.threshold,
          rootCause: `${scope} attained ${outcome.attainmentPercent.toFixed(1)}%, ${gap} points below the ${outcome.threshold}% target. Root cause to be investigated.`,
          expectedOutcome: `Raise ${outcome.code} attainment to at least ${outcome.threshold}%.`,
          status: 'pending',
          createdBy: auth.user.userId as number,
        },
      });

      created.push(plan);
      covered.add(`${outcome.kind}:${outcome.outcomeId}`);
    }

    await writeAuditLog(request, auth.user, 'action_plan.auto_create', {
      programId: pid,
      semesterId: sid,
      unattainedCount: unattained.length,
      createdCount: created.length,
      skipped,
    });

    return NextResponse.json({
      success: true,
      message: `Created ${created.length} draft action plan(s) from ${unattained.length} unattained outcome(s).`,
      data: created,
      meta: { skipped },
    });
  } catch (error) {
    console.error('[POST_ACTION_PLAN_SUGGESTIONS]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create action plans' },
      { status: 500 }
    );
  }
}
