import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { UpdateCLOPLOMappingDTO } from '@/types/clo-plo-mapping';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { weight } = body as UpdateCLOPLOMappingDTO;

    if (weight === undefined) {
      return NextResponse.json(
        { success: false, error: 'Weight is required' },
        { status: 400 }
      );
    }

    if (weight < 0 || weight > 1) {
      return NextResponse.json(
        { success: false, error: 'Weight must be between 0 and 1' },
        { status: 400 }
      );
    }

    const mapping = await prisma.cloplomappings.update({
      where: {
        id: Number(params.id),
      },
      data: {
        weight,
      },
      include: {
        clo: true,
        plo: true,
      },
    });

    return NextResponse.json({ success: true, data: mapping });
  } catch (error) {
    console.error('Error updating CLO-PLO mapping:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.cloplomappings.delete({
      where: {
        id: Number(params.id),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting CLO-PLO mapping:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
