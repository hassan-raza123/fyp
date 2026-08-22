import { prisma } from './prisma';
import type { ReportSection } from './obe-report';
import { cloEvidenceAdmissibility } from './obe';
import { attributesFor, type ComplexityKind } from '@/constants/complexity';

/**
 * The Course File.
 *
 * PEC's unit of evidence is not the semester summary — it is the course file,
 * assembled per course offering and handed to a Programme Evaluator. Until now
 * the system produced programme-level reports only, so a course team facing a
 * visit still had to build this by hand, which is the exact work the product
 * claims to remove.
 *
 * What a PEC evaluator expects to find, and what this assembles:
 *
 *   1. Course particulars and the teaching team
 *   2. CLOs, each with its Bloom level and PLO mapping
 *   3. The assessment plan, with weightings that sum to 100
 *   4. Complex Engineering Problems / Activities and their attributes
 *   5. CLO attainment, with the evidence behind each figure
 *   6. Where attainment fell short, the CQI action taken
 *
 * Two things this cannot yet include, and says so rather than omitting
 * silently: samples of marked student work, and the question papers
 * themselves. Both need file storage, which the product does not have.
 */

export interface CourseFilePayload {
  generatedAt: string;
  courseOffering: {
    id: number;
    courseCode: string;
    courseName: string;
    creditHours: number | null;
    semester: string;
    program: string | null;
  };
  sections: ReportSection[];
  /** Gaps an evaluator would raise, surfaced before the visit rather than at it. */
  findings: string[];
}

