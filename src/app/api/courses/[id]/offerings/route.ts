import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFacultyIdFromRequest } from '@/lib/faculty-utils';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get course offerings for this course where faculty teaches
    const courseOfferings = await prisma.courseofferings.findMany({
      where: {
        courseId: courseId,
        sections: {
          some: {
            facultyId: facultyId,
            status: 'active',
          },
        },
      },
      include: {
        semester: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        },
        sections: {
          where: {
            facultyId: facultyId,
            status: 'active',
          },
          include: {
            batch: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: {
                studentsections: true,
              },
            },
          },
        },
        course: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        _count: {
          select: {
            assessments: {
              where: {
                conductedBy: facultyId,
                status: 'active',
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate section-wise performance
    const offeringsWithPerformance = await Promise.all(
      courseOfferings.map(async (offering) => {
        const sectionIds = offering.sections.map((s) => s.id);

        // Get assessment results for these sections
        const results = await prisma.studentassessmentresults.findMany({
          where: {
            assessment: {
              courseOfferingId: offering.id,
              conductedBy: facultyId,
            },
            student: {
              studentsections: {
                some: {
                  sectionId: {
                    in: sectionIds,
                  },
                },
              },
            },
            status: {
              in: ['evaluated', 'published'],
            },
          },
          select: {
            percentage: true,
            student: {
              select: {
                studentsections: {
                  where: {
                    sectionId: {
                      in: sectionIds,
                    },
                  },
                  select: {
                    sectionId: true,
                  },
                },
              },
            },
          },
        });

        // Calculate performance per section
        const sectionPerformance = offering.sections.map((section) => {
          const sectionResults = results.filter((r) =>
            r.student.studentsections.some((ss) => ss.sectionId === section.id)
          );

          const avgPerformance =
            sectionResults.length > 0
              ? sectionResults.reduce((sum, r) => sum + r.percentage, 0) /
                sectionResults.length
              : 0;

          return {
            ...section,
            averagePerformance: avgPerformance,
            totalAssessments: offering._count.assessments,
          };
        });

        return {
          id: offering.id,
          semester: offering.semester,
          status: offering.status,
          sections: sectionPerformance.map((s) => ({
            id: s.id,
            name: s.name,
            batch: s.batch,
            currentStudents: s._count.studentsections,
            averagePerformance: s.averagePerformance,
            totalAssessments: s.totalAssessments,
          })),
          totalAssessments: offering._count.assessments,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: offeringsWithPerformance,
    });
  } catch (error) {
    console.error('Error fetching course offerings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch course offerings' },
      { status: 500 }
    );
  }
}
