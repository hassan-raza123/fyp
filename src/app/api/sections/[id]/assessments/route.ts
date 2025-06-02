import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sectionId = parseInt(params.id);
    if (isNaN(sectionId)) {
      return NextResponse.json(
        { error: 'Invalid section ID' },
        { status: 400 }
      );
    }

    const section = await prisma.sections.findUnique({
      where: { id: sectionId },
      select: { courseOfferingId: true },
    });

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    const assessments = await prisma.assessments.findMany({
      where: {
        courseOfferingId: section.courseOfferingId,
        status: 'active',
      },
      include: {
        assessmentItems: {
          orderBy: {
            questionNo: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json(assessments);
  } catch (error) {
    console.error('Error fetching section assessments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch section assessments' },
      { status: 500 }
    );
  }
}