export async function buildCourseFile(
  courseOfferingId: number
): Promise<CourseFilePayload> {
  const findings: string[] = [];

  const offering = await prisma.courseofferings.findUnique({
    where: { id: courseOfferingId },
    select: {
      id: true,
      course: {
        select: {
          id: true, code: true, name: true, creditHours: true,
          clos: {
            select: {
              id: true, code: true, description: true, bloomLevel: true, bloomDomain: true,
              ploMappings: {
                select: { weight: true, plo: { select: { code: true, description: true } } },
              },
            },
            orderBy: { code: 'asc' },
          },
        },
      },
      semester: { select: { name: true } },
      assessments: {
        select: {
          id: true, title: true, type: true, totalMarks: true, weightage: true,
          assessmentItems: {
            select: {
              id: true, questionNo: true, marks: true,
              complexity: true, complexAttributes: true,
              clo: { select: { code: true } },
              rubric: { select: { id: true, title: true } },
            },
            orderBy: { questionNo: 'asc' },
          },
        },
        orderBy: { type: 'asc' },
      },
    },
  });

  if (!offering) {
    throw new Error(`Course offering ${courseOfferingId} not found`);
  }

  const course = offering.course;
  const sections: ReportSection[] = [];

  // ── 2. CLOs and their PLO mapping ─────────────────────────────────────────
  sections.push({
    heading: 'Course Learning Outcomes and PLO Mapping',
    note: 'PEC expects 3–7 measurable CLOs, each mapped to at least one PLO.',
    columns: ['CLO', 'Description', 'Bloom Level', 'Mapped PLOs'],
    rows: course.clos.map((c) => [
      c.code,
      c.description,
      c.bloomLevel ?? 'Not set',
      c.ploMappings.map((m) => m.plo.code).join(', ') || 'UNMAPPED',
    ]),
  });

  if (course.clos.length < 3 || course.clos.length > 7) {
    findings.push(
      `This course has ${course.clos.length} CLOs. PEC expects between 3 and 7; an evaluator will ask why.`
    );
  }
  for (const c of course.clos) {
    if (c.ploMappings.length === 0) {
      findings.push(`${c.code} is not mapped to any PLO, so it contributes nothing to programme attainment.`);
    }
    if (!c.bloomLevel) {
      findings.push(`${c.code} has no Bloom level set, so its cognitive level cannot be evidenced.`);
    }
  }

  // ── 3. Assessment plan ────────────────────────────────────────────────────
  const totalWeight = offering.assessments.reduce((s, a) => s + (a.weightage ?? 0), 0);
  sections.push({
    heading: 'Assessment Plan',
    note: `Weightings total ${totalWeight}%.`,
    columns: ['Assessment', 'Type', 'Total Marks', 'Weightage %', 'Items', 'CLOs Covered'],
    rows: offering.assessments.map((a) => [
      a.title,
      a.type,
      a.totalMarks,
      a.weightage,
      a.assessmentItems.length,
      [...new Set(a.assessmentItems.map((i) => i.clo?.code).filter(Boolean))].join(', ') || '—',
    ]),
  });

  if (Math.round(totalWeight) !== 100) {
    findings.push(
      `Assessment weightings total ${totalWeight}%, not 100%. Attainment computed from these is not defensible.`
    );
  }

  // ── 4. Complex Engineering Problems / Activities ──────────────────────────
  const complexItems = offering.assessments.flatMap((a) =>
    a.assessmentItems
      .filter((i) => i.complexity)
      .map((i) => ({ assessment: a.title, item: i }))
  );

  sections.push({
    heading: 'Complex Engineering Problems / Activities',
    note:
      'PEC requires core engineering courses and the FYDP to include CEPs, evaluated by a pre-defined rubric and by no other means.',
    columns: ['Assessment', 'Item', 'Kind', 'Attributes', 'Marks', 'Rubric'],
    rows: complexItems.length
      ? complexItems.map(({ assessment, item }) => {
          const kind = item.complexity as ComplexityKind;
          const codes = Array.isArray(item.complexAttributes)
            ? (item.complexAttributes as string[])
            : [];
          const known = new Set(attributesFor(kind).map((a) => a.code));
          return [
            assessment,
            item.questionNo,
            kind.toUpperCase(),
            codes.filter((c) => known.has(c)).join(', ') || 'NONE DECLARED',
            item.marks,
            item.rubric?.title ?? 'NO RUBRIC',
          ];
        })
      : [],
  });

  if (complexItems.length === 0) {
    findings.push(
      'No Complex Engineering Problem or Activity is recorded for this course. If it is a core engineering course or the FYDP, PEC requires at least one.'
    );
  }
  for (const { item } of complexItems) {
    if (!item.rubric) {
      findings.push(
        `Item ${item.questionNo} is marked ${String(item.complexity).toUpperCase()} but has no rubric. PEC accepts no other means of evaluating it.`
      );
    }
  }

  // ── 5. CLO attainment and evidence admissibility ──────────────────────────
  const attainments = await prisma.closattainments.findMany({
    where: { courseOfferingId },
    select: {
      attainmentPercent: true,
      isAchieved: true,
      clo: { select: { code: true, bloomDomain: true } },
    },
  });

  // Which assessment types actually carried each CLO — PEC requires the final
  // examination to be among them for a cognitive CLO.
  const typesByClo = new Map<string, Set<string>>();
  for (const a of offering.assessments) {
    for (const i of a.assessmentItems) {
      if (!i.clo?.code) continue;
      if (!typesByClo.has(i.clo.code)) typesByClo.set(i.clo.code, new Set());
      typesByClo.get(i.clo.code)!.add(a.type);
    }
  }

  sections.push({
    heading: 'CLO Attainment',
    columns: ['CLO', 'Attainment %', 'Target Met', 'Assessed By', 'Evidence Admissible'],
    rows: attainments.map((a) => {
      const types = typesByClo.get(a.clo.code) ?? new Set<string>();
      const { admissible, reason } = cloEvidenceAdmissibility(a.clo.bloomDomain, types);
      if (!admissible) findings.push(`${a.clo.code}: ${reason}`);
      return [
        a.clo.code,
        a.attainmentPercent === null ? 'Not calculable' : `${a.attainmentPercent}%`,
        a.isAchieved === null ? 'No target' : a.isAchieved ? 'Yes' : 'No',
        [...types].join(', ') || '—',
        admissible ? 'Yes' : 'No — final exam missing',
      ];
    }),
  });

  // ── 6. CQI ────────────────────────────────────────────────────────────────
  const plans = await prisma.action_plans.findMany({
    where: { courseOfferingId },
    select: {
      rootCause: true, actionTaken: true, expectedOutcome: true,
      status: true, targetDate: true, isLoopClosed: true, actualOutcome: true,
      plo: { select: { code: true } }, clo: { select: { code: true } },
    },
  });

  sections.push({
    heading: 'Continuous Quality Improvement',
    note: 'Actions raised where an outcome fell short of its target.',
    columns: ['Outcome', 'Root Cause', 'Action Taken', 'Status', 'Target Date', 'Loop Closed'],
    rows: plans.map((p) => [
      p.clo?.code ?? p.plo.code,
      p.rootCause ?? '—',
      p.actionTaken ?? '—',
      p.status,
      p.targetDate ? p.targetDate.toISOString().slice(0, 10) : '—',
      // Closing the loop — acting, then re-measuring — is the part evaluators
      // press on. An open plan is a plan, not evidence of improvement.
      p.isLoopClosed ? `Yes — ${p.actualOutcome ?? 'outcome recorded'}` : 'No',
    ]),
  });

  // An action plan that was never re-measured is not evidence of improvement.
  // PEC presses hardest on loop closure, so surface open loops by name.
  const openLoops = plans.filter((pl) => !pl.isLoopClosed);
  if (openLoops.length) {
    findings.push(
      `${openLoops.length} CQI action(s) recorded but not closed. PEC expects the loop closed: act, then re-measure and record the new attainment.`
    );
  }

  const missed = attainments.filter((a) => a.isAchieved === false);
  if (missed.length && plans.length === 0) {
    findings.push(
      `${missed.length} outcome(s) missed their target and no CQI action is recorded. Closing the loop is what PEC checks hardest.`
    );
  }

  // ── Evidence the product cannot hold yet ──────────────────────────────────
  findings.push(
    'Question papers and samples of marked student work are not attached: the system has no file storage. A PEC course file is expected to carry best, average and weakest scripts per assessment.'
  );

  return {
    generatedAt: new Date().toISOString(),
    courseOffering: {
      id: offering.id,
      courseCode: course.code,
      courseName: course.name,
      creditHours: course.creditHours ?? null,
      semester: offering.semester?.name ?? '—',
      program: null,
    },
    sections,
    findings,
  };
}
