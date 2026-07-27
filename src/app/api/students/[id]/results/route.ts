import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  authorize,
  canAccessStudent,
  canAccessSection,
  forbidden,
} from '@/lib/authz';

export async function GET(
  request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params;
  try {
    const auth = await authorize(request, [
      'super_admin',
      'admin',
      'faculty',
      'student',
    ]);
    if (!auth.ok) return auth.response;

    const studentId = parseInt(params.id);
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');

    if (isNaN(studentId) || !sectionId) {
      return NextResponse.json(
        { error: 'Invalid student ID or section ID' },
        { status: 400 }
      );
    }

    const parsedSectionId = parseInt(sectionId);
    if (isNaN(parsedSectionId)) {
      return NextResponse.json({ error: 'Invalid section ID' }, { status: 400 });
    }

    // Two independent checks: the caller must be allowed to see this student's
    // records *and* to see this section. A student passes only for their own
    // records in a section they are enrolled in.
    const [allowedStudent, allowedSection] = await Promise.all([
      canAccessStudent(request, auth.user, studentId),
      canAccessSection(request, auth.user, parsedSectionId),
    ]);

    if (!allowedStudent || !allowedSection) {
      return forbidden('You do not have access to these results').response;
    }

    // Get the section's course offering ID
    const section = await prisma.sections.findUnique({
      where: { id: parsedSectionId },
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
