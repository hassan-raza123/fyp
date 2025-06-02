import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await req.json();
    console.log('Received data:', data);
    const { questionNo, description, marks, cloId } = data;

    if (!cloId || isNaN(Number(cloId))) {
      console.log('Validation failed: cloId is required and must be a number');
      return NextResponse.json(
        { error: 'cloId is required and must be a valid number' },
        { status: 400 }
      );
    }

    const itemData: any = {
      assessmentId: parseInt(params.id),
      questionNo,
      description,
      marks,
      cloId: Number(cloId),
    };

    console.log('Creating assessment item with data:', itemData);
    const assessmentItem = await prisma.assessmentitems.create({
      data: itemData,
    });
    console.log('Assessment item created:', assessmentItem);

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

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    await prisma.assessmentitems.delete({
      where: {
        id: parseInt(itemId),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting assessment item:', error);
    return NextResponse.json(
      { error: 'Failed to delete assessment item' },
      { status: 500 }
    );
  }
}
