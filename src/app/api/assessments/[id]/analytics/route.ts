import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFacultyIdFromRequest } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  try {
    const assessmentId = parseInt(params.id);
    if (isNaN(assessmentId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid assessment ID' },
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

    // Get assessment with items and CLOs
    const assessment = await prisma.assessments.findUnique({
      where: { id: assessmentId },
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
          orderBy: {
            questionNo: 'asc',
          },
        },
        courseOffering: {
          include: {
            course: {
              select: {
                id: true,
                code: true,
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
      },
    });

    if (!assessment) {
      return NextResponse.json(
        { success: false, error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Verify assessment belongs to faculty
    if (assessment.conductedBy !== facultyId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const sectionIds = assessment.courseOffering.sections.map((s) => s.id);

    // Get all results for this assessment
    const results = await prisma.studentassessmentresults.findMany({
      where: {
        assessmentId: assessmentId,
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
          select: {
            id: true,
            user: {
              select: {
                first_name: true,
                last_name: true,
                email: true,
              },
            },
            rollNumber: true,
          },
        },
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
      },
    });

    // Calculate overall statistics
    const totalStudents = results.length;
    const totalMarks = assessment.totalMarks;
    const averageMarks =
      totalStudents > 0
        ? results.reduce((sum, r) => sum + r.obtainedMarks, 0) / totalStudents
        : 0;
    const averagePercentage =
      totalStudents > 0
        ? results.reduce((sum, r) => sum + r.percentage, 0) / totalStudents
        : 0;
    const highestMarks =
      results.length > 0
        ? Math.max(...results.map((r) => r.obtainedMarks))
        : 0;
    const lowestMarks =
      results.length > 0
        ? Math.min(...results.map((r) => r.obtainedMarks))
        : 0;

    // Grade distribution
    const gradeRanges = [
      { grade: 'A+', min: 95, max: 100 },
      { grade: 'A', min: 85, max: 94 },
      { grade: 'B+', min: 75, max: 84 },
      { grade: 'B', min: 65, max: 74 },
      { grade: 'C+', min: 55, max: 64 },
      { grade: 'C', min: 50, max: 54 },
      { grade: 'F', min: 0, max: 49 },
    ];

    const gradeDistribution = gradeRanges.map((range) => ({
      grade: range.grade,
      count: results.filter(
        (r) => r.percentage >= range.min && r.percentage <= range.max
      ).length,
    }));

    // Performance by CLO
    const cloPerformance = new Map<
      number,
      {
        cloId: number;
        cloCode: string;
        totalMarks: number;
        totalObtained: number;
        averagePercentage: number;
        itemCount: number;
      }
    >();

    assessment.assessmentItems.forEach((item) => {
      if (item.cloId) {
        if (!cloPerformance.has(item.cloId)) {
          cloPerformance.set(item.cloId, {
            cloId: item.cloId,
            cloCode: item.clo?.code || 'N/A',
            totalMarks: 0,
            totalObtained: 0,
            averagePercentage: 0,
            itemCount: 0,
          });
        }
        const cloData = cloPerformance.get(item.cloId)!;
        cloData.totalMarks += item.marks;
        cloData.itemCount += 1;
      }
    });

    // Calculate obtained marks per CLO from item results
    results.forEach((result) => {
      result.itemResults.forEach((itemResult) => {
        const cloId = itemResult.assessmentItem.cloId;
        if (cloId && cloPerformance.has(cloId)) {
          const cloData = cloPerformance.get(cloId)!;
          cloData.totalObtained += itemResult.obtainedMarks;
        }
      });
    });

    // Calculate average percentage for each CLO
    const cloPerformanceArray = Array.from(cloPerformance.values()).map(
      (clo) => ({
        ...clo,
        averagePercentage:
          clo.totalMarks > 0 ? (clo.totalObtained / (clo.totalMarks * totalStudents)) * 100 : 0,
      })
    );

    // Item-wise analysis
    const itemAnalysis = assessment.assessmentItems.map((item) => {
      const itemResults = results.flatMap((r) =>
        r.itemResults.filter((ir) => ir.assessmentItemId === item.id)
      );
      const avgMarks =
        itemResults.length > 0
          ? itemResults.reduce((sum, ir) => sum + ir.obtainedMarks, 0) /
            itemResults.length
          : 0;
      const avgPercentage = (avgMarks / item.marks) * 100;

      return {
        itemId: item.id,
        questionNo: item.questionNo,
        description: item.description,
        totalMarks: item.marks,
        averageMarks: avgMarks,
        averagePercentage: avgPercentage,
        cloCode: item.clo?.code || 'N/A',
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        assessment: {
          id: assessment.id,
          title: assessment.title,
          type: assessment.type,
          totalMarks: assessment.totalMarks,
          weightage: assessment.weightage,
        },
        overall: {
          totalStudents,
          averageMarks,
          averagePercentage,
          highestMarks,
          lowestMarks,
          totalMarks,
        },
        gradeDistribution,
        cloPerformance: cloPerformanceArray,
        itemAnalysis,
        studentResults: results.map((r) => ({
          studentId: r.student.id,
          studentName: `${r.student.user.first_name} ${r.student.user.last_name}`,
          rollNumber: r.student.rollNumber,
          obtainedMarks: r.obtainedMarks,
          totalMarks: r.totalMarks,
          percentage: r.percentage,
          status: r.status,
          submittedAt: r.submittedAt,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching assessment analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assessment analytics' },
      { status: 500 }
    );
  }
}

