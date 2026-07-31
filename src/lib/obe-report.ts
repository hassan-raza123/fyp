import { prisma } from './prisma';
import { obe_report_type } from '@prisma/client';
import { weightedAverage, findUnattainedOutcomes } from './obe';
import { getSectionAttendanceSummary } from './attendance';

/**
 * OBE report generation.
 *
 * Producing a report previously meant inserting a metadata row — a title, a
 * type and a timestamp — with no content anywhere. This builds the actual
 * report body and snapshots it onto `obereports.data`, so a report stays
 * reproducible even after attainments are recalculated.
 */

export interface ReportSection {
  heading: string;
  /** Optional prose shown above the table */
  note?: string;
  columns: string[];
  rows: (string | number | null)[][];
}

export interface ReportPayload {
  reportType: obe_report_type;
  generatedAt: string;
  program: { id: number; code: string; name: string } | null;
  semester: { id: number; name: string } | null;
  summary: Record<string, string | number | null>;
  sections: ReportSection[];
  /** Present when the report could not be fully built */
  warnings: string[];
}

const pct = (value: number | null | undefined): string =>
  value === null || value === undefined ? 'N/A' : `${value.toFixed(1)}%`;

const verdict = (isAchieved: boolean | null): string =>
  isAchieved === null ? 'No target set' : isAchieved ? 'Achieved' : 'Not achieved';

// ─── CLO attainment ──────────────────────────────────────────────────────────

async function buildCloSection(
  programId: number,
  semesterId: number
): Promise<ReportSection> {
  const attainments = await prisma.closattainments.findMany({
    where: {
      courseOffering: {
        semesterId,
        course: { programMappings: { some: { A: programId } } },
      },
    },
    select: {
      attainmentPercent: true,
      threshold: true,
      targetThreshold: true,
      isAchieved: true,
      totalStudents: true,
      studentsAchieved: true,
      unassessedStudents: true,
      clo: { select: { code: true, description: true, bloomLevel: true } },
      courseOffering: { select: { course: { select: { code: true } } } },
    },
    orderBy: [{ courseOfferingId: 'asc' }, { cloId: 'asc' }],
  });

  return {
    heading: 'CLO Attainment',
    note:
      'Attainment is the share of assessed students who met the performance threshold. ' +
      'Unassessed students are excluded from the denominator and reported separately.',
    columns: [
      'Course',
      'CLO',
      'Bloom Level',
      'Perf. Threshold',
      'Assessed',
      'Achieved',
      'Unassessed',
      'Attainment',
      'Target',
      'Verdict',
    ],
    rows: attainments.map((a) => [
      a.courseOffering.course.code,
      a.clo.code,
      a.clo.bloomLevel ?? '—',
      pct(a.threshold),
      a.totalStudents,
      a.studentsAchieved,
      a.unassessedStudents,
      pct(a.attainmentPercent),
      a.targetThreshold === null ? '—' : pct(a.targetThreshold),
      verdict(a.isAchieved),
    ]),
  };
}

// ─── LLO attainment ──────────────────────────────────────────────────────────

async function buildLloSection(
  programId: number,
  semesterId: number
): Promise<ReportSection> {
  const attainments = await prisma.llosattainments.findMany({
    where: {
      courseOffering: {
        semesterId,
        course: { programMappings: { some: { A: programId } } },
      },
    },
    select: {
      attainmentPercent: true,
      threshold: true,
      targetThreshold: true,
      isAchieved: true,
      totalStudents: true,
      studentsAchieved: true,
      unassessedStudents: true,
      llo: { select: { code: true, description: true } },
      courseOffering: { select: { course: { select: { code: true } } } },
    },
    orderBy: [{ courseOfferingId: 'asc' }, { lloId: 'asc' }],
  });

  return {
    heading: 'LLO Attainment (Lab Outcomes)',
    columns: [
      'Course',
      'LLO',
      'Perf. Threshold',
      'Assessed',
      'Achieved',
      'Unassessed',
      'Attainment',
      'Target',
      'Verdict',
    ],
    rows: attainments.map((a) => [
      a.courseOffering.course.code,
      a.llo.code,
      pct(a.threshold),
      a.totalStudents,
      a.studentsAchieved,
      a.unassessedStudents,
      pct(a.attainmentPercent),
      a.targetThreshold === null ? '—' : pct(a.targetThreshold),
      verdict(a.isAchieved),
    ]),
  };
}

