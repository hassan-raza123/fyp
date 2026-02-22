import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFacultyIdFromRequest } from '@/lib/auth';

// Lab assessment types — only these contribute to LLO attainments
const LAB_ASSESSMENT_TYPES = ['lab_exam', 'lab_report'];

// POST - Calculate LLO attainments for a course offering (faculty-scoped)
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
    const { courseOfferingId, lloId, sectionId, threshold } = body;

    if (!courseOfferingId) {
      return NextResponse.json(
        { success: false, error: 'Course offering ID is required' },
        { status: 400 }
      );
    }

    // Verify the faculty teaches this course offering
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
          select: { id: true, labHours: true },
        },
      },
    });

    if (!courseOffering || courseOffering.sections.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Course offering not found or you are not assigned to it' },
        { status: 404 }
      );
    }

    if (courseOffering.course.labHours === 0) {
      return NextResponse.json(
        { success: false, error: 'This course has no lab component (labHours = 0)' },
        { status: 400 }
      );
    }

    // Resolve threshold: use request value → pass/fail criteria minPassPercent → default 60
    const criteria = await prisma.passfailcriteria.findUnique({
      where: { courseOfferingId: courseOfferingId },
      select: { minPassPercent: true },
    });
    const effectiveThreshold: number = threshold ?? criteria?.minPassPercent ?? 60;

    const sectionIds = courseOffering.sections.map((s) => s.id);

    // Get unique students enrolled in the faculty's sections
    const studentSections = await prisma.studentsections.findMany({
      where: { sectionId: { in: sectionIds }, status: 'active' },
      select: { studentId: true },
    });

    const studentIds = [...new Set(studentSections.map((ss) => ss.studentId))];
    const totalStudents = studentIds.length;

    if (totalStudents === 0) {
      return NextResponse.json(
        { success: false, error: 'No students found in your sections for this course offering' },
        { status: 400 }
      );
    }

    // Get LLOs for this course (all active, or a specific one)
    const llos = await prisma.llos.findMany({
      where: {
        courseId: courseOffering.course.id,
        status: 'active',
        ...(lloId && { id: lloId }),
      },
    });

    if (llos.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No Lab Learning Outcomes (LLOs) found for this course' },
        { status: 404 }
      );
    }

    // Fetch only lab-type assessments conducted by this faculty for this offering
    const labAssessments = await prisma.assessments.findMany({
      where: {
        courseOfferingId: courseOfferingId,
        conductedBy: facultyId,
        type: { in: LAB_ASSESSMENT_TYPES as any },
        status: { in: ['active', 'completed'] },
      },
      select: { id: true },
    });

    if (labAssessments.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'No lab assessments (lab_exam or lab_report) found for this course offering. ' +
            'Create lab assessments with items mapped to LLOs before calculating LLO attainments.',
        },
        { status: 404 }
      );
    }

    const labAssessmentIds = labAssessments.map((a) => a.id);

    // Calculate attainment per LLO.
    // Promise.all is used here (not prisma.$transaction) because calculateLLOAttainment
    // is an async function that makes multiple internal Prisma calls and returns a
    // regular Promise, not a PrismaPromise required by $transaction.
    const calculatedAttainments = await Promise.all(
      llos.map((llo) =>
        calculateLLOAttainment(
          llo,
          courseOfferingId,
          labAssessmentIds,
          studentIds,
          totalStudents,
          effectiveThreshold,
          facultyId
        )
      )
    );

    const saved = calculatedAttainments.filter(Boolean);
    const skipped = llos.length - saved.length;

    return NextResponse.json({
      success: true,
      message:
        `Successfully calculated LLO attainments for ${saved.length} LLO(s)` +
        (skipped > 0
          ? `. ${skipped} LLO(s) skipped — no lab assessment items mapped to them yet.`
          : '.'),
      data: saved,
    });
  } catch (error) {
    console.error('Error calculating LLO attainments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate LLO attainments' },
      { status: 500 }
    );
  }
}

async function calculateLLOAttainment(
  llo: any,
  courseOfferingId: number,
  labAssessmentIds: number[],
  studentIds: number[],
  totalStudents: number,
  threshold: number,
  facultyId: number
) {
  // Get assessment items mapped to this LLO from lab assessments.
  // Cast where to `any` to handle the lloId field until `prisma generate` is run
  // after the schema update that added lloId to assessmentitems.
  const lloItems = await prisma.assessmentitems.findMany({
    where: {
      assessmentId: { in: labAssessmentIds },
      lloId: llo.id,
    } as any,
    select: { id: true, marks: true },
  });

  if (lloItems.length === 0) {
    // No items mapped to this LLO — skip
    return null;
  }

  const lloItemIds = lloItems.map((i) => i.id);

  // Get student item results for these LLO-mapped items (evaluated or published only).
  // The correct Prisma relation name on studentassessmentitemresults is `studentResult`
  // (not `studentAssessmentResult`).
  const itemResults = await prisma.studentassessmentitemresults.findMany({
    where: {
      assessmentItemId: { in: lloItemIds },
      studentResult: {
        studentId: { in: studentIds },
        status: { in: ['evaluated', 'published'] },
      },
    },
    include: {
      studentResult: { select: { studentId: true } },
      assessmentItem: { select: { marks: true } },
    },
  });

  // Aggregate per-student performance across all items for this LLO
  const studentPerformance = new Map<number, { obtained: number; total: number }>();
  itemResults.forEach((result) => {
    const studentId = result.studentResult.studentId;
    if (!studentPerformance.has(studentId)) {
      studentPerformance.set(studentId, { obtained: 0, total: 0 });
    }
    const perf = studentPerformance.get(studentId)!;
    perf.obtained += result.obtainedMarks;
    perf.total += result.assessmentItem.marks;
  });

  // Count students who reached the threshold
  let studentsAchieved = 0;
  studentPerformance.forEach((perf) => {
    const percentage = perf.total > 0 ? (perf.obtained / perf.total) * 100 : 0;
    if (percentage >= threshold) studentsAchieved++;
  });

  const attainmentPercent = totalStudents > 0 ? (studentsAchieved / totalStudents) * 100 : 0;

  // Upsert the attainment record
  const existing = await prisma.llosattainments.findUnique({
    where: {
      lloId_courseOfferingId: {
        lloId: llo.id,
        courseOfferingId: courseOfferingId,
      },
    },
  });

  if (existing) {
    return prisma.llosattainments.update({
      where: { id: existing.id },
      data: {
        totalStudents,
        studentsAchieved,
        threshold,
        attainmentPercent,
        calculatedAt: new Date(),
        calculatedBy: facultyId,
        status: 'active',
      },
    });
  } else {
    return prisma.llosattainments.create({
      data: {
        lloId: llo.id,
        courseOfferingId: courseOfferingId,
        totalStudents,
        studentsAchieved,
        threshold,
        attainmentPercent,
        calculatedBy: facultyId,
        status: 'active',
      },
    });
  }
}
