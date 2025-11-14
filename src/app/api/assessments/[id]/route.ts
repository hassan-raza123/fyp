import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, description, dueDate, totalMarks, instructions, weightage } = body;

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
          },
          orderBy: {
            questionNo: 'asc',
          },
        },
        courseOffering: {
          include: {
            course: {
              select: {
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
