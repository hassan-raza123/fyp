import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStudentIdFromRequest } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params;
  try {
    const courseId = parseInt(params.id);
    if (isNaN(courseId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid course ID' },
        { status: 400 }
      );
    }

    const studentId = await getStudentIdFromRequest(req);
    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Student not found or unauthorized' },
        { status: 401 }
      );
    }

    // Verify student is enrolled in this course
    const studentSection = await prisma.studentsections.findFirst({
      where: {
        studentId: studentId,
        status: 'active',
        section: {
          courseOffering: {
            courseId: courseId,
          },
        },
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
        { success: false, error: 'Not enrolled in this course' },
        { status: 403 }
      );
    }

    const courseOfferingId = studentSection.section.courseOfferingId;
    const sectionId = studentSection.sectionId;

    // Get all assessments for this course offering
    const assessments = await prisma.assessments.findMany({
      where: {
        courseOfferingId: courseOfferingId,
        status: {
          in: ['active', 'completed'],
        },
      },
      include: {
        assessmentItems: {
          include: {
            clo: {
              select: {
                id: true,
                code: true,
                description: true,
              },
            },
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    // Get student's assessment results
    const assessmentResults = await prisma.studentassessmentresults.findMany({
      where: {
        studentId: studentId,
        assessmentId: {
          in: assessments.map((a) => a.id),
        },
      },
      include: {
        assessment: {
          select: {
            id: true,
            title: true,
            type: true,
            totalMarks: true,
            dueDate: true,
          },
        },
      },
    });

    // Calculate performance metrics
    const completedAssessments = assessmentResults.filter(
      (r) => r.status === 'evaluated' || r.status === 'published'
    );
    const averagePercentage =
      completedAssessments.length > 0
        ? completedAssessments.reduce((sum, r) => sum + r.percentage, 0) /
          completedAssessments.length
        : 0;

    // Get CLO attainments for this student
    const cloAttainments = await prisma.closattainments.findMany({
      where: {
        courseOfferingId: courseOfferingId,
        status: 'active',
      },
      include: {
        clo: {
          select: {
            id: true,
            code: true,
            description: true,
          },
        },
      },
      orderBy: {
        calculatedAt: 'desc',
      },
    });

    // Get latest CLO attainment per CLO
    const latestCLOAttainments = new Map();
    cloAttainments.forEach((attainment) => {
      const cloId = attainment.cloId;
      if (!latestCLOAttainments.has(cloId)) {
        latestCLOAttainments.set(cloId, attainment);
      }
    });

    // Assessment-wise performance
    const assessmentPerformance = assessments.map((assessment) => {
      const result = assessmentResults.find(
        (r) => r.assessmentId === assessment.id
      );
      return {
        id: assessment.id,
        title: assessment.title,
        type: assessment.type,
        totalMarks: assessment.totalMarks,
        dueDate: assessment.dueDate,
        obtainedMarks: result?.obtainedMarks || 0,
        percentage: result?.percentage || 0,
        status: result?.status || 'not_submitted',
      };
    });

    // CLO-wise performance
    const cloPerformance = Array.from(latestCLOAttainments.values()).map(
      (attainment) => ({
        cloId: attainment.cloId,
        cloCode: attainment.clo.code,
        cloDescription: attainment.clo.description,
        attainmentPercent: attainment.attainmentPercent,
        threshold: attainment.threshold,
        status: attainment.status,
      })
    );

    // Get course grade if available
    const grade = await prisma.studentgrades.findFirst({
      where: {
        studentId: studentId,
        courseOfferingId: courseOfferingId,
        status: 'active',
      },
      select: {
        grade: true,
        percentage: true,
        gpaPoints: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        course: {
          id: studentSection.section.courseOffering.course.id,
          code: studentSection.section.courseOffering.course.code,
          name: studentSection.section.courseOffering.course.name,
        },
        semester: studentSection.section.courseOffering.semester.name,
        overallPerformance: {
          averagePercentage: parseFloat(averagePercentage.toFixed(2)),
          totalAssessments: assessments.length,
          completedAssessments: completedAssessments.length,
          currentGrade: grade?.grade || null,
          currentPercentage: grade?.percentage || null,
          gpaPoints: grade?.gpaPoints || null,
        },
        assessmentPerformance,
        cloPerformance,
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

