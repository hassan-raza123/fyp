import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFacultyIdFromRequest } from '@/lib/faculty-utils';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sectionId = await Promise.resolve(parseInt(params.id));

    if (isNaN(sectionId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid section ID' },
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

    // Get section with verification that it belongs to the faculty
    const section = await prisma.sections.findFirst({
      where: {
        id: sectionId,
        facultyId: facultyId,
        status: 'active',
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

    if (!section) {
      return NextResponse.json(
        { success: false, error: 'Section not found or unauthorized' },
        { status: 404 }
      );
    }

    // Get all students in this section
    const studentSections = await prisma.studentsections.findMany({
      where: {
        sectionId: sectionId,
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

    const studentIds = studentSections.map((ss) => ss.studentId);

    // Get all assessments for this section's course offering
    const assessments = await prisma.assessments.findMany({
      where: {
        courseOfferingId: section.courseOfferingId,
        conductedBy: facultyId,
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
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    const assessmentIds = assessments.map((a) => a.id);

    // Get all assessment results for students in this section
    const assessmentResults = await prisma.studentassessmentresults.findMany({
      where: {
        assessmentId: {
          in: assessmentIds,
        },
        studentId: {
          in: studentIds,
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

    // Calculate average performance
    const evaluatedResults = assessmentResults.filter(
      (r) => r.status === 'evaluated' || r.status === 'published'
    );
    const averagePerformance =
      evaluatedResults.length > 0
        ? evaluatedResults.reduce((sum, r) => sum + r.percentage, 0) /
          evaluatedResults.length
        : 0;

    // Calculate assessment completion rates
    const completionRates = assessments.map((assessment) => {
      const totalStudents = studentIds.length;
      const submittedResults = assessmentResults.filter(
        (r) => r.assessmentId === assessment.id && r.submittedAt !== null
      );
      const evaluatedResults = assessmentResults.filter(
        (r) =>
          r.assessmentId === assessment.id &&
          (r.status === 'evaluated' || r.status === 'published')
      );

      return {
        assessmentId: assessment.id,
        assessmentTitle: assessment.title,
        assessmentType: assessment.type,
        dueDate: assessment.dueDate,
        totalStudents,
        submittedCount: submittedResults.length,
        evaluatedCount: evaluatedResults.length,
        submissionRate: totalStudents > 0 ? (submittedResults.length / totalStudents) * 100 : 0,
        evaluationRate: totalStudents > 0 ? (evaluatedResults.length / totalStudents) * 100 : 0,
      };
    });

    // Calculate student-wise performance
    const studentPerformance = studentSections.map((ss) => {
      const studentResults = assessmentResults.filter(
        (r) => r.studentId === ss.studentId
      );
      const evaluatedStudentResults = studentResults.filter(
        (r) => r.status === 'evaluated' || r.status === 'published'
      );

      const avgPercentage =
        evaluatedStudentResults.length > 0
          ? evaluatedStudentResults.reduce((sum, r) => sum + r.percentage, 0) /
            evaluatedStudentResults.length
          : 0;

      const completedAssessments = evaluatedStudentResults.length;
      const totalAssessments = assessments.length;
      const completionRate =
        totalAssessments > 0
          ? (completedAssessments / totalAssessments) * 100
          : 0;

      return {
        studentId: ss.studentId,
        studentName: `${ss.student.user.first_name} ${ss.student.user.last_name}`,
        rollNumber: ss.student.rollNumber,
        averagePercentage: avgPercentage,
        completedAssessments,
        totalAssessments,
        completionRate,
      };
    });

    // Calculate performance distribution
    const performanceRanges = [
      { range: '90-100', count: 0 },
      { range: '80-89', count: 0 },
      { range: '70-79', count: 0 },
      { range: '60-69', count: 0 },
      { range: 'Below 60', count: 0 },
    ];

    studentPerformance.forEach((sp) => {
      const percentage = sp.averagePercentage;
      if (percentage >= 90) {
        performanceRanges[0].count++;
      } else if (percentage >= 80) {
        performanceRanges[1].count++;
      } else if (percentage >= 70) {
        performanceRanges[2].count++;
      } else if (percentage >= 60) {
        performanceRanges[3].count++;
      } else {
        performanceRanges[4].count++;
      }
    });

    // Get CLO attainments for this section's course
    const cloAttainments = await prisma.closattainments.findMany({
      where: {
        courseOfferingId: section.courseOfferingId,
        sectionId: sectionId,
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

    // Get latest CLO attainment for each CLO
    const cloAttainmentMap = new Map<number, any>();
    cloAttainments.forEach((ca) => {
      if (!cloAttainmentMap.has(ca.cloId)) {
        cloAttainmentMap.set(ca.cloId, {
          cloCode: ca.clo.code,
          cloDescription: ca.clo.description,
          attainmentPercent: ca.attainmentPercent,
          threshold: ca.threshold,
          status: ca.attainmentPercent >= ca.threshold ? 'attained' : 'not_attained',
        });
      }
    });

    const cloAttainmentSummary = Array.from(cloAttainmentMap.values());

    return NextResponse.json({
      success: true,
      data: {
        section: {
          id: section.id,
          name: section.name,
          course: section.courseOffering.course,
          semester: section.courseOffering.semester,
          totalStudents: section._count.studentsections,
        },
        averagePerformance,
        totalAssessments: assessments.length,
        completionRates,
        studentPerformance,
        performanceDistribution: performanceRanges,
        cloAttainmentSummary,
      },
    });
  } catch (error) {
    console.error('Error fetching section analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch section analytics' },
      { status: 500 }
    );
  }
}

