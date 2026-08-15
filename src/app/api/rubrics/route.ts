import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit-log';
import { authorize, canManageCourseOffering, forbiddenResponse, resolveDepartmentScope } from '@/lib/authz';

// GET /api/rubrics?courseOfferingId=1  OR  ?cloId=1
export async function GET(request: NextRequest) {
  try {
    // Rubrics are marking guidance: staff configuration, not student-facing.
    const auth = await authorize(request, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const offeringParam = searchParams.get('courseOfferingId');
    const cloId = searchParams.get('cloId');
    const lloId = searchParams.get('lloId');

    let ownership: Record<string, unknown> = {};

    if (offeringParam) {
      const offeringId = Number(offeringParam);
      if (Number.isNaN(offeringId)) {
        return NextResponse.json({ error: 'Invalid courseOfferingId' }, { status: 400 });
      }
      if (!(await canManageCourseOffering(request, auth.user, offeringId))) {
        return forbiddenResponse();
      }
      ownership = { courseOfferingId: offeringId };
    } else {
      const scope = await resolveDepartmentScope(request, auth.user);
      if (scope.error) return scope.error;
      if (scope.scoped) {
        ownership = {
          courseOffering: { course: { departmentId: scope.departmentId } },
        };
      }
    }

    const rubrics = await prisma.rubrics.findMany({
      where: {
        ...ownership,
        ...(cloId ? { cloId: Number(cloId) } : {}),
        ...(lloId ? { lloId: Number(lloId) } : {}),
      },
      include: {
        clo: { select: { id: true, code: true, description: true } },
        llo: { select: { id: true, code: true, description: true } },
        criteria: { orderBy: { id: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(rubrics);
  } catch (error) {
    console.error('Error fetching rubrics:', error);
    return NextResponse.json({ error: 'Failed to fetch rubrics' }, { status: 500 });
  }
}

// POST /api/rubrics
export async function POST(request: NextRequest) {
  try {
    const auth = await authorize(request, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const { title, courseOfferingId, cloId, lloId, criteria } = body;

    if (!title || !courseOfferingId) {
      return NextResponse.json(
        { error: 'title and courseOfferingId are required' },
        { status: 400 }
      );
    }

    // A rubric decides how marks are awarded on its offering, so creating one
    // against a foreign offering is a write into that department's grading.
    if (
      !(await canManageCourseOffering(
        request,
        auth.user,
        Number(courseOfferingId)
      ))
    ) {
      return forbiddenResponse();
    }
    if (!cloId && !lloId) {
      return NextResponse.json(
        { error: 'A rubric must be linked to a CLO or LLO' },
        { status: 400 }
      );
    }

    const rubric = await prisma.rubrics.create({
      data: {
        title: title.trim(),
        courseOfferingId: Number(courseOfferingId),
        cloId: cloId ? Number(cloId) : null,
        lloId: lloId ? Number(lloId) : null,
        criteria: {
          create: (criteria ?? []).map(
            (c: {
              description: string;
              excellent: string;
              good: string;
              satisfactory: string;
              unsatisfactory: string;
              weight?: number;
            }) => ({
              description: c.description,
              excellent: c.excellent,
              good: c.good,
              satisfactory: c.satisfactory,
              unsatisfactory: c.unsatisfactory,
              weight: c.weight ?? 1,
            })
          ),
        },
      },
      include: {
        clo: { select: { id: true, code: true } },
        llo: { select: { id: true, code: true } },
        criteria: true,
      },
    });

    // A rubric is the instrument marks are awarded by, so its creation and
    // every later edit belong in the same trail as the marks themselves.
    await writeAuditLog(request, auth.user, 'rubric.create', {
      rubricId: rubric.id,
      courseOfferingId: Number(courseOfferingId),
      cloId: rubric.cloId,
      lloId: rubric.lloId,
      criteriaCount: rubric.criteria.length,
    });

    return NextResponse.json(rubric, { status: 201 });
  } catch (error) {
    console.error('Error creating rubric:', error);
    return NextResponse.json({ error: 'Failed to create rubric' }, { status: 500 });
  }
}
