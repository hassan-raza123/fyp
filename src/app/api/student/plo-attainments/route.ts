import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { aggregatePloScores, weightedAverage, meetsThreshold } from '@/lib/obe';
import { getStudentFromRequest } from '@/lib/auth';
import { plo_status } from '@prisma/client';

const LAB_TYPES = ['lab_exam', 'lab_report'];

export async function GET(request: NextRequest) {
  try {
    const student = await getStudentFromRequest(request);
    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found or unauthorized' },
        { status: 401 }
      );
    }

    const studentId = student.id;
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId');
    const semesterId = searchParams.get('semesterId');

    const targetProgramId = programId ? parseInt(programId) : student.program?.id || null;

    if (!targetProgramId) {
      return NextResponse.json({ success: false, error: 'Program not found' }, { status: 400 });
    }

    if (student.program?.id !== targetProgramId) {
      return NextResponse.json(
        { success: false, error: 'Not enrolled in this program' },
        { status: 403 }
      );
    }

    // Read PLO attainment threshold from program's graduation criteria (fallback: 60)
    const graduationCriteria = await prisma.graduation_criteria.findUnique({
      where: { programId: targetProgramId },
      select: { minPloAttainmentPercent: true },
    });
    const ploThreshold = graduationCriteria?.minPloAttainmentPercent ?? 50;

    // The student's own PLO attainment, aggregated across every course offering
    // that contributed to it — identical to what the graduation tracker reads.
    const studentPloScores = aggregatePloScores(
      await prisma.ploscores.findMany({
        where: { studentId: student.id },
        select: { ploId: true, obtainedMarks: true, totalMarks: true },
      })
    );

    // Fetch PLOs with both CLO and LLO mappings
    const plos = await prisma.plos.findMany({
      where: { programId: targetProgramId, status: plo_status.active },
      include: {
        cloMappings: {
          include: {
            clo: {
              select: { id: true, code: true, description: true, courseId: true },
            },
          },
        },
        lloMappings: {
          include: {
            llo: {
              select: { id: true, code: true, description: true, courseId: true },
            },
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    // Get student's enrolled sections (filtered by semester if provided)
    const studentSections = await prisma.studentsections.findMany({
      where: {
        studentId: studentId,
        status: 'active',
        ...(semesterId && {
          section: { courseOffering: { semesterId: parseInt(semesterId) } },
        }),
      },
      include: {
        section: {
          include: {
            courseOffering: {
              include: {
                course: { select: { id: true, code: true, name: true } },
                semester: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    const courseOfferingIds = studentSections.map((ss) => ss.section.courseOfferingId);

    // ── CLASS CLO ATTAINMENTS ──────────────────────────────────────────────────
    // closattainments has no sectionId — filter by courseOfferingId only.
    const classCLOAttainmentRecords = await prisma.closattainments.findMany({
      where: { courseOfferingId: { in: courseOfferingIds }, status: 'active' },
      orderBy: { calculatedAt: 'desc' },
    });
    const latestCLOAttainments = new Map<number, number>();
    classCLOAttainmentRecords.forEach((att) => {
      if (!latestCLOAttainments.has(att.cloId)) {
        latestCLOAttainments.set(att.cloId, att.attainmentPercent);
      }
    });

    // ── CLASS LLO ATTAINMENTS ──────────────────────────────────────────────────
    const classLLOAttainmentRecords = await prisma.llosattainments.findMany({
      where: { courseOfferingId: { in: courseOfferingIds }, status: 'active' },
      orderBy: { calculatedAt: 'desc' },
    });
    const latestLLOAttainments = new Map<number, number>();
    classLLOAttainmentRecords.forEach((att) => {
      if (!latestLLOAttainments.has(att.lloId)) {
        latestLLOAttainments.set(att.lloId, att.attainmentPercent);
      }
    });

    // ── THEORY ASSESSMENTS → STUDENT PERSONAL CLO ATTAINMENTS ─────────────────
    const theoryAssessments = await prisma.assessments.findMany({
      where: {
        courseOfferingId: { in: courseOfferingIds },
        type: { notIn: LAB_TYPES as any },
        status: { in: ['active', 'completed'] },
      },
      include: {
        assessmentItems: {
          include: { clo: { select: { id: true } } },
        },
      },
    });

    const theoryAssessmentIds = theoryAssessments.map((a) => a.id);
    const studentTheoryResults = await prisma.studentassessmentresults.findMany({
      where: {
        studentId,
        assessmentId: { in: theoryAssessmentIds },
        status: { in: ['evaluated', 'published'] },
      },
      include: {
        itemResults: {
          include: { assessmentItem: { select: { id: true } } },
        },
      },
    });

    // Map cloId → list of item ids + marks
    const cloItemsMap = new Map<number, Array<{ itemId: number; marks: number }>>();
    theoryAssessments.forEach((assessment) => {
      assessment.assessmentItems.forEach((item) => {
        if (item.clo) {
          if (!cloItemsMap.has(item.clo.id)) cloItemsMap.set(item.clo.id, []);
          cloItemsMap.get(item.clo.id)!.push({ itemId: item.id, marks: item.marks });
        }
      });
    });

    // Build a flat map of itemId → obtainedMarks for quick lookup
    const studentItemMarks = new Map<number, number>();
    studentTheoryResults.forEach((result) => {
      result.itemResults.forEach((ir) => {
        studentItemMarks.set(ir.assessmentItem.id, ir.obtainedMarks);
      });
    });

    const studentPersonalCLOAttainments = new Map<number, number>();
    cloItemsMap.forEach((items, cloId) => {
      const total = items.reduce((s, i) => s + i.marks, 0);
      const obtained = items.reduce((s, i) => s + (studentItemMarks.get(i.itemId) ?? 0), 0);
      if (total > 0) studentPersonalCLOAttainments.set(cloId, (obtained / total) * 100);
    });

    // ── LAB ASSESSMENTS → STUDENT PERSONAL LLO ATTAINMENTS ────────────────────
    const labAssessments = await prisma.assessments.findMany({
      where: {
        courseOfferingId: { in: courseOfferingIds },
        type: { in: LAB_TYPES as any },
        status: { in: ['active', 'completed'] },
      },
      include: {
        assessmentItems: {
          include: { llo: { select: { id: true } } },
        },
      },
    });

    const labAssessmentIds = labAssessments.map((a) => a.id);
    const studentLabResults = await prisma.studentassessmentresults.findMany({
      where: {
        studentId,
        assessmentId: { in: labAssessmentIds },
        status: { in: ['evaluated', 'published'] },
      },
      include: {
        itemResults: {
          include: { assessmentItem: { select: { id: true } } },
        },
      },
    });

    const lloItemsMap = new Map<number, Array<{ itemId: number; marks: number }>>();
    labAssessments.forEach((assessment) => {
      assessment.assessmentItems.forEach((item: any) => {
        if (item.llo) {
          if (!lloItemsMap.has(item.llo.id)) lloItemsMap.set(item.llo.id, []);
          lloItemsMap.get(item.llo.id)!.push({ itemId: item.id, marks: item.marks });
        }
      });
    });

    const studentLabItemMarks = new Map<number, number>();
    studentLabResults.forEach((result) => {
      result.itemResults.forEach((ir) => {
        studentLabItemMarks.set(ir.assessmentItem.id, ir.obtainedMarks);
      });
    });

    const studentPersonalLLOAttainments = new Map<number, number>();
    lloItemsMap.forEach((items, lloId) => {
      const total = items.reduce((s, i) => s + i.marks, 0);
      const obtained = items.reduce((s, i) => s + (studentLabItemMarks.get(i.itemId) ?? 0), 0);
      if (total > 0) studentPersonalLLOAttainments.set(lloId, (obtained / total) * 100);
    });

    // ── BUILD PLO ATTAINMENTS ──────────────────────────────────────────────────
    const ploAttainments = plos.map((plo) => {
      const contributingClos = plo.cloMappings.map((mapping) => ({
        cloId: mapping.clo.id,
        cloCode: mapping.clo.code,
        cloDescription: mapping.clo.description,
        weight: mapping.weight,
        studentAttainment: parseFloat(
          (studentPersonalCLOAttainments.get(mapping.clo.id) ?? 0).toFixed(2)
        ),
        classAttainment: parseFloat(
          (latestCLOAttainments.get(mapping.clo.id) ?? 0).toFixed(2)
        ),
      }));

      const contributingLlos = (plo.lloMappings as any[]).map((mapping: any) => ({
        lloId: mapping.llo.id,
        lloCode: mapping.llo.code,
        lloDescription: mapping.llo.description,
        weight: mapping.weight,
        studentAttainment: parseFloat(
          (studentPersonalLLOAttainments.get(mapping.llo.id) ?? 0).toFixed(2)
        ),
        classAttainment: parseFloat(
          (latestLLOAttainments.get(mapping.llo.id) ?? 0).toFixed(2)
        ),
      }));

      // The student's own PLO figure comes from `ploscores` — the same source
      // the graduation tracker uses. Deriving it separately here produced a
      // different number for the same student on two different screens.
      const studentAgg = studentPloScores.get(plo.id);
      const studentPLOAttainment = studentAgg?.percentage ?? null;

      // The class figure stays a weighted roll-up of calculated CLO/LLO
      // attainments, but outcomes that have not been calculated are skipped
      // rather than treated as zero, which used to drag the average down.
      const classContributions = [
        ...contributingClos
          .filter((c) => latestCLOAttainments.has(c.cloId))
          .map((c) => ({ attainment: c.classAttainment, weight: c.weight })),
        ...contributingLlos
          .filter((l) => latestLLOAttainments.has(l.lloId))
          .map((l) => ({ attainment: l.classAttainment, weight: l.weight })),
      ];
      const classPLOAttainment = weightedAverage(classContributions);

      const threshold = ploThreshold;

      return {
        ploId: plo.id,
        ploCode: plo.code,
        description: plo.description,
        studentAttainment: {
          percentage:
            studentPLOAttainment === null
              ? null
              : parseFloat(studentPLOAttainment.toFixed(2)),
          obtainedMarks: studentAgg?.obtained ?? null,
          totalMarks: studentAgg?.total ?? null,
          status:
            studentPLOAttainment === null
              ? 'not_assessed'
              : meetsThreshold(studentPLOAttainment, threshold)
                ? 'attained'
                : 'not_attained',
        },
        classAttainment: {
          percentage:
            classPLOAttainment === null
              ? null
              : parseFloat(classPLOAttainment.toFixed(2)),
          status:
            classPLOAttainment === null
              ? 'not_assessed'
              : meetsThreshold(classPLOAttainment, threshold)
                ? 'attained'
                : 'not_attained',
        },
        threshold,
        contributingClos,
        contributingLlos,
      };
    });

    const totalPLOs = ploAttainments.length;
    const attainedPLOs = ploAttainments.filter(
      (plo) => plo.studentAttainment.status === 'attained'
    ).length;
    const overallProgress = totalPLOs > 0 ? (attainedPLOs / totalPLOs) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        program: {
          id: student.program?.id || 0,
          code: student.program?.code || '',
          name: student.program?.name || '',
        },
        semester: semesterId
          ? studentSections[0]?.section.courseOffering.semester.name || null
          : null,
        // Student view shows direct (assessment-based) attainment only.
        // The official PLO attainment (admin view) additionally includes
        // 30% indirect weight from survey responses.
        isDirectOnly: true,
        overallProgress: {
          totalPLOs,
          attainedPLOs,
          remainingPLOs: totalPLOs - attainedPLOs,
          progressPercentage: parseFloat(overallProgress.toFixed(2)),
        },
        ploAttainments,
      },
    });
  } catch (error) {
    console.error('Error fetching student PLO attainments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch PLO attainments' },
      { status: 500 }
    );
  }
}
