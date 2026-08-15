import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import {
  authorize,
  canManageCourse,
  forbiddenResponse,
  resolveDepartmentScope,
} from '@/lib/authz';

/**
 * The weight is the share this outcome contributes to the PLO it maps to.
 * `weightedAverage` divides by the sum of these, so a `NaN` here does not fail
 * loudly — it makes every attainment derived from the mapping `NaN` too.
 */
const mappingSchema = z.object({
  cloId: z.coerce.number().int().positive(),
  ploId: z.coerce.number().int().positive(),
  weight: z.coerce
    .number()
    .finite('Weight must be a number')
    .min(0, 'Weight cannot be negative')
    .max(1, 'Weight cannot exceed 1'),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await authorize(request, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const cloId = searchParams.get('cloId');
    const ploId = searchParams.get('ploId');

    const where: any = {};
    if (cloId) where.cloId = parseInt(cloId);
    if (ploId) where.ploId = parseInt(ploId);

    // Mappings are the accreditation trail between a course and a programme;
    // scope them to the caller's department.
    const scope = await resolveDepartmentScope(request, auth.user);
    if (scope.error) return scope.error;
    if (scope.scoped) {
      where.clo = { course: { departmentId: scope.departmentId } };
    }

    const mappings = await prisma.cloplomappings.findMany({
      where,
      include: {
        clo: {
          include: {
            course: {
              include: { programMappings: { include: { program: true } } },
            },
          },
        },
        plo: { include: { program: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = mappings.map((m) => ({
      ...m,
      clo: {
        ...m.clo,
        course: {
          ...m.clo.course,
          programs: m.clo.course.programMappings.map((pm) => pm.program),
          programMappings: undefined,
        },
      },
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching CLO-PLO mappings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch mappings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { success, user, error } = await requireAuth(request as any);
    if (!success || !['admin', 'super_admin'].includes(user?.role ?? ''))
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });

    const parsed = mappingSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }
    const { cloId, ploId, weight } = parsed.data;

    // The CLO is named in the body. This mapping is a weight the PLO rollup
    // divides by, so writing one into another department's CLO alters its
    // attainment figures.
    const cloOwner = await prisma.clos.findUnique({
      where: { id: cloId },
      select: { courseId: true },
    });
    if (!cloOwner) {
      return NextResponse.json(
        { success: false, error: 'CLO not found' },
        { status: 404 }
      );
    }
    if (
      !(await canManageCourse(request as NextRequest, user!, cloOwner.courseId))
    ) {
      return forbiddenResponse();
    }

    // Validate weight
    if (weight < 0 || weight > 1) {
      return NextResponse.json(
        { success: false, error: 'Weight must be between 0 and 1' },
        { status: 400 }
      );
    }

    // A CLO's weights across all the PLOs it maps to represent how its
    // contribution is divided, so they must not exceed 1 in total.
    const existingWeights = await prisma.cloplomappings.aggregate({
      where: { cloId: cloId, ploId: { not: ploId } },
      _sum: { weight: true },
    });
    const otherWeight = existingWeights._sum.weight ?? 0;
    if (otherWeight + weight > 1.0001) {
      return NextResponse.json(
        {
          success: false,
          error: `Total mapping weight for this CLO would be ${(otherWeight + weight).toFixed(2)}, which exceeds 1. Other mappings already use ${otherWeight.toFixed(2)}.`,
          usedWeight: otherWeight,
          remainingWeight: Math.max(0, 1 - otherWeight),
        },
        { status: 400 }
      );
    }

    // Get CLO with its course and programs
    const cloRaw = await prisma.clos.findUnique({
      where: { id: cloId },
      include: {
        course: { include: { programMappings: { include: { program: true } } } },
      },
    });
    const clo = cloRaw
      ? {
          ...cloRaw,
          course: {
            ...cloRaw.course,
            programs: cloRaw.course.programMappings.map((m) => m.program),
          },
        }
      : null;

    if (!clo) {
      return NextResponse.json(
        { success: false, error: 'CLO not found' },
        { status: 404 }
      );
    }

    // Get PLO with its program
    const plo = await prisma.plos.findUnique({
      where: { id: ploId },
      include: {
        program: true,
      },
    });

    if (!plo) {
      return NextResponse.json(
        { success: false, error: 'PLO not found' },
        { status: 404 }
      );
    }

    // Check if the course belongs to the same program as the PLO
    // Only enforce when the course has programs assigned; if none, allow any PLO
    const courseProgramIds = clo.course.programs.map((p) => p.id);
    if (courseProgramIds.length > 0 && !courseProgramIds.includes(plo.program.id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot map CLO to PLO from a different program',
          details: {
            coursePrograms: clo.course.programs.map((p) => ({
              id: p.id,
              name: p.name,
            })),
            ploProgram: { id: plo.program.id, name: plo.program.name },
          },
        },
        { status: 400 }
      );
    }

    // Check if mapping already exists
    const existingMapping = await prisma.cloplomappings.findFirst({
      where: {
        cloId: cloId,
        ploId: ploId,
      },
    });

    if (existingMapping) {
      return NextResponse.json(
        { success: false, error: 'Mapping already exists' },
        { status: 400 }
      );
    }

    // Create mapping
    const mapping = await prisma.cloplomappings.create({
      data: {
        cloId: cloId,
        ploId: ploId,
        weight: weight,
      },
      include: {
        clo: {
          include: {
            course: true,
          },
        },
        plo: {
          include: {
            program: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: mapping });
  } catch (error) {
    console.error('Error creating CLO-PLO mapping:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create mapping' },
      { status: 500 }
    );
  }
}
