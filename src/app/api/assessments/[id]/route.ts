import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
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
        ...(title && { title }),
        ...(description && { description }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(totalMarks && { totalMarks: parseInt(totalMarks) }),
        ...(instructions && { instructions }),
        ...(weightage && { weightage: Number(weightage) }),
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
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
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
  { params }: { params: { id: string } }
) {
  try {
    // Delete related assessment items first
    await prisma.assessmentitems.deleteMany({
      where: {
        assessmentId: parseInt(params.id),
      },
    });

    // Now delete the assessment
    await prisma.assessments.delete({
      where: {
        id: parseInt(params.id),
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[ASSESSMENT_DELETE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
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