// ─── PLO attainment ──────────────────────────────────────────────────────────

async function buildPloSection(
  programId: number,
  semesterId: number
): Promise<ReportSection> {
  const attainments = await prisma.ploattainments.findMany({
    where: { programId, semesterId },
    select: {
      attainmentPercent: true,
      directAttainment: true,
      indirectAttainment: true,
      threshold: true,
      isAchieved: true,
      totalStudents: true,
      studentsAchieved: true,
      plo: { select: { code: true, description: true } },
    },
    orderBy: { ploId: 'asc' },
  });

  return {
    heading: 'PLO Attainment',
    note:
      'Direct attainment rolls up weighted CLO/LLO attainment; indirect comes from ' +
      'course-exit, program-exit, alumni and employer surveys.',
    columns: [
      'PLO',
      'Description',
      'Direct',
      'Indirect',
      'Combined',
      'Threshold',
      'Students Assessed',
      'Students Achieved',
      'Verdict',
    ],
    rows: attainments.map((a) => [
      a.plo.code,
      a.plo.description,
      pct(a.directAttainment),
      a.indirectAttainment === null ? 'No survey data' : pct(a.indirectAttainment),
      pct(a.attainmentPercent),
      pct(a.threshold),
      a.totalStudents,
      a.studentsAchieved,
      verdict(a.isAchieved),
    ]),
  };
}

// ─── PEO attainment ──────────────────────────────────────────────────────────

async function buildPeoSection(
  programId: number,
  semesterId: number
): Promise<ReportSection> {
  const [peos, ploAttainments, criteria] = await Promise.all([
    prisma.peos.findMany({
      where: { programId, status: { not: 'archived' } },
      select: {
        code: true,
        description: true,
        ploMappings: {
          select: { ploId: true, weight: true, plo: { select: { code: true } } },
        },
      },
      orderBy: { code: 'asc' },
    }),
    prisma.ploattainments.findMany({
      where: { programId, semesterId },
      select: { ploId: true, attainmentPercent: true },
    }),
    prisma.graduation_criteria.findUnique({
      where: { programId },
      select: { minPloAttainmentPercent: true },
    }),
  ]);

  const threshold = criteria?.minPloAttainmentPercent ?? 50;
  const byPlo = new Map(ploAttainments.map((a) => [a.ploId, a.attainmentPercent]));

  return {
    heading: 'PEO Attainment',
    note: 'Derived from the weighted attainment of the PLOs mapped to each PEO.',
    columns: ['PEO', 'Description', 'Mapped PLOs', 'Attainment', 'Threshold', 'Verdict'],
    rows: peos.map((peo) => {
      const contributions = peo.ploMappings
        .filter((m) => byPlo.has(m.ploId))
        .map((m) => ({
          attainment: byPlo.get(m.ploId) as number,
          weight: m.weight,
        }));
      const attainment = weightedAverage(contributions);

      return [
        peo.code,
        peo.description,
        peo.ploMappings.map((m) => m.plo.code).join(', ') || '—',
        pct(attainment),
        pct(threshold),
        attainment === null
          ? 'No data'
          : attainment >= threshold
            ? 'Achieved'
            : 'Not achieved',
      ];
    }),
  };
}

// ─── Course-wise summary ─────────────────────────────────────────────────────

