import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFacultyIdFromRequest } from '@/lib/faculty-utils';

// POST - Calculate CLO attainments for a course offering or specific CLO
export async function POST(req: NextRequest) {
  try {
    const facultyId = await getFacultyIdFromRequest(req);
    if (!facultyId) {
      return NextResponse.json(
        { success: false, error: 'Faculty not found or unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { courseOfferingId, cloId, sectionId, threshold = 60 } = body;

    if (!courseOfferingId) {
      return NextResponse.json(
        { success: false, error: 'Course offering ID is required' },
        { status: 400 }
      );
    }

    // Verify course offering belongs to faculty
    const courseOffering = await prisma.courseofferings.findUnique({
      where: { id: courseOfferingId },
      include: {
        sections: {
          where: {
            facultyId: facultyId,
            status: 'active',
            ...(sectionId && { id: sectionId }),
          },
        },
        course: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!courseOffering || courseOffering.sections.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Course offering not found or unauthorized' },
        { status: 404 }
      );
    }

    const sectionIds = courseOffering.sections.map((s) => s.id);

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
    const totalStudents = new Set(studentIds).size;

    // Get CLOs to calculate
    const clos = await prisma.clos.findMany({
      where: {
        courseId: courseOffering.course.id,
        status: 'active',
        ...(cloId && { id: cloId }),
      },
    });

    if (clos.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No CLOs found for this course' },
        { status: 404 }
      );
    }

    // Get assessments for this course offering
    const assessments = await prisma.assessments.findMany({
      where: {
        courseOfferingId: courseOfferingId,
        conductedBy: facultyId,
        status: {
          in: ['active', 'evaluated', 'published'],
        },
      },
      include: {
        assessmentItems: {
          where: {
            ...(cloId && { cloId: cloId }),
            cloId: {
              not: null,
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

    // Calculate CLO attainments
    const calculatedAttainments = await prisma.$transaction(
      clos.map((clo) =>
        calculateCLOAttainment(
          clo,
          courseOfferingId,
          assessments,
          studentIds,
          totalStudents,
          threshold,
          facultyId
        )
      )
    );

    return NextResponse.json({
      success: true,
      message: `Successfully calculated CLO attainments for ${calculatedAttainments.length} CLO(s)`,
      data: calculatedAttainments,
    });
  } catch (error) {
    console.error('Error calculating CLO attainments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate CLO attainments' },
      { status: 500 }
    );
  }
}

async function calculateCLOAttainment(
  clo: any,
  courseOfferingId: number,
  assessments: any[],
  studentIds: number[],
  totalStudents: number,
  threshold: number,
  facultyId: number
) {
  // Get assessment items for this CLO
  const cloItems: Array<{
    assessmentId: number;
    itemId: number;
    marks: number;
  }> = [];
  assessments.forEach((assessment) => {
    assessment.assessmentItems.forEach((item: any) => {
      if (item.cloId === clo.id) {
        cloItems.push({
          assessmentId: assessment.id,
          itemId: item.id,
          marks: item.marks,
        });
      }
    });
  });

  if (cloItems.length === 0) {
    // No items mapped to this CLO
    return null;
  }

  // Get results for these items
  const itemResults = await prisma.studentassessmentitemresults.findMany({
    where: {
      assessmentItemId: {
        in: cloItems.map((i) => i.itemId),
      },
      studentAssessmentResult: {
        studentId: {
          in: studentIds,
        },
        assessmentId: {
          in: assessments.map((a) => a.id),
        },
        status: {
          in: ['evaluated', 'published'],
        },
      },
    },
    include: {
      studentAssessmentResult: {
        select: {
          studentId: true,
        },
      },
      assessmentItem: {
        select: {
          id: true,
          marks: true,
        },
      },
    },
  });

  // Calculate total possible marks for this CLO
  const totalPossibleMarks = cloItems.reduce(
    (sum, item) => sum + item.marks,
    0
  );

  // Group by student and calculate their CLO performance
  const studentCLOPerformance = new Map<
    number,
    { obtained: number; total: number }
  >();

  itemResults.forEach((itemResult) => {
    const studentId = itemResult.studentAssessmentResult.studentId;
    if (!studentCLOPerformance.has(studentId)) {
      studentCLOPerformance.set(studentId, { obtained: 0, total: 0 });
    }
    const perf = studentCLOPerformance.get(studentId)!;
    perf.obtained += itemResult.obtainedMarks;
    perf.total += itemResult.assessmentItem.marks;
  });

  // Calculate how many students achieved the threshold
  let studentsAchieved = 0;
  studentCLOPerformance.forEach((perf) => {
    const percentage = perf.total > 0 ? (perf.obtained / perf.total) * 100 : 0;
    if (percentage >= threshold) {
      studentsAchieved++;
    }
  });

  // Calculate overall attainment percentage
  const attainmentPercent =
    totalStudents > 0 ? (studentsAchieved / totalStudents) * 100 : 0;

  // Check if attainment already exists
  const existing = await prisma.closattainments.findUnique({
    where: {
      cloId_courseOfferingId: {
        cloId: clo.id,
        courseOfferingId: courseOfferingId,
      },
    },
  });

  if (existing) {
    // Update existing
    return await prisma.closattainments.update({
      where: { id: existing.id },
      data: {
        totalStudents,
        studentsAchieved,
        threshold,
        attainmentPercent,
        calculatedAt: new Date(),
        calculatedBy: facultyId,
      },
    });
  } else {
    // Create new
    return await prisma.closattainments.create({
      data: {
        cloId: clo.id,
        courseOfferingId: courseOfferingId,
        totalStudents,
        studentsAchieved,
        threshold,
        attainmentPercent,
        calculatedBy: facultyId,
      },
    });
  }
}
