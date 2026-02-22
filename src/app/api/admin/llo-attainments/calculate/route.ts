import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { getCurrentDepartmentId } from '@/lib/auth';

// Lab assessment types — only these contribute to LLO attainments
const LAB_ASSESSMENT_TYPES = ['lab_exam', 'lab_report'];

// POST - Calculate LLO attainments for a course offering (or a specific LLO)
export async function POST(req: NextRequest) {
  try {
    const { success, user, error } = await requireAuth(req);
    if (!success || user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { courseOfferingId, lloId, threshold = 60 } = body;

    if (!courseOfferingId) {
      return NextResponse.json(
        { success: false, error: 'Course offering ID is required' },
        { status: 400 }
      );
    }

    // Get current department ID from request
    const departmentId = await getCurrentDepartmentId(req);
    if (!departmentId) {
      return NextResponse.json(
        { success: false, error: 'Department not configured' },
        { status: 400 }
      );
    }

    // Verify course offering belongs to department
    const courseOffering = await prisma.courseofferings.findUnique({
      where: { id: courseOfferingId },
      include: {
        sections: {
          where: { status: 'active' },
        },
        course: {
          select: { id: true, departmentId: true },
        },
      },
    });

    if (!courseOffering) {
      return NextResponse.json(
        { success: false, error: 'Course offering not found' },
        { status: 404 }
      );
    }

    if (courseOffering.course.departmentId !== departmentId) {
      return NextResponse.json(
        { success: false, error: 'Course offering does not belong to current department' },
        { status: 403 }
      );
    }

    const sectionIds = courseOffering.sections.map((s) => s.id);

    // Get unique students enrolled in the sections
    const studentSections = await prisma.studentsections.findMany({
      where: { sectionId: { in: sectionIds }, status: 'active' },
      select: { studentId: true },
    });

    const studentIds = [...new Set(studentSections.map((ss) => ss.studentId))];
    const totalStudents = studentIds.length;

    if (totalStudents === 0) {
      return NextResponse.json(
        { success: false, error: 'No students found in this course offering' },
        { status: 400 }
      );
    }

    // Get LLOs to calculate (all active, or a specific one)
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

    // Fetch only lab-type assessments for this offering that have been evaluated/published
    const labAssessments = await prisma.assessments.findMany({
      where: {
        courseOfferingId: courseOfferingId,
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

    // Get the faculty from the first section (for calculatedBy audit)
    const firstSection = courseOffering.sections[0];
    const calculatedBy = firstSection?.facultyId ?? null;

    if (!calculatedBy) {
      return NextResponse.json(
        { success: false, error: 'No faculty assigned to sections in this course offering' },
        { status: 400 }
      );
    }

    // Calculate LLO attainment per LLO using lloId-mapped assessment items
    const calculatedAttainments = await Promise.all(
      llos.map(async (llo) => {
        // Get assessment items that are explicitly mapped to this LLO
        const lloItems = await prisma.assessmentitems.findMany({
          where: {
            lloId: llo.id,
            assessmentId: { in: labAssessmentIds },
          },
          select: { id: true, marks: true },
        });

        if (lloItems.length === 0) {
          // No items mapped to this LLO — skip and return null
          return null;
        }

        const lloItemIds = lloItems.map((i) => i.id);

        // Get student item results for these LLO-mapped items (evaluated or published)
        const itemResults = await prisma.studentassessmentitemresults.findMany({
          where: {
            assessmentItemId: { in: lloItemIds },
            studentAssessmentResult: {
              studentId: { in: studentIds },
              status: { in: ['evaluated', 'published'] },
            },
          },
          include: {
            studentAssessmentResult: {
              select: { studentId: true },
            },
            assessmentItem: {
              select: { marks: true },
            },
          },
        });

        // Aggregate per-student performance across all items for this LLO
        const studentPerformance = new Map<number, { obtained: number; total: number }>();

        itemResults.forEach((result) => {
          const studentId = result.studentAssessmentResult.studentId;
          if (!studentPerformance.has(studentId)) {
            studentPerformance.set(studentId, { obtained: 0, total: 0 });
          }
          const perf = studentPerformance.get(studentId)!;
          perf.obtained += result.obtainedMarks;
          perf.total += result.assessmentItem.marks;
        });

        // Count students who reached the attainment threshold
        let studentsAchieved = 0;
        studentPerformance.forEach((perf) => {
          const percentage = perf.total > 0 ? (perf.obtained / perf.total) * 100 : 0;
          if (percentage >= threshold) {
            studentsAchieved++;
          }
        });

        const attainmentPercent =
          totalStudents > 0 ? (studentsAchieved / totalStudents) * 100 : 0;

        // Upsert LLO attainment record
        return prisma.llosattainments.upsert({
          where: {
            lloId_courseOfferingId: {
              lloId: llo.id,
              courseOfferingId: courseOfferingId,
            },
          },
          update: {
            totalStudents,
            studentsAchieved,
            threshold,
            attainmentPercent,
            calculatedAt: new Date(),
            calculatedBy,
            status: 'active',
          },
          create: {
            lloId: llo.id,
            courseOfferingId: courseOfferingId,
            totalStudents,
            studentsAchieved,
            threshold,
            attainmentPercent,
            calculatedBy,
            status: 'active',
          },
        });
      })
    );

    // Filter out nulls (LLOs with no mapped items)
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
