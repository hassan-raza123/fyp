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

    const results = await prisma.studentassessmentresults.findMany({
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
        student: true,
        itemResults: {
          include: {
            assessmentItem: true,
          },
        },
      },
    });

    // Shape expected by CLOAttainments: items as { itemId, marks, totalMarks }[]
    const shaped = results.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      obtainedMarks: r.obtainedMarks,
      totalMarks: r.totalMarks,
      items: (r.itemResults || []).map((ir) => ({
        itemId: ir.assessmentItemId,
        marks: ir.obtainedMarks,
        totalMarks: ir.totalMarks,
      })),
    }));

    return NextResponse.json(shaped);
  } catch (error) {
    console.error('Error fetching assessment results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessment results' },
      { status: 500 }
    );
  }
}
