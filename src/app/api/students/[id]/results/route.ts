import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = parseInt(params.id);
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');

    if (isNaN(studentId) || !sectionId) {
      return NextResponse.json(
        { error: 'Invalid student ID or section ID' },
        { status: 400 }
      );
    }

    // Get the section's course offering ID
    const section = await prisma.sections.findUnique({
      where: { id: parseInt(sectionId) },
      select: { courseOfferingId: true },
    });

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    // Get all assessments for this course offering
    const assessments = await prisma.assessments.findMany({
      where: {
        courseOfferingId: section.courseOfferingId,
        status: 'active',
      },
      include: {
        assessmentItems: true,
      },
    });

    // Get results for each assessment
    const results = await Promise.all(
      assessments.map(async (assessment) => {
        const result = await prisma.studentassessmentresults.findUnique({
          where: {
            studentId_assessmentId: {
              studentId,
              assessmentId: assessment.id,
            },
          },
          include: {
            itemResults: {
              include: {
                assessmentItem: true,
              },
            },
          },
        });

        if (!result) {
          return null;
        }

        return {
          id: result.id,
          studentId: result.studentId,
          assessmentId: assessment.id,
          status: result.status,
          remarks: result.remarks,
          totalMarks: result.totalMarks,
          obtainedMarks: result.obtainedMarks,
          percentage: result.percentage,
          items: result.itemResults.map((item) => ({
            itemId: item.assessmentItemId,
            marks: item.obtainedMarks,
          })),
        };
      })
    );

    // Filter out null results
    const validResults = results.filter(
      (result): result is NonNullable<typeof result> => result !== null
    );

    return NextResponse.json(validResults);
  } catch (error) {
    console.error('Error fetching student results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student results' },
      { status: 500 }
    );
  }
}
