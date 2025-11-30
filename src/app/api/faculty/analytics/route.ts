import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFacultyIdFromRequest } from '@/lib/auth';

// GET - Get comprehensive analytics for faculty
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
    const type = searchParams.get('type'); // performance, clo, student, assessment
    const courseId = searchParams.get('courseId');
    const sectionId = searchParams.get('sectionId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Get faculty's sections
    const sections = await prisma.sections.findMany({
      where: {
        facultyId: facultyId,
        status: 'active',
        ...(sectionId && { id: parseInt(sectionId) }),
        courseOffering: {
          ...(courseId && { courseId: parseInt(courseId) }),
        },
      },
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
        _count: {
          select: {
            studentsections: true,
          },
        },
      },
    });

    const sectionIds = sections.map((s) => s.id);
    const courseOfferingIds = sections.map((s) => s.courseOfferingId);

    // Get assessments
    const assessments = await prisma.assessments.findMany({
      where: {
        courseOfferingId: {
          in: courseOfferingIds,
        },
        conductedBy: facultyId,
        ...(startDate &&
          endDate && {
            createdAt: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }),
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
      },
    });

    // Get assessment results
    const assessmentResults = await prisma.studentassessmentresults.findMany({
      where: {
        assessmentId: {
          in: assessments.map((a) => a.id),
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
          select: {
            id: true,
            title: true,
            type: true,
            totalMarks: true,
            courseOfferingId: true,
          },
        },
        itemResults: {
          include: {
            assessmentItem: {
              select: {
                id: true,
                marks: true,
                cloId: true,
              },
            },
          },
        },
      },
    });

    // Get CLO attainments
    const cloAttainments = await prisma.closattainments.findMany({
      where: {
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
            description: true,
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
      orderBy: {
        calculatedAt: 'desc',
      },
    });

    // Performance Analytics
    const performanceAnalytics = calculatePerformanceAnalytics(
      sections,
      assessments,
      assessmentResults
    );

    // CLO Analytics
    const cloAnalytics = calculateCLOAnalytics(cloAttainments, assessments);

    // Student Analytics
    const studentAnalytics = calculateStudentAnalytics(
      assessmentResults,
      sections
    );

    // Assessment Analytics
    const assessmentAnalytics = calculateAssessmentAnalytics(
      assessments,
      assessmentResults
    );

    return NextResponse.json({
      success: true,
      data: {
        performance: performanceAnalytics,
        clo: cloAnalytics,
        student: studentAnalytics,
        assessment: assessmentAnalytics,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

function calculatePerformanceAnalytics(
  sections: any[],
  assessments: any[],
  results: any[]
) {
  // Overall course performance
  const coursePerformance = new Map<
    number,
    {
      courseId: number;
      courseCode: string;
      courseName: string;
      totalStudents: number;
      totalAssessments: number;
      averagePercentage: number;
      sections: any[];
    }
  >();

  sections.forEach((section) => {
    const courseId = section.courseOffering.course.id;
    if (!coursePerformance.has(courseId)) {
      coursePerformance.set(courseId, {
        courseId,
        courseCode: section.courseOffering.course.code,
        courseName: section.courseOffering.course.name,
        totalStudents: 0,
        totalAssessments: 0,
        averagePercentage: 0,
        sections: [],
      });
    }
    const course = coursePerformance.get(courseId)!;
    course.totalStudents += section._count.studentsections;
    course.sections.push({
      id: section.id,
      name: section.name,
      semester: section.courseOffering.semester.name,
      enrollment: section._count.studentsections,
    });
  });

  // Calculate averages
  coursePerformance.forEach((course) => {
    const courseAssessments = assessments.filter(
      (a) =>
        sections.some(
          (s) =>
            s.courseOffering.course.id === course.courseId &&
            s.courseOfferingId === a.courseOfferingId
        )
    );
    course.totalAssessments = courseAssessments.length;

    const courseResults = results.filter((r) =>
      courseAssessments.some((a) => a.id === r.assessmentId)
    );
    course.averagePercentage =
      courseResults.length > 0
        ? courseResults.reduce((sum, r) => sum + r.percentage, 0) /
          courseResults.length
        : 0;
  });

  // Section-wise comparison
  const sectionComparison = sections.map((section) => {
    const sectionAssessments = assessments.filter(
      (a) => a.courseOfferingId === section.courseOfferingId
    );
    const sectionResults = results.filter((r) =>
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
      course: section.courseOffering.course,
      semester: section.courseOffering.semester.name,
      enrollment: section._count.studentsections,
      assessmentCount: sectionAssessments.length,
      averagePercentage: avgPercentage,
    };
  });

  // Student performance trends (by semester)
  const studentTrends = new Map<number, Array<{ semester: string; average: number }>>();
  results.forEach((result) => {
    const section = sections.find((s) => {
      const assessment = assessments.find((a) => a.id === result.assessmentId);
      return assessment && s.courseOfferingId === assessment.courseOfferingId;
    });
    if (!section) return;

    const semester = section.courseOffering.semester.name;
    if (!studentTrends.has(result.studentId)) {
      studentTrends.set(result.studentId, []);
    }
    const trends = studentTrends.get(result.studentId)!;
    const existing = trends.find((t) => t.semester === semester);
    if (existing) {
      existing.average = (existing.average + result.percentage) / 2;
    } else {
      trends.push({ semester, average: result.percentage });
    }
  });

  return {
    overall: Array.from(coursePerformance.values()),
    sectionComparison,
    studentTrends: Array.from(studentTrends.entries()).map(([studentId, trends]) => ({
      studentId,
      trends,
    })),
  };
}

function calculateCLOAnalytics(cloAttainments: any[], assessments: any[]) {
  // Group by CLO
  const cloMap = new Map<
    number,
    {
      cloId: number;
      cloCode: string;
      description: string;
      attainments: number[];
      average: number;
      latest: number | null;
      trend: 'improving' | 'declining' | 'stable';
    }
  >();

  cloAttainments.forEach((attainment) => {
    if (!cloMap.has(attainment.cloId)) {
      cloMap.set(attainment.cloId, {
        cloId: attainment.clo.id,
        cloCode: attainment.clo.code,
        description: attainment.clo.description,
        attainments: [],
        average: 0,
        latest: null,
        trend: 'stable',
      });
    }
    const clo = cloMap.get(attainment.cloId)!;
    clo.attainments.push(attainment.attainmentPercent);
  });

  // Calculate trends
  cloMap.forEach((clo) => {
    if (clo.attainments.length > 0) {
      clo.average =
        clo.attainments.reduce((sum, a) => sum + a, 0) / clo.attainments.length;
      clo.latest = clo.attainments[0]; // Most recent

      if (clo.attainments.length >= 2) {
        const recent = clo.attainments.slice(0, 2);
        if (recent[0] > recent[1]) {
          clo.trend = 'improving';
        } else if (recent[0] < recent[1]) {
          clo.trend = 'declining';
        }
      }
    }
  });

  // Identify weak CLOs (below 60% threshold)
  const weakCLOs = Array.from(cloMap.values())
    .filter((clo) => (clo.latest || 0) < 60)
    .sort((a, b) => (a.latest || 0) - (b.latest || 0));

  // Improvement suggestions
  const suggestions = weakCLOs.map((clo) => ({
    cloCode: clo.cloCode,
    currentAttainment: clo.latest || 0,
    suggestion: `Focus on improving ${clo.cloCode} through targeted assessments and additional practice.`,
  }));

  return {
    trends: Array.from(cloMap.values()),
    weakCLOs,
    suggestions,
  };
}

function calculateStudentAnalytics(results: any[], sections: any[]) {
  // Group by student
  const studentMap = new Map<
    number,
    {
      studentId: number;
      rollNumber: string;
      name: string;
      results: number[];
      average: number;
      totalAssessments: number;
    }
  >();

  results.forEach((result) => {
    if (!studentMap.has(result.studentId)) {
      studentMap.set(result.studentId, {
        studentId: result.studentId,
        rollNumber: result.student.rollNumber,
        name: `${result.student.user.first_name} ${result.student.user.last_name}`,
        results: [],
        average: 0,
        totalAssessments: 0,
      });
    }
    const student = studentMap.get(result.studentId)!;
    student.results.push(result.percentage);
    student.totalAssessments++;
  });

  // Calculate averages
  studentMap.forEach((student) => {
    student.average =
      student.results.length > 0
        ? student.results.reduce((sum, r) => sum + r, 0) / student.results.length
        : 0;
  });

  // Top performers (above 85%)
  const topPerformers = Array.from(studentMap.values())
    .filter((s) => s.average >= 85)
    .sort((a, b) => b.average - a.average)
    .slice(0, 10);

  // At-risk students (below 50%)
  const atRiskStudents = Array.from(studentMap.values())
    .filter((s) => s.average < 50)
    .sort((a, b) => a.average - b.average);

  // Performance distribution
  const distribution = {
    excellent: studentMap.size > 0 ? Array.from(studentMap.values()).filter((s) => s.average >= 85).length : 0,
    good: studentMap.size > 0 ? Array.from(studentMap.values()).filter((s) => s.average >= 70 && s.average < 85).length : 0,
    average: studentMap.size > 0 ? Array.from(studentMap.values()).filter((s) => s.average >= 50 && s.average < 70).length : 0,
    poor: studentMap.size > 0 ? Array.from(studentMap.values()).filter((s) => s.average < 50).length : 0,
  };

  // Grade distribution
  const gradeDistribution = {
    'A+': results.filter((r) => r.percentage >= 90).length,
    A: results.filter((r) => r.percentage >= 80 && r.percentage < 90).length,
    'B+': results.filter((r) => r.percentage >= 75 && r.percentage < 80).length,
    B: results.filter((r) => r.percentage >= 70 && r.percentage < 75).length,
    'C+': results.filter((r) => r.percentage >= 65 && r.percentage < 70).length,
    C: results.filter((r) => r.percentage >= 60 && r.percentage < 65).length,
    F: results.filter((r) => r.percentage < 60).length,
  };

  return {
    topPerformers,
    atRiskStudents,
    distribution,
    gradeDistribution,
  };
}

function calculateAssessmentAnalytics(assessments: any[], results: any[]) {
  const assessmentAnalytics = assessments.map((assessment) => {
    const assessmentResults = results.filter(
      (r) => r.assessmentId === assessment.id
    );

    if (assessmentResults.length === 0) {
      return {
        assessmentId: assessment.id,
        title: assessment.title,
        type: assessment.type,
        difficulty: null,
        averageScore: null,
        itemAnalysis: [],
      };
    }

    const totalMarks = assessment.totalMarks;
    const averageScore =
      assessmentResults.reduce((sum, r) => sum + r.obtainedMarks, 0) /
      assessmentResults.length;
    const averagePercentage = (averageScore / totalMarks) * 100;

    // Difficulty: Easy if >70%, Medium if 50-70%, Hard if <50%
    let difficulty: 'easy' | 'medium' | 'hard';
    if (averagePercentage >= 70) {
      difficulty = 'easy';
    } else if (averagePercentage >= 50) {
      difficulty = 'medium';
    } else {
      difficulty = 'hard';
    }

    // Item analysis
    const itemAnalysis = assessment.assessmentItems.map((item: any) => {
      const itemResults = assessmentResults
        .map((r) =>
          r.itemResults.find((ir: any) => ir.assessmentItemId === item.id)
        )
        .filter(Boolean);

      if (itemResults.length === 0) {
        return {
          itemId: item.id,
          questionNo: item.questionNo,
          averageMarks: 0,
          difficulty: null,
        };
      }

      const averageItemMarks =
        itemResults.reduce((sum: number, ir: any) => sum + ir.obtainedMarks, 0) /
        itemResults.length;
      const itemDifficulty = (averageItemMarks / item.marks) * 100;

      return {
        itemId: item.id,
        questionNo: item.questionNo,
        averageMarks: averageItemMarks,
        difficulty:
          itemDifficulty >= 70
            ? 'easy'
            : itemDifficulty >= 50
            ? 'medium'
            : 'hard',
      };
    });

    return {
      assessmentId: assessment.id,
      title: assessment.title,
      type: assessment.type,
      difficulty,
      averageScore,
      averagePercentage,
      totalStudents: assessmentResults.length,
      itemAnalysis,
    };
  });

  return assessmentAnalytics;
}

