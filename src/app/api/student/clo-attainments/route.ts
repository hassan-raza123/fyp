import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStudentIdFromRequest } from '@/lib/student-utils';

export async function GET(request: NextRequest) {
  try {
    const studentId = await getStudentIdFromRequest(request);
    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Student not found or unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');

    if (!sectionId) {
      return NextResponse.json(
        { success: false, error: 'Section ID is required' },
        { status: 400 }
      );
    }

    // Verify student is enrolled in this section
    const studentSection = await prisma.studentsections.findFirst({
      where: {
        studentId: studentId,
        sectionId: parseInt(sectionId),
        status: 'active',
      },
      include: {
        section: {
          include: {
            courseOffering: {
              include: {
                course: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                  },
                },
                semester: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!studentSection) {
      return NextResponse.json(
        { success: false, error: 'Not enrolled in this section' },
        { status: 403 }
      );
    }

    const courseOfferingId = studentSection.section.courseOfferingId;
    const sectionIdNum = parseInt(sectionId);

    // Get all CLOs for this course
    const clos = await prisma.clos.findMany({
      where: {
        courseId: studentSection.section.courseOffering.course.id,
        status: 'active',
      },
      orderBy: {
        code: 'asc',
      },
    });

    // Get CLO attainments for this section
    const cloAttainments = await prisma.closattainments.findMany({
      where: {
        courseOfferingId: courseOfferingId,
        sectionId: sectionIdNum,
        status: 'active',
      },
      include: {
        clo: {
          select: {
            id: true,
            code: true,
            description: true,
            bloomLevel: true,
          },
        },
      },
      orderBy: {
        calculatedAt: 'desc',
      },
    });

    // Get latest attainment per CLO
    const latestAttainments = new Map();
    cloAttainments.forEach((attainment) => {
      const cloId = attainment.cloId;
      if (!latestAttainments.has(cloId)) {
        latestAttainments.set(cloId, attainment);
      }
    });

    // Get assessments for this course offering
    const assessments = await prisma.assessments.findMany({
      where: {
        courseOfferingId: courseOfferingId,
        status: {
          in: ['active', 'published'],
        },
      },
      include: {
        assessmentItems: {
          where: {
            cloId: {
              in: clos.map((c) => c.id),
            },
          },
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
    });

    // Get student's assessment results
    const assessmentIds = assessments.map((a) => a.id);
    const studentResults = await prisma.studentassessmentresults.findMany({
      where: {
        studentId: studentId,
        assessmentId: {
          in: assessmentIds,
        },
        status: {
          in: ['evaluated', 'published'],
        },
      },
      include: {
        itemResults: {
          include: {
            assessmentItem: {
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
        assessment: {
          select: {
            id: true,
            title: true,
            type: true,
            dueDate: true,
          },
        },
      },
    });

    // Calculate student's CLO attainments
    const studentCLOAttainments = clos.map((clo) => {
      const attainment = latestAttainments.get(clo.id);
      
      // Get assessment items for this CLO
      const cloItems = assessments.flatMap((a) =>
        a.assessmentItems.filter((item) => item.cloId === clo.id)
      );

      // Calculate student's marks for this CLO
      let studentObtainedMarks = 0;
      let totalPossibleMarks = 0;
      const assessmentBreakdown: any[] = [];

      assessments.forEach((assessment) => {
        const cloItemsInAssessment = assessment.assessmentItems.filter(
          (item) => item.cloId === clo.id
        );
        if (cloItemsInAssessment.length === 0) return;

        const assessmentTotalMarks = cloItemsInAssessment.reduce(
          (sum, item) => sum + item.marks,
          0
        );
        totalPossibleMarks += assessmentTotalMarks;

        const result = studentResults.find(
          (r) => r.assessmentId === assessment.id
        );
        if (result) {
          const obtainedMarks = result.itemResults
            .filter((ir) =>
              cloItemsInAssessment.some(
                (item) => item.id === ir.assessmentItem.id
              )
            )
            .reduce((sum, ir) => sum + ir.obtainedMarks, 0);

          studentObtainedMarks += obtainedMarks;

          assessmentBreakdown.push({
            assessmentId: assessment.id,
            assessmentTitle: assessment.title,
            assessmentType: assessment.type,
            dueDate: assessment.dueDate,
            totalMarks: assessmentTotalMarks,
            obtainedMarks: obtainedMarks,
            percentage:
              assessmentTotalMarks > 0
                ? (obtainedMarks / assessmentTotalMarks) * 100
                : 0,
          });
        }
      });

      const studentAttainmentPercent =
        totalPossibleMarks > 0
          ? (studentObtainedMarks / totalPossibleMarks) * 100
          : 0;

      // Get class average from attainment record
      const classAttainmentPercent = attainment?.attainmentPercent || 0;
      const threshold = attainment?.threshold || 60;

      return {
        clo: {
          id: clo.id,
          code: clo.code,
          description: clo.description,
          bloomLevel: clo.bloomLevel,
        },
        studentAttainment: {
          percentage: parseFloat(studentAttainmentPercent.toFixed(2)),
          obtainedMarks: parseFloat(studentObtainedMarks.toFixed(1)),
          totalMarks: parseFloat(totalPossibleMarks.toFixed(1)),
          status:
            studentAttainmentPercent >= threshold ? 'attained' : 'not_attained',
        },
        classAttainment: attainment
          ? {
              percentage: attainment.attainmentPercent,
              threshold: attainment.threshold,
              status: attainment.status,
              calculatedAt: attainment.calculatedAt,
            }
          : null,
        assessmentBreakdown,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        section: {
          id: studentSection.section.id,
          name: studentSection.section.name,
          course: studentSection.section.courseOffering.course,
          semester: studentSection.section.courseOffering.semester,
        },
        cloAttainments: studentCLOAttainments,
      },
    });
  } catch (error) {
    console.error('Error fetching student CLO attainments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch CLO attainments' },
      { status: 500 }
    );
  }
}

