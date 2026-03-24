import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: Request,
  { params: _params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const data = await req.json();
    const { questionNo, description, marks, cloId, lloId } = data;

    const itemId = parseInt(params.itemId);
    if (isNaN(itemId)) {
      return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 });
    }

    // Validate CLO/LLO mapping: must have one or the other, never both, never neither
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

    const updatedItem = await prisma.assessmentitems.update({
      where: { id: itemId },
      data: {
        questionNo,
        description,
        marks,
        // Set the active mapping and explicitly clear the other
        cloId: hasClo ? Number(cloId) : null,
        lloId: hasLlo ? Number(lloId) : null,
      },
      include: {
        clo: true,
        llo: true,
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
  { params: _params }: { params: Promise<{ id: string; itemId: string }> }
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
