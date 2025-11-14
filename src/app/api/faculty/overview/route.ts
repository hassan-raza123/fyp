import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFacultyIdFromRequest } from '@/lib/faculty-utils';

export async function GET(request: NextRequest) {
  try {
    // Get logged-in faculty ID
    const facultyId = await getFacultyIdFromRequest(request);
    if (!facultyId) {
      return NextResponse.json(
        { success: false, error: 'Faculty not found or unauthorized' },
        { status: 401 }
      );
    }

    // Get faculty's sections
    const sections = await prisma.sections.findMany({
      where: {
        facultyId: facultyId,
        status: 'active',
      },
      include: {
        courseOffering: {
          include: {
            course: true,
            semester: true,
          },
        },
      },
    });

    // Get unique courses from sections
    const courseIds = [
      ...new Set(sections.map((s) => s.courseOffering.courseId)),
    ];

    // Get total students from faculty's sections (count distinct students)
    const studentSections = await prisma.studentsections.findMany({
      where: {
        section: {
          facultyId: facultyId,
          status: 'active',
        },
      },
      select: {
        studentId: true,
      },
    });
    const uniqueStudentIds = new Set(studentSections.map((ss) => ss.studentId));
    const totalStudents = uniqueStudentIds.size;

    // Get total courses (unique courses from sections)
    const totalCourses = courseIds.length;

    // Get total sections
    const totalSections = sections.length;

    // Get active assessments
    const activeAssessments = await prisma.assessments.count({
      where: {
        conductedBy: facultyId,
        status: 'active',
      },
    });

    // Get recent activities (assessments created in last 7 days)
    const recentAssessments = await prisma.assessments.findMany({
      where: {
        conductedBy: facultyId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
      include: {
        courseOffering: {
          include: {
            course: true,
          },
        },
      },
    });

    // Format recent activities
    const recentActivities = recentAssessments.map((assessment) => ({
      id: assessment.id.toString(),
      summary: `Created assessment: ${assessment.title}`,
      createdAt: assessment.createdAt.toISOString(),
      user: 'You',
      course: assessment.courseOffering.course.name,
    }));

    // Get current semester (if any active section has a semester)
    const currentSemester = sections[0]?.courseOffering?.semester || null;

    // Get upcoming assessments (due in next 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const now = new Date();

    const upcomingAssessments = await prisma.assessments.findMany({
      where: {
        conductedBy: facultyId,
        status: 'active',
        dueDate: {
          gte: now,
          lte: sevenDaysFromNow,
        },
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
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
      take: 5,
    });

    // Get overdue assessments
    const overdueAssessments = await prisma.assessments.findMany({
      where: {
        conductedBy: facultyId,
        status: 'active',
        dueDate: {
          lt: now,
        },
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
          },
        },
      },
      take: 5,
    });

    // Get course offering IDs for faculty's sections
    const courseOfferingIds = sections.map((s) => s.courseOfferingId);

    // Get pending evaluations count (assessments with pending results)
    const pendingEvaluations = await prisma.studentassessmentresults.count({
      where: {
        assessment: {
          conductedBy: facultyId,
          courseOfferingId: {
            in: courseOfferingIds,
          },
        },
        status: 'pending',
      },
    });

    // Get assessments without any results (pending marks entry)
    const assessmentsWithResults =
      await prisma.studentassessmentresults.findMany({
        where: {
          assessment: {
            conductedBy: facultyId,
            courseOfferingId: {
              in: courseOfferingIds,
            },
          },
        },
        select: {
          assessmentId: true,
        },
        distinct: ['assessmentId'],
      });

    const assessedIds = assessmentsWithResults.map((r) => r.assessmentId);
    const pendingMarksEntry = await prisma.assessments.count({
      where: {
        conductedBy: facultyId,
        courseOfferingId: {
          in: courseOfferingIds,
        },
        status: 'active',
        id: {
          notIn: assessedIds.length > 0 ? assessedIds : [-1], // Use -1 if empty to get all
        },
      },
    });

    // Get CLO attainments summary
    const cloAttainments = await prisma.closattainments.findMany({
      where: {
        calculator: {
          id: facultyId,
        },
        status: 'active',
      },
      include: {
        clo: {
          select: {
            code: true,
            description: true,
          },
        },
        courseOffering: {
          include: {
            course: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        calculatedAt: 'desc',
      },
      take: 10,
    });

    // Calculate overall CLO attainment percentage
    const totalCLOs = cloAttainments.length;
    const attainedCLOs = cloAttainments.filter(
      (clo) => clo.attainmentPercent >= clo.threshold
    ).length;
    const overallCLOAttainment =
      totalCLOs > 0 ? (attainedCLOs / totalCLOs) * 100 : 0;

    // Get courses with low CLO attainment (< threshold)
    const lowAttainmentCourses = cloAttainments
      .filter((clo) => clo.attainmentPercent < clo.threshold)
      .map((clo) => ({
        courseCode: clo.courseOffering.course.code,
        courseName: clo.courseOffering.course.name,
        cloCode: clo.clo.code,
        attainment: clo.attainmentPercent,
        threshold: clo.threshold,
      }));

    // Get student performance alerts (students with low performance)
    // Get students from faculty's sections with low grades
    const studentResults = await prisma.studentassessmentresults.findMany({
      where: {
        assessment: {
          conductedBy: facultyId,
          courseOfferingId: {
            in: courseOfferingIds,
          },
        },
        percentage: {
          lt: 50, // Below 50%
        },
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
        assessment: {
          include: {
            courseOffering: {
              include: {
                course: {
                  select: {
                    code: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        percentage: 'asc',
      },
      take: 5,
    });

    // Get top performers
    const topPerformers = await prisma.studentassessmentresults.findMany({
      where: {
        assessment: {
          conductedBy: facultyId,
          courseOfferingId: {
            in: courseOfferingIds,
          },
        },
        percentage: {
          gte: 85, // Above 85%
        },
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
        assessment: {
          include: {
            courseOffering: {
              include: {
                course: {
                  select: {
                    code: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        percentage: 'desc',
      },
      take: 5,
    });

    // Get recent grading activity (last graded assessments)
    // First get all evaluated results
    const allEvaluatedResults = await prisma.studentassessmentresults.findMany({
      where: {
        assessment: {
          conductedBy: facultyId,
          courseOfferingId: {
            in: courseOfferingIds,
          },
        },
        evaluatedAt: {
          not: null,
        },
        status: {
          in: ['evaluated', 'published'],
        },
      },
      include: {
        assessment: {
          include: {
            courseOffering: {
              include: {
                course: {
                  select: {
                    code: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        evaluatedAt: 'desc',
      },
    });

    // Group by assessment and get latest evaluation time
    const assessmentMap = new Map<
      number,
      {
        assessmentId: number;
        assessmentTitle: string;
        courseCode: string;
        courseName: string;
        evaluatedAt: Date | null;
        status: string;
      }
    >();

    allEvaluatedResults.forEach((result) => {
      if (!assessmentMap.has(result.assessmentId)) {
        assessmentMap.set(result.assessmentId, {
          assessmentId: result.assessmentId,
          assessmentTitle: result.assessment.title,
          courseCode: result.assessment.courseOffering.course.code,
          courseName: result.assessment.courseOffering.course.name,
          evaluatedAt: result.evaluatedAt,
          status: result.status,
        });
      }
    });

    const recentGradingActivity = Array.from(assessmentMap.values())
      .sort((a, b) => {
        if (!a.evaluatedAt) return 1;
        if (!b.evaluatedAt) return -1;
        return b.evaluatedAt.getTime() - a.evaluatedAt.getTime();
      })
      .slice(0, 5);

    // Calculate average class performance
    const allResults = await prisma.studentassessmentresults.findMany({
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
      select: {
        percentage: true,
      },
    });

    const averageClassPerformance =
      allResults.length > 0
        ? allResults.reduce((sum, r) => sum + r.percentage, 0) /
          allResults.length
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalStudents,
          totalCourses,
          totalSections,
          activeAssessments,
        },
        recentActivities,
        currentSemester: currentSemester
          ? {
              name: currentSemester.name || 'N/A',
              startDate: currentSemester.startDate?.toISOString() || null,
              endDate: currentSemester.endDate?.toISOString() || null,
            }
          : null,
        upcomingAssessments: upcomingAssessments.map((assessment) => ({
          id: assessment.id,
          title: assessment.title,
          type: assessment.type,
          dueDate: assessment.dueDate?.toISOString() || null,
          course: {
            code: assessment.courseOffering.course.code,
            name: assessment.courseOffering.course.name,
          },
        })),
        overdueAssessments: overdueAssessments.map((assessment) => ({
          id: assessment.id,
          title: assessment.title,
          type: assessment.type,
          dueDate: assessment.dueDate?.toISOString() || null,
          course: {
            code: assessment.courseOffering.course.code,
            name: assessment.courseOffering.course.name,
          },
        })),
        pendingWork: {
          pendingEvaluations,
          pendingMarksEntry,
          totalPending: pendingEvaluations + pendingMarksEntry,
        },
        cloAttainmentSummary: {
          overallAttainment: overallCLOAttainment,
          totalCLOs,
          attainedCLOs,
          lowAttainmentCourses: lowAttainmentCourses.slice(0, 5), // Top 5
        },
        studentAlerts: {
          atRiskStudents: studentResults.map((result) => ({
            studentId: result.studentId,
            studentName: `${result.student.user.first_name} ${result.student.user.last_name}`,
            rollNumber: result.student.rollNumber,
            course: {
              code: result.assessment.courseOffering.course.code,
              name: result.assessment.courseOffering.course.name,
            },
            assessment: result.assessment.title,
            percentage: result.percentage,
          })),
          topPerformers: topPerformers.map((result) => ({
            studentId: result.studentId,
            studentName: `${result.student.user.first_name} ${result.student.user.last_name}`,
            rollNumber: result.student.rollNumber,
            course: {
              code: result.assessment.courseOffering.course.code,
              name: result.assessment.courseOffering.course.name,
            },
            assessment: result.assessment.title,
            percentage: result.percentage,
          })),
          averageClassPerformance,
        },
        recentGradingActivity: recentGradingActivity.map((activity) => ({
          assessmentId: activity.assessmentId,
          assessmentTitle: activity.assessmentTitle,
          course: {
            code: activity.courseCode,
            name: activity.courseName,
          },
          evaluatedAt: activity.evaluatedAt?.toISOString() || null,
          status: activity.status,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching faculty overview:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch overview',
      },
      { status: 500 }
    );
  }
}
