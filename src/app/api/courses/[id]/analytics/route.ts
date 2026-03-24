import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFacultyIdFromRequest } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params;
  try {
    const courseId = await Promise.resolve(parseInt(params.id));

    if (isNaN(courseId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid course ID' },
        { status: 400 }
      );
    }

    // Get logged-in faculty ID
    const facultyId = await getFacultyIdFromRequest(req);
    if (!facultyId) {
      return NextResponse.json(
        { success: false, error: 'Faculty not found or unauthorized' },
        { status: 401 }
      );
    }

    // Get faculty's sections for this course
    const sections = await prisma.sections.findMany({
      where: {
        facultyId: facultyId,
        status: 'active',
        courseOffering: {
          courseId: courseId,
        },
      },
      include: {
        courseOffering: {
          include: {
            semester: {
              select: {
                id: true,
                name: true,
                startDate: true,
                endDate: true,
              },
            },
          },
        },
        _count: {
          select: {
            studentsections: true,
          },
        },
      },
    });

    const courseOfferingIds = sections.map((s) => s.courseOfferingId);

    // Get course details
    const course = await prisma.courses.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Calculate student enrollment trends (by semester)
    const enrollmentTrend = sections.map((section) => ({
      semester: section.courseOffering.semester.name,
      semesterId: section.courseOffering.semester.id,
      enrollment: section._count.studentsections,
      sectionName: section.name,
    }));

    // Get all assessments for this course
    const assessments = await prisma.assessments.findMany({
      where: {
        conductedBy: facultyId,
        courseOfferingId: {
          in: courseOfferingIds,
        },
        status: 'active',
      },
      include: {
        assessmentItems: {
          include: {
            clo: {
              select: {
                id: true,
                code: true,
              },
            },
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

    // Calculate assessment performance by CLO
    const cloPerformanceMap = new Map<
      number,
      {
        cloCode: string;
        totalMarks: number;
        totalObtained: number;
        assessmentCount: number;
        averagePercentage: number;
      }
    >();

    assessments.forEach((assessment) => {
      assessment.assessmentItems.forEach((item) => {
        if (item.cloId) {
          const existing = cloPerformanceMap.get(item.cloId);
          if (existing) {
            existing.totalMarks += item.marks;
            existing.assessmentCount += 1;
          } else {
            cloPerformanceMap.set(item.cloId, {
              cloCode: item.clo?.code || 'N/A',
              totalMarks: item.marks,
              totalObtained: 0, // Will be calculated from results
              assessmentCount: 1,
              averagePercentage: 0,
            });
          }
        }
      });
    });

    // Get assessment results to calculate performance
    const assessmentResults = await prisma.studentassessmentresults.findMany({
      where: {
        assessment: {
          conductedBy: facultyId,
          courseOfferingId: {
            in: courseOfferingIds,
          },
        },
        status: {
          in: ['evaluated', 'published'],
        },
      },
      include: {
        assessment: {
          include: {
            assessmentItems: {
              include: {
                clo: {
                  select: {
                    id: true,
                    code: true,
                  },
                },
              },
            },
          },
        },
        itemResults: {
          include: {
            assessmentItem: {
              include: {
                clo: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Calculate CLO performance from item results
    assessmentResults.forEach((result) => {
      result.itemResults.forEach((itemResult) => {
        const cloId = itemResult.assessmentItem.cloId;
        if (cloId) {
          const existing = cloPerformanceMap.get(cloId);
          if (existing) {
            existing.totalObtained += itemResult.obtainedMarks;
          }
        }
      });
    });

    // Calculate average percentage for each CLO
    const assessmentPerformanceByCLO = Array.from(cloPerformanceMap.entries()).map(
      ([cloId, data]) => {
        const avgPercentage =
          data.totalMarks > 0
            ? (data.totalObtained / data.totalMarks) * 100
            : 0;
        return {
          cloId,
          cloCode: data.cloCode,
          averagePercentage: avgPercentage,
          assessmentCount: data.assessmentCount,
        };
      }
    );

    // Get CLO attainments for overall course performance
    const cloAttainments = await prisma.closattainments.findMany({
      where: {
        clo: {
          courseId: courseId,
        },
        courseOfferingId: {
          in: courseOfferingIds,
        },
        status: 'active',
      },
      include: {
        clo: {
          select: {
            id: true,
            code: true,
          },
        },
      },
    });

    // Calculate overall course performance
    const overallPerformance = {
      totalAssessments: assessments.length,
      totalStudents: sections.reduce(
        (sum, s) => sum + s._count.studentsections,
        0
      ),
      averageCLOAttainment:
        cloAttainments.length > 0
          ? cloAttainments.reduce(
              (sum, ca) => sum + ca.attainmentPercent,
              0
            ) / cloAttainments.length
          : 0,
      attainedCLOs:
        cloAttainments.filter(
          (ca) => ca.attainmentPercent >= ca.threshold
        ).length,
      totalCLOs: cloAttainments.length,
    };

    // Get section-wise performance
    const sectionPerformance = sections.map((section) => {
      const sectionAssessments = assessments.filter(
        (a) => a.courseOfferingId === section.courseOfferingId
      );
      const sectionResults = assessmentResults.filter((r) =>
        sectionAssessments.some((a) => a.id === r.assessmentId)
      );

      const avgPercentage =
        sectionResults.length > 0
          ? sectionResults.reduce((sum, r) => sum + r.percentage, 0) /
            sectionResults.length
          : 0;

      return {
        sectionId: section.id,
        sectionName: section.name,
        semester: section.courseOffering.semester.name,
        enrollment: section._count.studentsections,
        assessmentCount: sectionAssessments.length,
        averagePerformance: avgPercentage,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        course: {
          id: course.id,
          code: course.code,
          name: course.name,
        },
        enrollmentTrend,
        assessmentPerformanceByCLO,
        overallPerformance,
        sectionPerformance,
      },
    });
  } catch (error) {
    console.error('Error fetching course analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch course analytics' },
      { status: 500 }
    );
  }
}

