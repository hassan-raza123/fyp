import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: Request,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const data = await req.json();
    const { questionNo, description, marks, cloId } = data;

    const itemId = parseInt(params.itemId);
    if (isNaN(itemId)) {
      return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 });
    }

    const updatedItem = await prisma.assessmentitems.update({
      where: { id: itemId },
      data: {
        questionNo,
        description,
        marks,
        ...(cloId && { cloId: Number(cloId) }),
      },
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error updating assessment item:', error);
    return NextResponse.json(
      { error: 'Failed to update assessment item', details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const itemId = parseInt(params.itemId);
    if (isNaN(itemId)) {
      return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 });
    }

    await prisma.assessmentitems.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting assessment item:', error);
    return NextResponse.json(
      { error: 'Failed to delete assessment item', details: String(error) },
      { status: 500 }
    );
  }
}
