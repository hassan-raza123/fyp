import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  try {
    const { success, error } = await requireAuth(request as any);
    if (!success) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, dueDate, totalMarks, instructions, weightage } = body;

    // If weightage is being changed, validate the new total won't exceed 100
    if (weightage !== undefined) {
      const current = await prisma.assessments.findUnique({
        where: { id: parseInt(params.id) },
        select: { courseOfferingId: true, weightage: true },
      });
      if (current) {
        const existingWeightage = await prisma.assessments.aggregate({
          where: {
            courseOfferingId: current.courseOfferingId,
            status: { not: 'cancelled' },
            id: { not: parseInt(params.id) }, // exclude current assessment
          },
          _sum: { weightage: true },
        });
        const otherWeightage = existingWeightage._sum.weightage ?? 0;
        if (otherWeightage + Number(weightage) > 100) {
          return NextResponse.json(
            {
              error: `Total weightage would exceed 100%. Other assessments use: ${otherWeightage}%. Available: ${(100 - otherWeightage).toFixed(1)}%`,
              usedWeightage: otherWeightage,
              remainingWeightage: 100 - otherWeightage,
            },
            { status: 400 }
          );
        }
      }
    }

    const assessment = await prisma.assessments.update({
      where: {
        id: parseInt(params.id),
      },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(dueDate !== undefined && { dueDate: new Date(dueDate) }),
        ...(totalMarks !== undefined && { totalMarks: parseInt(totalMarks) }),
        ...(instructions !== undefined && { instructions }),
        ...(weightage !== undefined && { weightage: Number(weightage) }),
      },
    });

    return NextResponse.json(assessment);
  } catch (error) {
    console.error('[ASSESSMENT_UPDATE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  try {
    const { success, error } = await requireAuth(request as any);
    if (!success) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    const validStatuses = ['active', 'draft', 'completed', 'evaluated', 'published', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Status is required and must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const assessment = await prisma.assessments.update({
      where: {
        id: parseInt(params.id),
      },
      data: {
        status: status as any,
      },
    });

    return NextResponse.json(assessment);
  } catch (error) {
    console.error('[ASSESSMENT_STATUS_UPDATE]', error);
    return NextResponse.json(
      { error: 'Failed to update assessment status' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  try {
    const { success, error } = await requireAuth(request as any);
    if (!success) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
    }

    const assessmentId = parseInt(params.id);

    // Get all assessment item IDs for this assessment
    const items = await prisma.assessmentitems.findMany({
      where: { assessmentId },
      select: { id: true },
    });
    const itemIds = items.map((i) => i.id);

    // Delete in correct cascade order within a transaction
    await prisma.$transaction([
      // 1. Delete student assessment item results
      prisma.studentassessmentitemresults.deleteMany({
        where: { assessmentItemId: { in: itemIds } },
      }),
      // 2. Delete student assessment results
      prisma.studentassessmentresults.deleteMany({
        where: { assessmentId },
      }),
      // 3. Delete assessment items
      prisma.assessmentitems.deleteMany({
        where: { assessmentId },
      }),
      // 4. Delete the assessment
      prisma.assessments.delete({
        where: { id: assessmentId },
      }),
    ]);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[ASSESSMENT_DELETE]', error);
    return NextResponse.json(
      { error: 'Failed to delete assessment' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  try {
    const { success, error } = await requireAuth(request as any);
    if (!success) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
    }

    const assessment = await prisma.assessments.findUnique({
      where: {
        id: parseInt(params.id),
      },
      include: {
        assessmentItems: {
          include: {
            clo: {
              select: {
                id: true,
                code: true,
                description: true,
              },
            },
            llo: {
              select: {
                id: true,
                code: true,
                description: true,
              },
            },
          },
          orderBy: {
            questionNo: 'asc',
          },
        },
        courseOffering: {
          include: {
            course: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
            semester: {
              select: {
                name: true,
              },
            },
            sections: {
              where: {
                status: 'active',
              },
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(assessment);
  } catch (error) {
    console.error('[ASSESSMENT_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
