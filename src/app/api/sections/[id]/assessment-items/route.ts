import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const sectionId = parseInt(resolvedParams.id);

    if (isNaN(sectionId)) {
      return NextResponse.json(
        { error: 'Invalid section ID' },
        { status: 400 }
      );
    }

    const assessmentItems = await prisma.assessmentitems.findMany({
      where: {
        assessment: {
          courseOffering: {
            sections: {
              some: {
                id: sectionId,
              },
            },
          },
        },
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
