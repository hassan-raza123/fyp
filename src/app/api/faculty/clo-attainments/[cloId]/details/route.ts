import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFacultyIdFromRequest } from '@/lib/auth';

// GET - Get detailed CLO attainment information
export async function GET(
  req: NextRequest,
  { params: _params }: { params: Promise<{ cloId: string }> }
) {
  const params = await _params;
  try {
    const cloId = parseInt(params.cloId);
    if (isNaN(cloId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid CLO ID' },
        { status: 400 }
      );
    }

    const facultyId = await getFacultyIdFromRequest(req);
    if (!facultyId) {
      return NextResponse.json(
        { success: false, error: 'Faculty not found or unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const courseOfferingId = searchParams.get('courseOfferingId');

    // Get CLO
    const clo = await prisma.clos.findUnique({
      where: { id: cloId },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    if (!clo) {
      return NextResponse.json(
        { success: false, error: 'CLO not found' },
        { status: 404 }
      );
    }

    // Get faculty's sections for this course
    const sections = await prisma.sections.findMany({
      where: {
        facultyId: facultyId,
        status: 'active',
        courseOffering: {
          courseId: clo.courseId,
          ...(courseOfferingId && { id: parseInt(courseOfferingId) }),
        },
      },
      include: {
        courseOffering: {
          include: {
            semester: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const courseOfferingIds = sections.map((s) => s.courseOfferingId);

    // Get CLO attainments
    const attainments = await prisma.closattainments.findMany({
      where: {
        cloId: cloId,
        courseOfferingId: {
          in: courseOfferingIds,
        },
        status: 'active',
      },
      include: {
        courseOffering: {
          include: {
            semester: {
              select: {
                name: true,
              },
            },
            sections: {
              where: {
                facultyId: facultyId,
              },
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        calculatedAt: 'desc',
      },
    });

    // Get assessments mapped to this CLO
    const assessments = await prisma.assessments.findMany({
      where: {
        courseOfferingId: {
          in: courseOfferingIds,
        },
        conductedBy: facultyId,
        assessmentItems: {
          some: {
            cloId: cloId,
          },
        },
      },
      include: {
        assessmentItems: {
          where: {
            cloId: cloId,
          },
          select: {
            id: true,
            questionNo: true,
            description: true,
            marks: true,
          },
        },
        courseOffering: {
          include: {
            semester: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Get student-wise breakdown for latest attainment
    let studentBreakdown: any[] = [];
    if (attainments.length > 0) {
      const latestAttainment = attainments[0];
      const sectionIds = latestAttainment.courseOffering.sections.map(
        (s) => s.id
      );

      // Get students in these sections
      const studentSections = await prisma.studentsections.findMany({
        where: {
          sectionId: {
            in: sectionIds,
          },
          status: 'active',
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  first_name: true,
                  last_name: true,
                },
              },
            },
          },
        },
      });

      // Get assessment results for CLO items
      const assessmentIds = assessments.map((a) => a.id);
      const itemIds = assessments.flatMap((a) =>
        a.assessmentItems.map((item) => item.id)
      );

      // First get the student assessment results
      const studentAssessmentResults =
        await prisma.studentassessmentresults.findMany({
          where: {
            studentId: {
              in: studentSections.map((ss) => ss.studentId),
            },
            assessmentId: {
              in: assessmentIds,
            },
            status: {
              in: ['evaluated', 'published'],
            },
          },
          select: {
            id: true,
            studentId: true,
            assessmentId: true,
          },
        });

      const resultIds = studentAssessmentResults.map((r) => r.id);

      // Then get item results
      const itemResults = await prisma.studentassessmentitemresults.findMany({
        where: {
          assessmentItemId: {
            in: itemIds,
          },
          studentAssessmentResultId: {
            in: resultIds,
          },
        },
        include: {
          assessmentItem: {
            select: {
              id: true,
              marks: true,
              cloId: true,
            },
          },
        },
      });

      // Create a map of resultId to studentId
      const resultIdToStudentId = new Map<number, number>();
      studentAssessmentResults.forEach((r) => {
        resultIdToStudentId.set(r.id, r.studentId);
      });

      // Calculate per-student CLO performance
      const studentPerformance = new Map<
        number,
        { obtained: number; total: number; items: number }
      >();

      itemResults.forEach((itemResult) => {
        const studentId = resultIdToStudentId.get(
          itemResult.studentAssessmentResultId
        );
        if (!studentId) return;

        // Only count items for this CLO
        if (itemResult.assessmentItem.cloId !== cloId) return;

        if (!studentPerformance.has(studentId)) {
          studentPerformance.set(studentId, {
            obtained: 0,
            total: 0,
            items: 0,
          });
        }
        const perf = studentPerformance.get(studentId)!;
        perf.obtained += itemResult.obtainedMarks;
        perf.total += itemResult.assessmentItem.marks;
        perf.items++;
      });

      studentBreakdown = studentSections.map((ss) => {
        const perf = studentPerformance.get(ss.studentId) || {
          obtained: 0,
          total: 0,
          items: 0,
        };
        const percentage =
          perf.total > 0 ? (perf.obtained / perf.total) * 100 : 0;
        const achieved = percentage >= latestAttainment.threshold;

        return {
          studentId: ss.student.id,
          rollNumber: ss.student.rollNumber,
          name: `${ss.student.user.first_name} ${ss.student.user.last_name}`,
          obtainedMarks: perf.obtained,
          totalMarks: perf.total,
          percentage,
          achieved,
          itemsCount: perf.items,
        };
      });
    }

    // Assessment-wise breakdown
    const assessmentBreakdown = await Promise.all(
      assessments.map(async (assessment) => {
        // Get items for this CLO from this assessment
        const assessmentItems = await prisma.assessmentitems.findMany({
          where: {
            assessmentId: assessment.id,
            cloId: cloId,
          },
          select: {
            id: true,
            questionNo: true,
            description: true,
            marks: true,
          },
        });

        const totalMarks = assessmentItems.reduce(
          (sum, item) => sum + item.marks,
          0
        );

        return {
          assessmentId: assessment.id,
          title: assessment.title,
          type: assessment.type,
          semester: assessment.courseOffering.semester.name,
          totalMarks,
          itemCount: assessmentItems.length,
          items: assessmentItems.map((item) => ({
            id: item.id,
            questionNo: item.questionNo,
            description: item.description,
            marks: item.marks,
          })),
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        clo: {
          id: clo.id,
          code: clo.code,
          description: clo.description,
          bloomLevel: clo.bloomLevel,
          course: clo.course,
        },
        attainments: attainments.map((a) => ({
          id: a.id,
          courseOfferingId: a.courseOfferingId,
          semester: a.courseOffering.semester.name,
          sections: a.courseOffering.sections.map((s) => ({
            id: s.id,
            name: s.name,
          })),
          totalStudents: a.totalStudents,
          studentsAchieved: a.studentsAchieved,
          threshold: a.threshold,
          attainmentPercent: a.attainmentPercent,
          status:
            a.attainmentPercent >= a.threshold ? 'attained' : 'not_attained',
          calculatedAt: a.calculatedAt.toISOString(),
        })),
        assessmentBreakdown,
        studentBreakdown,
      },
    });
  } catch (error) {
    console.error('Error fetching CLO attainment details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch CLO attainment details' },
      { status: 500 }
    );
  }
}
