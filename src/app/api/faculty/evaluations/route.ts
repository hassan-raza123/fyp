import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFacultyIdFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const facultyId = await getFacultyIdFromRequest(req);
    if (!facultyId) {
      return NextResponse.json(
        { success: false, error: 'Faculty not found or unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // pending, evaluated, published

    // Get faculty's sections
    const sections = await prisma.sections.findMany({
      where: {
        facultyId: facultyId,
        status: 'active',
      },
      select: {
        id: true,
        courseOfferingId: true,
      },
    });

    const courseOfferingIds = sections.map((s) => s.courseOfferingId);

    // Get assessments for faculty
    const assessments = await prisma.assessments.findMany({
      where: {
        conductedBy: facultyId,
        courseOfferingId: {
          in: courseOfferingIds,
        },
        ...(status && { status: status as any }),
      },
      include: {
        courseOffering: {
          include: {
            course: {
              select: {
                code: true,
                name: true,
              },
            },
            semester: {
              select: {
                name: true,
              },
            },
            sections: {
              where: {
                facultyId: facultyId,
                status: 'active',
              },
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            studentResults: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get evaluation statistics for each assessment
    const assessmentsWithStats = await Promise.all(
      assessments.map(async (assessment) => {
        const sectionIds = assessment.courseOffering.sections.map((s) => s.id);

        // Get students in these sections
        const studentSections = await prisma.studentsections.findMany({
          where: {
            sectionId: {
              in: sectionIds,
            },
            status: 'active',
          },
          select: {
            studentId: true,
          },
        });

        const studentIds = studentSections.map((ss) => ss.studentId);

        // Get results for this assessment
        const results = await prisma.studentassessmentresults.findMany({
          where: {
            assessmentId: assessment.id,
            studentId: {
              in: studentIds,
            },
          },
        });

        const pendingCount = results.filter(
          (r) => r.status === 'pending'
        ).length;
        const evaluatedCount = results.filter(
          (r) => r.status === 'evaluated'
        ).length;
        const publishedCount = results.filter(
          (r) => r.status === 'published'
        ).length;
        const totalStudents = studentIds.length;

        return {
          id: assessment.id,
          title: assessment.title,
          type: assessment.type,
          totalMarks: assessment.totalMarks,
          dueDate: assessment.dueDate,
          status: assessment.status,
          course: assessment.courseOffering.course,
          semester: assessment.courseOffering.semester,
          sections: assessment.courseOffering.sections,
          statistics: {
            totalStudents,
            pendingCount,
            evaluatedCount,
            publishedCount,
            completionRate:
              totalStudents > 0
                ? ((evaluatedCount + publishedCount) / totalStudents) * 100
                : 0,
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: assessmentsWithStats,
    });
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch evaluations' },
      { status: 500 }
    );
  }
}
