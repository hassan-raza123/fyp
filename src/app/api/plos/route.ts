import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';

// GET /api/plos
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { success, user, error } = requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all PLOs with their program information
    const plos = await prisma.plos.findMany({
      include: {
        program: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: [
        {
          program: {
            name: 'asc',
          },
        },
        {
          code: 'asc',
        },
      ],
    });

    return NextResponse.json({
      success: true,
      data: plos,
    });
  } catch (error) {
    console.error('Error fetching PLOs:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch PLOs',
      },
      { status: 500 }
    );
  }
}
