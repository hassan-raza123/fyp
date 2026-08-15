import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit-log';
import {
  authorize,
  canAccessProgram,
  departmentFilter,
  forbiddenResponse,
  resolveDepartmentScope,
} from '@/lib/authz';

/**
 * The thresholds a student is measured against to graduate. `directWeight` and
 * `indirectWeight` split direct (marks) against indirect (survey) attainment,
 * so they have to be a proportion, not an arbitrary number.
 */
const graduationCriteriaSchema = z.object({
  programId: z.coerce.number().int().positive(),
  minCGPA: z.coerce.number().finite().min(0).max(4).optional(),
  minPloAttainmentPercent: z.coerce.number().finite().min(0).max(100).optional(),
  requireAllCourses: z.coerce.boolean().optional(),
  directWeight: z.coerce.number().finite().min(0).max(1).optional(),
  indirectWeight: z.coerce.number().finite().min(0).max(1).optional(),
});

/**
 * GET /api/graduation-criteria
 * Returns all programs with their graduation criteria (null if not configured yet).
 * Admin-only.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authorize(request, ['super_admin', 'admin']);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId');

    // A named programme is checked; an unnamed one scopes the listing to the
    // caller's department. Without this the endpoint handed every department's
    // graduation thresholds to any admin who asked.
    let where: Record<string, unknown>;
    if (programId) {
      if (!(await canAccessProgram(request, auth.user, parseInt(programId)))) {
        return forbiddenResponse();
      }
      where = { id: parseInt(programId) };
    } else {
      const scope = await resolveDepartmentScope(request, auth.user);
      if (scope.error) return scope.error;
      where = departmentFilter(scope.departmentId);
    }

    const programs = await prisma.programs.findMany({
      where,
      include: {
        graduationCriteria: true,
      },
      orderBy: { name: 'asc' },
    });

    const result = programs.map((program) => ({
      programId: program.id,
      programName: program.name,
      programCode: program.code,
      criteria: program.graduationCriteria ?? null,
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
    const auth = await authorize(request, ['super_admin', 'admin']);
    if (!auth.ok) return auth.response;

    const parsed = graduationCriteriaSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }
    const {
      programId,
      minCGPA,
      minPloAttainmentPercent,
      requireAllCourses,
      directWeight,
      indirectWeight,
    } = parsed.data;

    // `programId` comes from the body: these thresholds decide who graduates,
    // so writing them into a foreign programme is a direct attack on its
    // degree requirements.
    if (!(await canAccessProgram(request, auth.user, programId))) {
      return forbiddenResponse();
    }

    const dWeight = directWeight ?? 0.7;
    const iWeight = indirectWeight ?? 0.3;

    if (Math.abs(dWeight + iWeight - 1.0) > 0.001) {
      return NextResponse.json(
        { success: false, error: 'directWeight + indirectWeight must equal 1.0' },
        { status: 400 }
      );
    }

    // Check for existing criteria
    const existing = await prisma.graduation_criteria.findUnique({
      where: { programId },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Graduation criteria already exist for this program. Use PUT to update.' },
        { status: 409 }
      );
    }

    const criteria = await prisma.graduation_criteria.create({
      data: {
        programId,
        minCGPA: minCGPA ?? 2.0,
        minPloAttainmentPercent: minPloAttainmentPercent ?? 50.0,
        requireAllCourses: requireAllCourses ?? true,
        directWeight: dWeight,
        indirectWeight: iWeight,
      },
      include: { program: { select: { id: true, name: true, code: true } } },
    });

    await writeAuditLog(request, auth.user, 'graduation_criteria.create', {
      criteriaId: criteria.id,
      programId,
      minCGPA: criteria.minCGPA,
      minPloAttainmentPercent: criteria.minPloAttainmentPercent,
      requireAllCourses: criteria.requireAllCourses,
    });

    return NextResponse.json({ success: true, data: criteria }, { status: 201 });
  } catch (err) {
    console.error('[POST_GRADUATION_CRITERIA]', err);
    return NextResponse.json({ success: false, error: 'Failed to create graduation criteria' }, { status: 500 });
  }
}
