import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { getCurrentDepartmentId } from '@/lib/auth';

// POST - Calculate LLO attainments for a course offering or specific LLO
export async function POST(req: NextRequest) {
  try {
    const { success, user } = requireAuth(req);
    if (!success || user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
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

    // Get current department ID
    const departmentId = await getCurrentDepartmentId();
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
          where: {
            status: 'active',
          },
        },
        course: {
          select: {
            id: true,
            departmentId: true,
          },
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

    if (totalStudents === 0) {
      return NextResponse.json(
        { success: false, error: 'No students found in this course offering' },
        { status: 400 }
      );
    }

    // Get LLOs to calculate
    const llos = await prisma.llos.findMany({
      where: {
        courseId: courseOffering.course.id,
        status: 'active',
        ...(lloId && { id: lloId }),
      },
    });

    if (llos.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No LLOs found for this course' },
        { status: 404 }
      );
    }

    // Get assessments for this course offering
    // Note: LLOs are typically assessed through lab assessments
    // For now, we'll use the same assessment structure as CLOs
    const assessments = await prisma.assessments.findMany({
      where: {
        courseOfferingId: courseOfferingId,
        status: {
          in: ['active', 'evaluated', 'published'],
        },
        // Filter for lab assessments if needed
        // type: 'lab',
      },
      include: {
        assessmentItems: {
          where: {
            // LLOs might be mapped differently, for now we'll calculate based on all items
            // In a full implementation, assessment items would have lloId field
          },
        },
      },
    });

    // Calculate LLO attainments
    const calculatedAttainments = await Promise.all(
      llos.map(async (llo) => {
        // For LLOs, we need to calculate based on lab assessments
        // Since assessment items don't have lloId, we'll use a simplified calculation
        // In a full implementation, assessment items would be mapped to LLOs

        // Get all assessment results for students in this course offering
        const assessmentResults = await prisma.studentassessmentresults.findMany({
          where: {
            assessmentId: {
              in: assessments.map((a) => a.id),
            },
            studentId: {
              in: studentIds,
            },
            status: {
              in: ['evaluated', 'published'],
            },
          },
          include: {
            assessment: {
              select: {
                totalMarks: true,
              },
            },
          },
        });

        // Calculate attainment for this LLO
        // Simplified: use overall assessment performance
        // In full implementation, would filter by LLO-mapped items
        let studentsAchieved = 0;
        const studentPerformance = new Map<number, number>();

        assessmentResults.forEach((result) => {
          const percentage = result.percentage || 0;
          const current = studentPerformance.get(result.studentId) || 0;
          studentPerformance.set(result.studentId, Math.max(current, percentage));
        });

        studentPerformance.forEach((percentage) => {
          if (percentage >= threshold) {
            studentsAchieved++;
          }
        });

        const attainmentPercent =
          totalStudents > 0 ? (studentsAchieved / totalStudents) * 100 : 0;

        // Get or create faculty for calculation (use first faculty from sections)
        const firstSection = courseOffering.sections[0];
        const calculatedBy = firstSection?.facultyId || 1; // Fallback to admin user

        // Upsert LLO attainment
        const attainment = await prisma.llosattainments.upsert({
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

        return attainment;
      })
    );

    return NextResponse.json({
      success: true,
      message: `Successfully calculated LLO attainments for ${calculatedAttainments.length} LLO(s)`,
      data: calculatedAttainments,
    });
  } catch (error) {
    console.error('Error calculating LLO attainments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate LLO attainments' },
      { status: 500 }
    );
  }
}

