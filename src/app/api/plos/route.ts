import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/plos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId');

    const where: any = {};
    if (programId) where.programId = parseInt(programId);

    const plos = await prisma.plos.findMany({
      where,
      include: {
        program: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, data: plos });
  } catch (error) {
    console.error('Error fetching PLOs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch PLOs' },
      { status: 500 }
    );
  }
}