async function buildCourseWiseSection(
  programId: number,
  semesterId: number
): Promise<ReportSection> {
  const offerings = await prisma.courseofferings.findMany({
    where: {
      semesterId,
      course: { programMappings: { some: { A: programId } } },
    },
    select: {
      id: true,
      isResultsLocked: true,
      course: { select: { code: true, name: true, creditHours: true } },
      closAttainments: { select: { attainmentPercent: true, isAchieved: true } },
      llosAttainments: { select: { attainmentPercent: true, isAchieved: true } },
      sections: {
        select: {
          studentsections: { where: { status: 'active' }, select: { studentId: true } },
        },
      },
    },
    orderBy: { courseId: 'asc' },
  });

  return {
    heading: 'Course-wise Summary',
    columns: [
      'Course',
      'Title',
      'Credit Hours',
      'Students',
      'Outcomes Assessed',
      'Outcomes Achieved',
      'Avg Attainment',
      'Results Locked',
    ],
    rows: offerings.map((o) => {
      const outcomes = [...o.closAttainments, ...o.llosAttainments];
      const achieved = outcomes.filter((x) => x.isAchieved === true).length;
      const avg =
        outcomes.length > 0
          ? outcomes.reduce((s, x) => s + x.attainmentPercent, 0) / outcomes.length
          : null;
      const students = new Set(
        o.sections.flatMap((s) => s.studentsections.map((ss) => ss.studentId))
      ).size;

      return [
        o.course.code,
        o.course.name,
        o.course.creditHours,
        students,
        outcomes.length,
        achieved,
        pct(avg),
        o.isResultsLocked ? 'Yes' : 'No',
      ];
    }),
  };
}

// ─── Action plans (closing the loop) ─────────────────────────────────────────

