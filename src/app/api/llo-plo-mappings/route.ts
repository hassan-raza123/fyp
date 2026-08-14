import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveDepartmentScope, departmentFilter } from '@/lib/authz';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { getCurrentDepartmentId } from '@/lib/auth';

/**
 * The weight is the share this outcome contributes to the PLO it maps to.
 * `weightedAverage` divides by the sum of these, so a `NaN` here does not fail
 * loudly — it makes every attainment derived from the mapping `NaN` too.
 */
const mappingSchema = z.object({
  lloId: z.coerce.number().int().positive(),
  ploId: z.coerce.number().int().positive(),
  weight: z.coerce
    .number()
    .finite('Weight must be a number')
    .min(0, 'Weight cannot be negative')
    .max(1, 'Weight cannot exceed 1'),
});

// GET /api/llo-plo-mappings
export async function GET(request: NextRequest) {
  try {
    const { success, user } = await requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const lloId = searchParams.get('lloId');
    const ploId = searchParams.get('ploId');

    // Get current department ID
    // A super_admin belongs to no department and must not be scoped out of
    // the system; see resolveDepartmentScope.
    const departmentIdScope = await resolveDepartmentScope(request, user!);
    if (departmentIdScope.error) return departmentIdScope.error;
    const departmentId = departmentIdScope.departmentId;

    const where: any = {};
    if (lloId) where.lloId = parseInt(lloId);
    if (ploId) where.ploId = parseInt(ploId);

    const mappings = await prisma.lloplomappings.findMany({
      where,
      include: {
        llo: {
          include: {
            course: {
              select: {
                id: true,
                code: true,
                name: true,
                departmentId: true,
              },
            },
          },
        },
        plo: {
          include: {
            program: {
              select: {
                id: true,
                name: true,
                code: true,
                departmentId: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filter by department
    const filteredMappings = mappings.filter(
      (mapping) =>
        (departmentId === null ||
          (mapping.llo.course.departmentId === departmentId &&
            mapping.plo.program.departmentId === departmentId))
    );

    return NextResponse.json({ success: true, data: filteredMappings });
  } catch (error) {
    console.error('Error fetching LLO-PLO mappings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch mappings' },
      { status: 500 }
    );
  }
}

// POST /api/llo-plo-mappings
export async function POST(request: NextRequest) {
  try {
    const { success, user } = await requireAuth(request);
    if (!success || user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const parsed = mappingSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }
    const { lloId, ploId, weight } = parsed.data;

    // Validate weight
    if (weight < 0 || weight > 1) {
      return NextResponse.json(
        { success: false, error: 'Weight must be between 0 and 1' },
        { status: 400 }
      );
    }

    // An LLO's weights across all its PLO mappings divide its contribution, so
    // they must not exceed 1 in total (mirrors the CLO-PLO rule).
    const existingWeights = await prisma.lloplomappings.aggregate({
      where: { lloId: lloId, ploId: { not: ploId } },
      _sum: { weight: true },
    });
    const otherWeight = existingWeights._sum.weight ?? 0;
    if (otherWeight + weight > 1.0001) {
      return NextResponse.json(
        {
          success: false,
          error: `Total mapping weight for this LLO would be ${(otherWeight + weight).toFixed(2)}, which exceeds 1. Other mappings already use ${otherWeight.toFixed(2)}.`,
          usedWeight: otherWeight,
          remainingWeight: Math.max(0, 1 - otherWeight),
        },
        { status: 400 }
      );
    }

    // Get current department ID
    // A super_admin belongs to no department and must not be scoped out of
    // the system; see resolveDepartmentScope.
    const departmentIdScope = await resolveDepartmentScope(request, user!);
    if (departmentIdScope.error) return departmentIdScope.error;
    const departmentId = departmentIdScope.departmentId;

    // Get LLO with its course
    const llo = await prisma.llos.findUnique({
      where: { id: lloId },
      include: {
        course: true,
      },
    });

    if (!llo) {
      return NextResponse.json(
        { success: false, error: 'LLO not found' },
        { status: 404 }
      );
    }

    if (llo.course.departmentId !== departmentId) {
      return NextResponse.json(
        { success: false, error: 'LLO does not belong to current department' },
        { status: 403 }
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

    if (plo.program.departmentId !== departmentId) {
      return NextResponse.json(
        { success: false, error: 'PLO does not belong to current department' },
        { status: 403 }
      );
    }

    // Check if mapping already exists
    const existingMapping = await prisma.lloplomappings.findUnique({
      where: {
        lloId_ploId: {
          lloId: lloId,
          ploId: ploId,
        },
      },
    });

    if (existingMapping) {
      return NextResponse.json(
        { success: false, error: 'Mapping already exists' },
        { status: 400 }
      );
    }

    // Create mapping
    const mapping = await prisma.lloplomappings.create({
      data: {
        lloId: lloId,
        ploId: ploId,
        weight: weight,
      },
      include: {
        llo: {
          include: {
            course: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        plo: {
          include: {
            program: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: mapping });
  } catch (error) {
    console.error('Error creating LLO-PLO mapping:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create mapping' },
      { status: 500 }
    );
  }
}

