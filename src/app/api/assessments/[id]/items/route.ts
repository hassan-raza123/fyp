import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import {
  authorize,
  canAccessCourse,
  canManageCourseOffering,
  assertResultsUnlocked,
  forbidden,
  forbiddenResponse,
} from '@/lib/authz';
import { validateComplexity } from '@/constants/complexity';

export async function POST(
  req: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params;
  try {
    const auth = await authorize(req, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;

    const assessment = await prisma.assessments.findUnique({
      where: { id: parseInt(params.id) },
      select: { courseOfferingId: true },
    });

    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    if (
      !(await canManageCourseOffering(req, auth.user, assessment.courseOfferingId))
    ) {
      return forbidden('You do not have access to this course offering')
        .response;
    }

    const locked = await assertResultsUnlocked(
      auth.user,
      assessment.courseOfferingId
    );
    if (locked) return locked;

    const data = await req.json();
    const { questionNo, description, marks, cloId, lloId, rubricId } = data;
    const { complexity, complexAttributes } = data;

    // Validate: must have either cloId (theory) or lloId (lab), not both, not neither
    const hasClo = cloId !== undefined && cloId !== null && cloId !== '';
    const hasLlo = lloId !== undefined && lloId !== null && lloId !== '';

    if (!hasClo && !hasLlo) {
      return NextResponse.json(
        { error: 'Assessment item must be mapped to either a CLO (theory) or an LLO (lab)' },
        { status: 400 }
      );
    }

    if (hasClo && hasLlo) {
      return NextResponse.json(
        { error: 'Assessment item can only be mapped to one outcome: either a CLO or an LLO, not both' },
        { status: 400 }
      );
    }

    if (hasClo && isNaN(Number(cloId))) {
      return NextResponse.json(
        { error: 'cloId must be a valid number' },
        { status: 400 }
      );
    }

    if (hasLlo && isNaN(Number(lloId))) {
      return NextResponse.json(
        { error: 'lloId must be a valid number' },
        { status: 400 }
      );
    }

    // Complex Engineering Problem / Activity, if the course team designated
    // this item as one. PEC requires rubric-based evaluation and at least one
    // declared attribute, so a malformed designation is rejected here rather
    // than surfacing as a hole in the evidence at an accreditation visit.
    if (complexity) {
      const complexityErrors = validateComplexity(
        complexity,
        complexAttributes,
        Boolean(rubricId)
      );
      if (complexityErrors.length) {
        return NextResponse.json(
          { error: complexityErrors.join(' ') },
          { status: 400 }
        );
      }
    }

    const itemData: any = {
      assessmentId: parseInt(params.id),
      questionNo,
      description,
      marks,
      ...(hasClo && { cloId: Number(cloId) }),
      ...(hasLlo && { lloId: Number(lloId) }),
      // Optional: when set, the item is scored via /assessment-results/[id]/rubric-score
      ...(rubricId ? { rubricId: Number(rubricId) } : {}),
      ...(complexity
        ? { complexity, complexAttributes: complexAttributes ?? [] }
        : {}),
    };

    const assessmentItem = await prisma.assessmentitems.create({
      data: itemData,
      include: {
        clo: true,
        llo: true,
      },
    });

    return NextResponse.json(assessmentItem);
  } catch (error) {
    console.error('Error creating assessment item:', error);
    return NextResponse.json(
      { error: 'Failed to create assessment item' },
      { status: 500 }
    );
  }
}

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

    const owning = await prisma.assessments.findUnique({
      where: { id: parseInt(params.id) },
      select: { courseOffering: { select: { courseId: true } } },
    });

    if (!owning) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    if (
      !(await canAccessCourse(
        request,
        auth.user,
        owning.courseOffering.courseId
      ))
    ) {
      return forbiddenResponse();
    }

    const assessmentItems = await prisma.assessmentitems.findMany({
      where: {
        assessmentId: parseInt(params.id),
      },
      include: {
        clo: true,
        llo: true,
      },
      orderBy: {
        questionNo: 'asc',
      },
    });

    return NextResponse.json(assessmentItems);
  } catch (error) {
    console.error('Error fetching assessment items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessment items' },
      { status: 500 }
    );
  }
}
