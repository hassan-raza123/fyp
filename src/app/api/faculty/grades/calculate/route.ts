import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFacultyIdFromRequest, requireAuth } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit-log';
import { recalculateStudentGpa } from '@/lib/obe';

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
          in: ['active', 'completed'] as any,
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

    // Without a grade scale every lookup falls through to 'F' with 0 GPA
    // points, which silently fails an entire cohort. Refuse instead.
    const studentsMissingScale = uniqueStudentIds.filter(
      (id) => (studentGradeScales.get(id) ?? []).length === 0
    );
    if (studentsMissingScale.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'No grade scale is configured for this program. Configure a grade scale before calculating grades.',
          details: { studentsAffected: studentsMissingScale.length },
        },
        { status: 400 }
      );
    }

    // Assessment weightages should describe the whole course. If they sum to
    // less than 100 the weighted average is normalised over a partial course
    // and every grade comes out inflated, so surface it rather than hide it.
    const totalWeightage = assessments.reduce(
      (sum, a) => sum + (a.weightage || 0),
      0
    );
    if (totalWeightage > 0 && Math.abs(totalWeightage - 100) > 0.01) {
      return NextResponse.json(
        {
          success: false,
          error: `Assessment weightages for this course offering total ${totalWeightage}%, not 100%. Adjust them before calculating grades.`,
          details: { totalWeightage },
        },
        { status: 400 }
      );
    }

    // Get course credit hours (default to 3 if not available)
    const creditHours = courseOffering.course.creditHours || 3;

    // Calculate grades for each student
    const calculatedGrades = await Promise.all(
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

    // Grades feed semester/cumulative GPA, which the graduation tracker reads.
    // Recompute here so those tables are never left stale or empty.
    await Promise.all(
      uniqueStudentIds.map((studentId) => recalculateStudentGpa(studentId))
    );

    // Send notification to faculty
    const { notifyGradeCalculationCompleted } = await import('@/lib/notification-utils');
    await notifyGradeCalculationCompleted(
      courseOffering.course.code,
      calculatedGrades.length,
      facultyId
    );

    const auth = await requireAuth(req);
    if (auth.success && auth.user) {
      await writeAuditLog(req, auth.user, 'grade.calculate', {
        courseOfferingId,
        sectionId: sectionId ?? null,
        facultyId,
        totalWeightage,
        studentCount: calculatedGrades.length,
      });
    }

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

  // Calculate weighted average using ALL assessment weights (not just ones student took)
  let totalWeightedMarks = 0;
  let totalWeight = 0;

  // First, calculate total weight across ALL assessments (not just ones with results)
  const allAssessmentsWeight = assessments.reduce((sum, a) => sum + (a.weightage || 0), 0);

  if (allAssessmentsWeight > 0) {
    // Use actual weightages — include 0 for missing assessments
    assessments.forEach((assessment) => {
      const result = studentResults.find((r) => r.assessmentId === assessment.id);
      const weight = assessment.weightage || 0;
      totalWeight += weight;
      if (result) {
        totalWeightedMarks += result.percentage * weight;
      }
      // Missing assessments contribute 0 to totalWeightedMarks but their weight is counted
    });
  } else {
    // No weightage set on any assessment — use equal weight across ALL assessments
    const equalWeight = 100 / assessments.length;
    assessments.forEach((assessment) => {
      const result = studentResults.find((r) => r.assessmentId === assessment.id);
      totalWeight += equalWeight;
      if (result) {
        totalWeightedMarks += result.percentage * equalWeight;
      }
    });
  }

  const finalPercentage = totalWeight > 0 ? totalWeightedMarks / totalWeight : 0;

  // Note: totalMarks and obtainedMarks are raw (unweighted) sums for display purposes. The 'percentage' field is the authoritative weighted grade.
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
  // Check if grade already exists — find latest attempt regardless of attemptNumber
  const existing = await prisma.studentgrades.findFirst({
    where: {
      studentId: studentId,
      courseOfferingId: courseOfferingId,
      component: 'combined',
    },
    orderBy: { attemptNumber: 'desc' },
  });

  // Repeats: the same course taken again is a *different* course offering, so
  // without this the student would carry two live grade rows for one course and
  // both would count towards CGPA. Earlier attempts are marked superseded and
  // excluded from GPA; only the latest attempt stays active.
  const courseId = (
    await prisma.courseofferings.findUnique({
      where: { id: courseOfferingId },
      select: { courseId: true },
    })
  )?.courseId;

  let attemptNumber = existing?.attemptNumber ?? 1;
  let isRepeat = existing?.isRepeat ?? false;

  if (!existing && courseId) {
    const priorAttempts = await prisma.studentgrades.findMany({
      where: {
        studentId,
        component: 'combined',
        courseOffering: { courseId },
        courseOfferingId: { not: courseOfferingId },
      },
      select: { id: true, attemptNumber: true },
      orderBy: { attemptNumber: 'desc' },
    });

    if (priorAttempts.length > 0) {
      attemptNumber = (priorAttempts[0].attemptNumber ?? 1) + 1;
      isRepeat = true;

      await prisma.studentgrades.updateMany({
        where: { id: { in: priorAttempts.map((p) => p.id) } },
        data: { status: 'superseded' },
      });
    }
  }

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
        attemptNumber,
        isRepeat,
        calculatedBy: facultyId,
      },
    });
  }
}


