import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { authorize, canManageCourseOffering, forbiddenResponse, resolveDepartmentScope } from '@/lib/authz';

/**
 * These four numbers decide who passes a course and whether an outcome counts
 * as attained. Unvalidated, a non-numeric value reached a `Float` column as
 * `NaN`, and every comparison against it silently answered false.
 */
const percent = z.coerce
  .number()
  .finite('Must be a number')
  .min(0, 'Cannot be negative')
  .max(100, 'Cannot exceed 100');

const criteriaSchema = z.object({
  courseOfferingId: z.coerce.number().int().positive(),
  minPassPercent: percent.optional(),
  minCloAttainmentPercent: percent.optional(),
  minLloAttainmentPercent: percent.optional(),
  minAttendancePercent: percent.optional(),
});

export async function GET(request: NextRequest) {
  // Pass/fail thresholds decide who passes a course — staff configuration.
  const auth = await authorize(request, ['super_admin', 'admin', 'faculty']);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const offeringParam = searchParams.get('courseOfferingId');

  let where: Record<string, unknown> = {};

  if (offeringParam) {
    const offeringId = parseInt(offeringParam, 10);
    if (Number.isNaN(offeringId)) {
      return NextResponse.json({ error: 'Invalid courseOfferingId' }, { status: 400 });
    }
    if (!(await canManageCourseOffering(request, auth.user, offeringId))) {
      return forbiddenResponse();
    }
    where = { courseOfferingId: offeringId };
  } else {
    // No offering named: scope to the caller's department rather than
    // returning every course's criteria in the university.
    const scope = await resolveDepartmentScope(request, auth.user);
    if (scope.error) return scope.error;
    if (scope.scoped) {
      where = {
        courseofferings: { course: { departmentId: scope.departmentId } },
      };
    }
  }

  const criteria = await prisma.passfailcriteria.findMany({
    where,
    include: {
      courseofferings: {
        include: {
          course: { select: { id: true, code: true, name: true } },
          semester: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ success: true, data: criteria });
}

export async function POST(request: NextRequest) {
  const { success, user, error } = await requireAuth(request);
  if (!success) return NextResponse.json({ error }, { status: 401 });
  if (user?.role !== 'admin') {
    return NextResponse.json({ error: 'Admins only' }, { status: 403 });
  }

  const parsed = criteriaSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }
  const {
    courseOfferingId,
    minPassPercent,
    minCloAttainmentPercent,
    minLloAttainmentPercent,
    minAttendancePercent,
  } = parsed.data;

  const existing = await prisma.passfailcriteria.findUnique({
    where: { courseOfferingId },
  });
  if (existing) {
    return NextResponse.json(
      { error: 'Criteria already exists for this offering. Use Edit to update.' },
      { status: 409 }
    );
  }

  const criterion = await prisma.passfailcriteria.create({
    data: {
      courseOfferingId,
      minPassPercent: minPassPercent ?? 50,
      minCloAttainmentPercent: minCloAttainmentPercent ?? null,
      minLloAttainmentPercent: minLloAttainmentPercent ?? null,
      minAttendancePercent: minAttendancePercent ?? null,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true, data: criterion }, { status: 201 });
}
