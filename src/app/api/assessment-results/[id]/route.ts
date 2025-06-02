import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const resultId = parseInt(params.id);
    if (isNaN(resultId)) {
      return NextResponse.json({ error: 'Invalid result ID' }, { status: 400 });
    }

    const body = await request.json();
    const { status, remarks } = body;

    if (!status && !remarks) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }

    const updatedResult = await prisma.studentassessmentresults.update({
      where: { id: resultId },
      data: {
        ...(status && { status }),
        ...(remarks && { remarks }),
      },
    });

    return NextResponse.json(updatedResult);
  } catch (error) {
    console.error('Error updating assessment result:', error);
    return NextResponse.json(
      { error: 'Failed to update assessment result' },
      { status: 500 }
    );
  }
}
