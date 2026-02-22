import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await req.json();
    const { questionNo, description, marks, cloId, lloId } = data;

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

    const itemData: any = {
      assessmentId: parseInt(params.id),
      questionNo,
      description,
      marks,
      ...(hasClo && { cloId: Number(cloId) }),
      ...(hasLlo && { lloId: Number(lloId) }),
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
      { error: 'Failed to create assessment item', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
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
