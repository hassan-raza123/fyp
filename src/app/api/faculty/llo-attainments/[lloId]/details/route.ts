import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFacultyIdFromRequest } from '@/lib/auth';

const LAB_ASSESSMENT_TYPES = ['lab_exam', 'lab_report'];

// GET - Get detailed LLO attainment information
export async function GET(
  req: NextRequest,
  { params: _params }: { params: Promise<{ lloId: string }> }
) {
  const params = await _params;
  try {
    const lloId = parseInt(params.lloId);
    if (isNaN(lloId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid LLO ID' },
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

    const { searchParams } = new URL(req.url);
    const courseOfferingId = searchParams.get('courseOfferingId');

    // Get the LLO
    const llo = await prisma.llos.findUnique({
      where: { id: lloId },
      include: {
        course: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    if (!llo) {
      return NextResponse.json(
        { success: false, error: 'LLO not found' },
        { status: 404 }
      );
    }

    // Get faculty's sections for this course
    const sections = await prisma.sections.findMany({
      where: {
        facultyId: facultyId,
        status: 'active',
        courseOffering: {
          courseId: llo.courseId,
          ...(courseOfferingId && { id: parseInt(courseOfferingId) }),
        },
      },
      include: {
        courseOffering: {
          include: {
            semester: { select: { id: true, name: true } },
          },
        },
      },
    });

    const courseOfferingIds = sections.map((s) => s.courseOfferingId);

    // Get LLO attainments for this faculty's course offerings
    const attainments = await prisma.llosattainments.findMany({
      where: {
        lloId: lloId,
        courseOfferingId: { in: courseOfferingIds },
        status: 'active',
      },
      include: {
        courseOffering: {
          include: {
            semester: { select: { name: true } },
            sections: {
              where: { facultyId: facultyId },
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { calculatedAt: 'desc' },
    });

    // Get lab assessments mapped to this LLO (conducted by this faculty)
    const labAssessments = await prisma.assessments.findMany({
      where: {
        courseOfferingId: { in: courseOfferingIds },
        conductedBy: facultyId,
        type: { in: LAB_ASSESSMENT_TYPES as any },
        assessmentItems: { some: { lloId: lloId } },
      },
      include: {
        assessmentItems: {
          where: { lloId: lloId },
          select: { id: true, questionNo: true, description: true, marks: true },
        },
        courseOffering: {
          include: { semester: { select: { name: true } } },
        },
      },
    });

    // Student-wise breakdown for the latest attainment
    let studentBreakdown: any[] = [];
    if (attainments.length > 0) {
      const latestAttainment = attainments[0];
      const sectionIds = latestAttainment.courseOffering.sections.map((s) => s.id);

      const studentSections = await prisma.studentsections.findMany({
        where: { sectionId: { in: sectionIds }, status: 'active' },
        include: {
          student: {
            include: {
              user: { select: { first_name: true, last_name: true } },
            },
          },
        },
      });

      const assessmentIds = labAssessments
        .filter((a) => a.courseOfferingId === latestAttainment.courseOfferingId)
        .map((a) => a.id);
      const itemIds = labAssessments
        .filter((a) => a.courseOfferingId === latestAttainment.courseOfferingId)
        .flatMap((a) => a.assessmentItems.map((item) => item.id));

      const studentAssessmentResults = await prisma.studentassessmentresults.findMany({
        where: {
          studentId: { in: studentSections.map((ss) => ss.studentId) },
          assessmentId: { in: assessmentIds },
          status: { in: ['evaluated', 'published'] },
        },
        select: { id: true, studentId: true },
      });

      const resultIdToStudentId = new Map<number, number>();
      studentAssessmentResults.forEach((r) => resultIdToStudentId.set(r.id, r.studentId));

      const itemResults = await prisma.studentassessmentitemresults.findMany({
        where: {
          assessmentItemId: { in: itemIds },
          studentAssessmentResultId: { in: studentAssessmentResults.map((r) => r.id) },
        },
        include: {
          assessmentItem: { select: { marks: true, lloId: true } },
        },
      });

      const studentPerformance = new Map<number, { obtained: number; total: number; items: number }>();
      itemResults.forEach((ir) => {
        const studentId = resultIdToStudentId.get(ir.studentAssessmentResultId);
        if (!studentId || ir.assessmentItem.lloId !== lloId) return;
        if (!studentPerformance.has(studentId)) {
          studentPerformance.set(studentId, { obtained: 0, total: 0, items: 0 });
        }
        const perf = studentPerformance.get(studentId)!;
        perf.obtained += ir.obtainedMarks;
        perf.total += ir.assessmentItem.marks;
        perf.items++;
      });

      studentBreakdown = studentSections.map((ss) => {
        const perf = studentPerformance.get(ss.studentId) || { obtained: 0, total: 0, items: 0 };
        const percentage = perf.total > 0 ? (perf.obtained / perf.total) * 100 : 0;
        return {
          studentId: ss.student.id,
          rollNumber: ss.student.rollNumber,
          name: `${ss.student.user.first_name} ${ss.student.user.last_name}`,
          obtainedMarks: perf.obtained,
          totalMarks: perf.total,
          percentage,
          achieved: percentage >= latestAttainment.threshold,
          itemsCount: perf.items,
        };
      });
    }

    // Assessment-wise breakdown
    const assessmentBreakdown = labAssessments.map((assessment) => ({
      assessmentId: assessment.id,
      title: assessment.title,
      type: assessment.type,
      semester: assessment.courseOffering.semester.name,
      totalMarks: assessment.assessmentItems.reduce((sum, item) => sum + item.marks, 0),
      itemCount: assessment.assessmentItems.length,
      items: assessment.assessmentItems.map((item) => ({
        id: item.id,
        questionNo: item.questionNo,
        description: item.description,
        marks: item.marks,
      })),
    }));

    return NextResponse.json({
      success: true,
      data: {
        llo: {
          id: llo.id,
          code: llo.code,
          description: llo.description,
          bloomLevel: llo.bloomLevel,
          course: llo.course,
        },
        attainments: attainments.map((a) => ({
          id: a.id,
          courseOfferingId: a.courseOfferingId,
          semester: a.courseOffering.semester.name,
          sections: a.courseOffering.sections.map((s) => ({ id: s.id, name: s.name })),
          totalStudents: a.totalStudents,
          studentsAchieved: a.studentsAchieved,
          threshold: a.threshold,
          attainmentPercent: a.attainmentPercent,
          status: a.attainmentPercent >= a.threshold ? 'attained' : 'not_attained',
          calculatedAt: a.calculatedAt.toISOString(),
        })),
        assessmentBreakdown,
        studentBreakdown,
      },
    });
  } catch (error) {
    console.error('Error fetching LLO attainment details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch LLO attainment details' },
      { status: 500 }
    );
  }
}
