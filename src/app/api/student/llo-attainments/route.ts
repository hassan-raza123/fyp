import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStudentIdFromRequest } from '@/lib/auth';

const LAB_ASSESSMENT_TYPES = ['lab_exam', 'lab_report'];

export async function GET(request: NextRequest) {
  try {
    const studentId = await getStudentIdFromRequest(request);
    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Student not found or unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');

    if (!sectionId) {
      return NextResponse.json(
        { success: false, error: 'Section ID is required' },
        { status: 400 }
      );
    }

    // Verify student is enrolled in this section
    const studentSection = await prisma.studentsections.findFirst({
      where: {
        studentId: studentId,
        sectionId: parseInt(sectionId),
        status: 'active',
      },
      include: {
        section: {
          include: {
            courseOffering: {
              include: {
                course: {
                  select: { id: true, code: true, name: true, labHours: true },
                },
                semester: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!studentSection) {
      return NextResponse.json(
        { success: false, error: 'Not enrolled in this section' },
        { status: 403 }
      );
    }

    const course = studentSection.section.courseOffering.course;

    // If the course has no lab hours, return empty
    if (course.labHours === 0) {
      return NextResponse.json({
        success: true,
        data: {
          section: {
            id: studentSection.section.id,
            name: studentSection.section.name,
            course,
            semester: studentSection.section.courseOffering.semester,
          },
          lloAttainments: [],
          hasLabComponent: false,
        },
      });
    }

    const courseOfferingId = studentSection.section.courseOfferingId;

    // Get all active LLOs for this course
    const llos = await prisma.llos.findMany({
      where: { courseId: course.id, status: 'active' },
      orderBy: { code: 'asc' },
    });

    // Get class-level LLO attainments (calculated by faculty)
    const classAttainments = await prisma.llosattainments.findMany({
      where: {
        lloId: { in: llos.map((l) => l.id) },
        courseOfferingId,
        status: 'active',
      },
      orderBy: { calculatedAt: 'desc' },
    });

    // Get latest class attainment per LLO
    const latestClassAttainment = new Map<number, typeof classAttainments[0]>();
    classAttainments.forEach((a) => {
      if (!latestClassAttainment.has(a.lloId)) {
        latestClassAttainment.set(a.lloId, a);
      }
    });

    // Get lab assessments for this course offering that have items mapped to LLOs
    const labAssessments = await prisma.assessments.findMany({
      where: {
        courseOfferingId,
        type: { in: LAB_ASSESSMENT_TYPES as any },
        status: { in: ['active', 'completed'] },
        assessmentItems: { some: { lloId: { in: llos.map((l) => l.id) } } },
      },
      include: {
        assessmentItems: {
          where: { lloId: { in: llos.map((l) => l.id) } },
          select: { id: true, marks: true, lloId: true },
        },
      },
    });

    // Get this student's results for those assessments
    const assessmentIds = labAssessments.map((a) => a.id);
    const studentResults = await prisma.studentassessmentresults.findMany({
      where: {
        studentId,
        assessmentId: { in: assessmentIds },
        status: { in: ['evaluated', 'published'] },
      },
      include: {
        itemResults: {
          include: {
            assessmentItem: { select: { id: true, marks: true, lloId: true } },
          },
        },
        assessment: { select: { id: true, title: true, type: true } },
      },
    });

    // Build student LLO attainment per LLO
    const lloAttainments = llos.map((llo) => {
      const classAtt = latestClassAttainment.get(llo.id) ?? null;
      const threshold = classAtt?.threshold ?? 50;

      let studentObtained = 0;
      let studentTotal = 0;
      const assessmentBreakdown: Array<{
        assessmentId: number;
        assessmentTitle: string;
        assessmentType: string;
        totalMarks: number;
        obtainedMarks: number;
        percentage: number;
      }> = [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (labAssessments as any[]).forEach((assessment: any) => {
        const lloItems: any[] = assessment.assessmentItems.filter(
          (item: any) => item.lloId === llo.id
        );
        if (lloItems.length === 0) return;

        const assessmentTotal = lloItems.reduce((s: number, i: any) => s + i.marks, 0);
        studentTotal += assessmentTotal;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: any = (studentResults as any[]).find(
          (r: any) => r.assessmentId === assessment.id
        );
        let obtained = 0;
        if (result) {
          obtained = result.itemResults
            .filter((ir: any) => lloItems.some((i: any) => i.id === ir.assessmentItem.id))
            .reduce((s: number, ir: any) => s + ir.obtainedMarks, 0);
          studentObtained += obtained;
        }

        assessmentBreakdown.push({
          assessmentId: assessment.id,
          assessmentTitle: assessment.title,
          assessmentType: assessment.type,
          totalMarks: assessmentTotal,
          obtainedMarks: obtained,
          percentage: assessmentTotal > 0 ? (obtained / assessmentTotal) * 100 : 0,
        });
      });

      const studentPercent =
        studentTotal > 0 ? (studentObtained / studentTotal) * 100 : 0;

      return {
        llo: {
          id: llo.id,
          code: llo.code,
          description: llo.description,
          bloomLevel: llo.bloomLevel,
        },
        studentAttainment: {
          percentage: parseFloat(studentPercent.toFixed(2)),
          obtainedMarks: parseFloat(studentObtained.toFixed(1)),
          totalMarks: parseFloat(studentTotal.toFixed(1)),
          status: studentPercent >= threshold ? 'attained' : 'not_attained',
        },
        classAttainment: classAtt
          ? {
              percentage: classAtt.attainmentPercent,
              threshold: classAtt.threshold,
              studentsAchieved: classAtt.studentsAchieved,
              totalStudents: classAtt.totalStudents,
              calculatedAt: classAtt.calculatedAt,
            }
          : null,
        assessmentBreakdown,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        section: {
          id: studentSection.section.id,
          name: studentSection.section.name,
          course,
          semester: studentSection.section.courseOffering.semester,
        },
        lloAttainments,
        hasLabComponent: true,
      },
    });
  } catch (error) {
    console.error('Error fetching student LLO attainments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch LLO attainments' },
      { status: 500 }
    );
  }
}
