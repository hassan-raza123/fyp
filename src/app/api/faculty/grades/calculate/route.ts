import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFacultyIdFromRequest } from '@/lib/faculty-utils';

// POST - Calculate grades for a course offering
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
    const { courseOfferingId, sectionId } = body;

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
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            creditHours: true,
          },
        },
        sections: {
          where: {
            facultyId: facultyId,
            status: 'active',
            ...(sectionId && { id: sectionId }),
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
    const uniqueStudentIds = [...new Set(studentIds)];

    // Get students with their programs to fetch grade scales
    const students = await prisma.students.findMany({
      where: {
        id: {
          in: uniqueStudentIds,
        },
      },
      include: {
        program: {
          include: {
            gradeScales: {
              where: { status: 'active' },
              orderBy: { minPercent: 'desc' },
            },
          },
        },
      },
    });

    // Create a map of studentId -> grade scales
    const studentGradeScales = new Map<number, any[]>();
    students.forEach((student) => {
      studentGradeScales.set(
        student.id,
        student.program?.gradeScales || []
      );
    });

    // Get all assessments for this course offering
    const assessments = await prisma.assessments.findMany({
      where: {
        courseOfferingId: courseOfferingId,
        conductedBy: facultyId,
        status: {
          in: ['active', 'evaluated', 'published'],
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Get assessment results
    const assessmentResults = await prisma.studentassessmentresults.findMany({
      where: {
        assessmentId: {
          in: assessments.map((a) => a.id),
        },
        studentId: {
          in: uniqueStudentIds,
        },
        status: {
          in: ['evaluated', 'published'],
        },
      },
    });

    // Get course credit hours (default to 3 if not available)
    const creditHours = courseOffering.course.creditHours || 3;

    // Calculate grades for each student
    const calculatedGrades = await prisma.$transaction(
      uniqueStudentIds.map((studentId) => {
        const gradeScale = studentGradeScales.get(studentId) || [];
        return calculateStudentGrade(
          studentId,
          courseOfferingId,
          assessments,
          assessmentResults,
          gradeScale,
          creditHours,
          facultyId
        );
      })
    );

    // Send notification to faculty
    const { notifyGradeCalculationCompleted } = await import('@/lib/notification-utils');
    await notifyGradeCalculationCompleted(
      courseOffering.course.code,
      calculatedGrades.length,
      facultyId
    );

    return NextResponse.json({
      success: true,
      message: `Successfully calculated grades for ${calculatedGrades.length} student(s)`,
      data: calculatedGrades,
    });
  } catch (error) {
    console.error('Error calculating grades:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate grades' },
      { status: 500 }
    );
  }
}

async function calculateStudentGrade(
  studentId: number,
  courseOfferingId: number,
  assessments: any[],
  assessmentResults: any[],
  gradeScale: any[],
  creditHours: number,
  facultyId: number
) {
  // Get student's results for this course offering
  const studentResults = assessmentResults.filter(
    (r) => r.studentId === studentId
  );

  if (studentResults.length === 0) {
    // No results, create grade with 0
    return await createOrUpdateGrade(
      studentId,
      courseOfferingId,
      0,
      0,
      0,
      'F',
      0,
      creditHours,
      0,
      facultyId
    );
  }

  // Calculate weighted average
  let totalWeightedMarks = 0;
  let totalWeight = 0;

  assessments.forEach((assessment) => {
    const result = studentResults.find((r) => r.assessmentId === assessment.id);
    if (result) {
      const weight = assessment.weightage || 0;
      totalWeightedMarks += result.percentage * weight;
      totalWeight += weight;
    }
  });

  // If no weightage is set, use equal weight
  if (totalWeight === 0) {
    const equalWeight = 100 / assessments.length;
    assessments.forEach((assessment) => {
      const result = studentResults.find((r) => r.assessmentId === assessment.id);
      if (result) {
        totalWeightedMarks += result.percentage * equalWeight;
        totalWeight += equalWeight;
      }
    });
  }

  const finalPercentage = totalWeight > 0 ? totalWeightedMarks / totalWeight : 0;

  // Calculate total marks and obtained marks
  const totalMarks = assessments.reduce((sum, a) => sum + a.totalMarks, 0);
  const obtainedMarks = studentResults.reduce(
    (sum, r) => sum + r.obtainedMarks,
    0
  );

  // Get grade from grade scale
  const gradeEntry = gradeScale.find(
    (gs) =>
      finalPercentage >= gs.minPercent && finalPercentage <= gs.maxPercent
  );
  const grade = gradeEntry?.grade || 'F';
  const gpaPoints = gradeEntry?.gpaValue || 0;

  // Calculate quality points
  const qualityPoints = gpaPoints * creditHours;

  return await createOrUpdateGrade(
    studentId,
    courseOfferingId,
    totalMarks,
    obtainedMarks,
    finalPercentage,
    grade,
    gpaPoints,
    creditHours,
    qualityPoints,
    facultyId
  );
}

async function createOrUpdateGrade(
  studentId: number,
  courseOfferingId: number,
  totalMarks: number,
  obtainedMarks: number,
  percentage: number,
  grade: string,
  gpaPoints: number,
  creditHours: number,
  qualityPoints: number,
  facultyId: number
) {
  // Check if grade already exists
  const existing = await prisma.studentgrades.findFirst({
    where: {
      studentId: studentId,
      courseOfferingId: courseOfferingId,
      attemptNumber: 1, // Default to first attempt
    },
  });

  if (existing) {
    // Update existing grade
    return await prisma.studentgrades.update({
      where: { id: existing.id },
      data: {
        totalMarks,
        obtainedMarks,
        percentage,
        grade,
        gpaPoints,
        creditHours,
        qualityPoints,
        calculatedAt: new Date(),
        calculatedBy: facultyId,
      },
    });
  } else {
    // Create new grade
    return await prisma.studentgrades.create({
      data: {
        studentId,
        courseOfferingId,
        totalMarks,
        obtainedMarks,
        percentage,
        grade,
        gpaPoints,
        creditHours,
        qualityPoints,
        calculatedBy: facultyId,
      },
    });
  }
}


