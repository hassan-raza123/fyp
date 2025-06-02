import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, description, dueDate, totalMarks, instructions } = body;

    const assessment = await prisma.assessments.update({
      where: {
        id: parseInt(params.id),
      },
      data: {
        title,
        description,
        dueDate: new Date(dueDate),
        totalMarks: parseInt(totalMarks),
        instructions,
      },
    });

    return NextResponse.json(assessment);
  } catch (error) {
    console.error('[ASSESSMENT_UPDATE]', error);
    return new NextResponse('Internal error', { status: 500 });
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