async function buildActionPlanSection(
  programId: number,
  semesterId: number
): Promise<ReportSection> {
  const plans = await prisma.action_plans.findMany({
    where: { semesterId, plo: { programId } },
    select: {
      attainmentValue: true,
      threshold: true,
      rootCause: true,
      actionTaken: true,
      expectedOutcome: true,
      actualOutcome: true,
      status: true,
      isLoopClosed: true,
      plo: { select: { code: true } },
      clo: { select: { code: true } },
      llo: { select: { code: true } },
      courseOffering: { select: { course: { select: { code: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return {
    heading: 'Action Plans (CQI)',
    note: 'Corrective actions raised against outcomes that missed their target.',
    columns: [
      'Outcome',
      'Course',
      'Attainment',
      'Target',
      'Root Cause',
      'Action Taken',
      'Status',
      'Loop Closed',
    ],
    rows: plans.map((p) => [
      p.clo?.code ?? p.llo?.code ?? p.plo.code,
      p.courseOffering?.course.code ?? 'Program-level',
      pct(p.attainmentValue),
      pct(p.threshold),
      p.rootCause ?? '—',
      p.actionTaken ?? 'Not yet defined',
      p.status,
      p.isLoopClosed ? 'Yes' : 'No',
    ]),
  };
}

// ─── Entry point ─────────────────────────────────────────────────────────────

/**
 * Build the report body for a given type.
 *
 * `program_assessment` and `semester_summary` are composites: they include the
 * whole PEO → PLO → CLO chain plus action plans, which is what an accreditation
 * visit actually asks for.
 */
// ─── Attendance ──────────────────────────────────────────────────────────────

/**
 * Course-wise attendance for the semester.
 *
 * An accreditation course file is expected to evidence that the contact hours
 * were actually delivered and attended, not only that outcomes were measured.
 * Sections with no finalized session are listed too, so a course that never
 * recorded attendance is visible rather than silently absent from the table.
 */
async function buildAttendanceSection(
  programId: number,
  semesterId: number
): Promise<ReportSection> {
  const sections = await prisma.sections.findMany({
    where: {
      courseOffering: {
        semesterId,
        course: { programMappings: { some: { A: programId } } },
      },
    },
    select: {
      id: true,
      name: true,
      courseOffering: {
        select: { course: { select: { code: true, name: true } } },
      },
    },
    orderBy: { id: 'asc' },
  });

  const rows: (string | number | null)[][] = [];

  for (const section of sections) {
    const summary = await getSectionAttendanceSummary(section.id);

    rows.push([
      section.courseOffering.course.code,
      section.name,
      summary.finalizedSessions,
      summary.students.length,
      summary.finalizedSessions > 0 ? `${summary.averageAttendance}%` : 'N/A',
      `${summary.threshold}%`,
      summary.defaulterCount,
    ]);
  }

  return {
    heading: 'Attendance & Exam Eligibility',
    note:
      'Average attendance is across finalized sessions only; sessions still open are excluded. ' +
      'Approved (excused) absences are left out of each student’s denominator. ' +
      'Below threshold counts students flagged ineligible before any condonation.',
    columns: [
      'Course',
      'Section',
      'Sessions Held',
      'Students',
      'Avg. Attendance',
      'Required',
      'Below Threshold',
    ],
    rows,
  };
}

export async function generateReportPayload(
  reportType: obe_report_type,
  programId: number | null,
  semesterId: number | null
): Promise<ReportPayload> {
  const warnings: string[] = [];

  const [program, semester] = await Promise.all([
    programId
      ? prisma.programs.findUnique({
          where: { id: programId },
          select: { id: true, code: true, name: true },
        })
      : null,
    semesterId
      ? prisma.semesters.findUnique({
          where: { id: semesterId },
          select: { id: true, name: true },
        })
      : null,
  ]);

  // Every report type below is scoped to a program and a semester
  if (!programId || !semesterId) {
    return {
      reportType,
      generatedAt: new Date().toISOString(),
      program,
      semester,
      summary: {},
      sections: [],
      warnings: ['A program and a semester are required to generate this report.'],
    };
  }

  const sections: ReportSection[] = [];

  switch (reportType) {
    case 'clo_attainment':
      sections.push(await buildCloSection(programId, semesterId));
      break;
    case 'llo_attainment':
      sections.push(await buildLloSection(programId, semesterId));
      break;
    case 'plo_attainment':
      sections.push(await buildPloSection(programId, semesterId));
      break;
    case 'course_wise':
      sections.push(await buildCourseWiseSection(programId, semesterId));
      break;
    case 'program_assessment':
    case 'semester_summary':
      sections.push(
        await buildPeoSection(programId, semesterId),
        await buildPloSection(programId, semesterId),
        await buildCloSection(programId, semesterId),
        await buildLloSection(programId, semesterId),
        await buildCourseWiseSection(programId, semesterId),
        await buildAttendanceSection(programId, semesterId),
        await buildActionPlanSection(programId, semesterId)
      );
      break;
  }

  if (sections.every((s) => s.rows.length === 0)) {
    warnings.push(
      'No attainment data found for this program and semester. Calculate CLO/LLO and PLO attainments first.'
    );
  }

  // Headline figures
  const ploAttainments = await prisma.ploattainments.findMany({
    where: { programId, semesterId },
    select: { attainmentPercent: true, isAchieved: true },
  });
  const unattained = await findUnattainedOutcomes(programId, semesterId);

  const summary: Record<string, string | number | null> = {
    'PLOs evaluated': ploAttainments.length,
    'PLOs achieved': ploAttainments.filter((p) => p.isAchieved === true).length,
    'Average PLO attainment':
      ploAttainments.length > 0
        ? pct(
            ploAttainments.reduce((s, p) => s + p.attainmentPercent, 0) /
              ploAttainments.length
          )
        : 'N/A',
    'Outcomes below target': unattained.length,
  };

  return {
    reportType,
    generatedAt: new Date().toISOString(),
    program,
    semester,
    summary,
    sections,
    warnings,
  };
}
