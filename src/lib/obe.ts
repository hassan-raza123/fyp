import { prisma } from './prisma';

/**
 * Shared OBE calculation logic.
 *
 * The attainment chain is PEO ← PLO ← CLO/LLO ← assessment item ← marks.
 * Two distinct measures exist and must not be conflated:
 *
 *  - **Cohort attainment** (`closattainments`, `llosattainments`,
 *    `ploattainments.directAttainment`): the percentage of *students* who
 *    achieved an outcome. This is what accreditation reports quote.
 *
 *  - **Individual attainment** (`ploscores`): one student's weighted mark
 *    percentage for a PLO. This drives per-student graduation tracking.
 *
 * Both are derived here so the two never drift apart.
 */

// ─── Thresholds ──────────────────────────────────────────────────────────────

/** Fallback performance threshold when a course offering has no criteria row. */
export const DEFAULT_PERFORMANCE_THRESHOLD = 60;

/** Fallback PLO attainment threshold when a program has no graduation criteria. */
export const DEFAULT_PLO_THRESHOLD = 50;

export interface OutcomeThresholds {
  /** % of marks a student must score to have achieved the outcome */
  performance: number;
  /** % of students that must achieve it for the outcome itself to be attained */
  target: number | null;
}

/**
 * Resolve both thresholds for a course offering.
 *
 * `minCloAttainmentPercent` / `minLloAttainmentPercent` are the target
 * thresholds. They are optional: when unset, attainment is reported as a
 * number without an achieved/not-achieved verdict.
 */
export async function resolveThresholds(
  courseOfferingId: number,
  kind: 'clo' | 'llo',
  overridePerformance?: number
): Promise<OutcomeThresholds> {
  const criteria = await prisma.passfailcriteria.findUnique({
    where: { courseOfferingId },
    select: {
      minPassPercent: true,
      minCloAttainmentPercent: true,
      minLloAttainmentPercent: true,
    },
  });

  return {
    performance:
      overridePerformance ??
      criteria?.minPassPercent ??
      DEFAULT_PERFORMANCE_THRESHOLD,
    target:
      (kind === 'clo'
        ? criteria?.minCloAttainmentPercent
        : criteria?.minLloAttainmentPercent) ?? null,
  };
}

// ─── Cohort attainment ───────────────────────────────────────────────────────

export interface CohortAttainment {
  /** Students with an evaluated result — the denominator */
  totalStudents: number;
  studentsAchieved: number;
  /** Enrolled students with no evaluated result yet */
  unassessedStudents: number;
  attainmentPercent: number;
  isAchieved: boolean | null;
  /** False when no student had an evaluated result, so the figures mean nothing */
  hasData: boolean;
}

/**
 * Compute cohort attainment from per-student performance.
 *
 * Students without an evaluated result are **excluded from the denominator**
 * rather than counted as failures. Counting them as failures silently
 * understates attainment whenever marks entry is still in progress, which is
 * indistinguishable from a genuinely poor result. They are reported separately
 * as `unassessedStudents` so a partial calculation is visible.
 */
export function computeCohortAttainment(
  performanceByStudent: Map<number, { obtained: number; total: number }>,
  enrolledStudentCount: number,
  thresholds: OutcomeThresholds
): CohortAttainment {
  let studentsAchieved = 0;

  for (const perf of performanceByStudent.values()) {
    const percentage = perf.total > 0 ? (perf.obtained / perf.total) * 100 : 0;
    if (percentage >= thresholds.performance) studentsAchieved++;
  }

  const totalStudents = performanceByStudent.size;

  // With nobody assessed there is no attainment to report. Returning 0% with
  // isAchieved=false would look like a genuine result in an accreditation
  // report rather than "not calculable yet".
  if (totalStudents === 0) {
    return {
      totalStudents: 0,
      studentsAchieved: 0,
      unassessedStudents: enrolledStudentCount,
      attainmentPercent: 0,
      isAchieved: null,
      hasData: false,
    };
  }

  const attainmentPercent = (studentsAchieved / totalStudents) * 100;

  return {
    totalStudents,
    studentsAchieved,
    unassessedStudents: Math.max(0, enrolledStudentCount - totalStudents),
    attainmentPercent,
    isAchieved:
      thresholds.target === null
        ? null
        : attainmentPercent >= thresholds.target,
    hasData: true,
  };
}

// ─── Weighted averaging ──────────────────────────────────────────────────────

export interface WeightedContribution {
  attainment: number;
  weight: number;
}

/**
 * Weighted mean, ignoring zero total weight. Used for CLO/LLO → PLO and
 * PLO → PEO roll-ups so every level aggregates the same way.
 */
export function weightedAverage(
  contributions: WeightedContribution[]
): number | null {
  const totalWeight = contributions.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight <= 0) return null;
  const weightedSum = contributions.reduce(
    (sum, c) => sum + c.attainment * c.weight,
    0
  );
  return weightedSum / totalWeight;
}

// ─── Indirect (survey) attainment ────────────────────────────────────────────

export interface SurveyForAttainment {
  questions: Array<{
    ploId: number | null;
    ratingScale: number;
    answers: Array<{ ratingValue: number | null }>;
  }>;
  _count: { responses: number };
}

/**
 * Accumulate weighted survey ratings into a per-PLO map.
 *
 * Each question is normalised by its own `ratingScale` rather than a hardcoded
 * 5, so surveys on different scales can be mixed without corrupting the result.
 */
export function accumulateSurveyRatings(
  surveys: SurveyForAttainment[],
  indirectByPlo: Map<number, { sumPercent: number; count: number }>
): void {
  for (const survey of surveys) {
    const responseCount = survey._count.responses;
    if (responseCount === 0) continue;

    for (const q of survey.questions) {
      if (!q.ploId) continue;

      const scale = q.ratingScale > 0 ? q.ratingScale : 5;
      const ratings = q.answers
        .filter((a) => a.ratingValue !== null)
        .map((a) => a.ratingValue as number);
      if (ratings.length === 0) continue;

      const avgRating = ratings.reduce((s, v) => s + v, 0) / ratings.length;
      const percent = (avgRating / scale) * 100;

      const existing = indirectByPlo.get(q.ploId) ?? {
        sumPercent: 0,
        count: 0,
      };
      indirectByPlo.set(q.ploId, {
        sumPercent: existing.sumPercent + percent * responseCount,
        count: existing.count + responseCount,
      });
    }
  }
}

/** Convert the accumulator into a ploId → percentage map. */
export function finaliseIndirectAttainment(
  indirectByPlo: Map<number, { sumPercent: number; count: number }>
): Map<number, number> {
  const result = new Map<number, number>();
  for (const [ploId, data] of indirectByPlo.entries()) {
    if (data.count <= 0) continue;
    result.set(ploId, Math.round((data.sumPercent / data.count) * 10) / 10);
  }
  return result;
}

// ─── Per-student PLO scores ──────────────────────────────────────────────────

export interface PloScoreRecord {
  studentId: number;
  ploId: number;
  courseOfferingId: number;
  obtainedMarks: number;
  totalMarks: number;
  percentage: number;
}

/**
 * Compute per-student PLO scores for one course offering.
 *
 * Assessment item marks are scaled by the CLO→PLO (or LLO→PLO) mapping weight.
 * Ignoring the weight would let a CLO mapped at 0.2 contribute as much as one
 * mapped at 1.0, contradicting the weighting used for cohort attainment.
 */
export async function computePloScoresForOffering(offering: {
  id: number;
  course: {
    clos: Array<{ id: number; ploMappings: Array<{ ploId: number; weight: number }> }>;
    llos: Array<{ id: number; ploMappings: Array<{ ploId: number; weight: number }> }>;
  };
  sections: Array<{ studentsections: Array<{ studentId: number }> }>;
  assessments: Array<{
    assessmentItems: Array<{
      id: number;
      marks: number;
      cloId: number | null;
      lloId: number | null;
    }>;
  }>;
}): Promise<PloScoreRecord[]> {
  // outcome id → [{ ploId, weight }]
  const cloToPlos = new Map<number, Array<{ ploId: number; weight: number }>>();
  for (const clo of offering.course.clos) {
    cloToPlos.set(clo.id, clo.ploMappings);
  }
  const lloToPlos = new Map<number, Array<{ ploId: number; weight: number }>>();
  for (const llo of offering.course.llos) {
    lloToPlos.set(llo.id, llo.ploMappings);
  }

  // itemId → [{ ploId, weight }], plus the item's max marks
  const itemToPlos = new Map<number, Array<{ ploId: number; weight: number }>>();
  const itemMarks = new Map<number, number>();

  for (const assessment of offering.assessments) {
    for (const item of assessment.assessmentItems) {
      const mappings: Array<{ ploId: number; weight: number }> = [];
      if (item.cloId !== null) mappings.push(...(cloToPlos.get(item.cloId) ?? []));
      if (item.lloId !== null) mappings.push(...(lloToPlos.get(item.lloId) ?? []));
      if (mappings.length > 0) {
        itemToPlos.set(item.id, mappings);
        itemMarks.set(item.id, item.marks);
      }
    }
  }

  if (itemToPlos.size === 0) return [];

  const studentIdSet = new Set<number>();
  for (const section of offering.sections) {
    for (const ss of section.studentsections) studentIdSet.add(ss.studentId);
  }
  if (studentIdSet.size === 0) return [];

  const studentIds = Array.from(studentIdSet);

  const itemResults = await prisma.studentassessmentitemresults.findMany({
    where: {
      assessmentItemId: { in: Array.from(itemToPlos.keys()) },
      studentResult: {
        studentId: { in: studentIds },
        status: { in: ['evaluated', 'published'] },
      },
    },
    select: {
      assessmentItemId: true,
      obtainedMarks: true,
      studentResult: { select: { studentId: true } },
    },
  });

  // Only count items the student actually has a result for; seeding totals for
  // every enrolled student would score un-assessed students as zero.
  const scoreMap = new Map<string, { obtained: number; total: number }>();

  for (const result of itemResults) {
    const studentId = result.studentResult.studentId;
    const maxMarks = itemMarks.get(result.assessmentItemId) ?? 0;

    for (const { ploId, weight } of itemToPlos.get(result.assessmentItemId) ?? []) {
      const key = `${studentId}_${ploId}`;
      const existing = scoreMap.get(key) ?? { obtained: 0, total: 0 };
      existing.obtained += result.obtainedMarks * weight;
      existing.total += maxMarks * weight;
      scoreMap.set(key, existing);
    }
  }

  const records: PloScoreRecord[] = [];
  for (const [key, score] of scoreMap.entries()) {
    if (score.total <= 0) continue;
    const [studentIdStr, ploIdStr] = key.split('_');
    records.push({
      studentId: Number(studentIdStr),
      ploId: Number(ploIdStr),
      courseOfferingId: offering.id,
      obtainedMarks: Math.round(score.obtained * 100) / 100,
      totalMarks: Math.round(score.total * 100) / 100,
      percentage: Math.round((score.obtained / score.total) * 1000) / 10,
    });
  }

  return records;
}

/** Persist PLO score records, returning how many rows were written. */
export async function savePloScores(
  records: PloScoreRecord[],
  semesterName: string
): Promise<number> {
  await Promise.all(
    records.map((r) =>
      prisma.ploscores.upsert({
        where: {
          studentId_courseOfferingId_ploId: {
            studentId: r.studentId,
            courseOfferingId: r.courseOfferingId,
            ploId: r.ploId,
          },
        },
        update: {
          obtainedMarks: r.obtainedMarks,
          totalMarks: r.totalMarks,
          percentage: r.percentage,
          semesterName,
          calculatedAt: new Date(),
        },
        create: {
          studentId: r.studentId,
          courseOfferingId: r.courseOfferingId,
          ploId: r.ploId,
          obtainedMarks: r.obtainedMarks,
          totalMarks: r.totalMarks,
          percentage: r.percentage,
          semesterName,
        },
      })
    )
  );
  return records.length;
}

/**
 * Aggregate a student's PLO score across several course offerings.
 *
 * Marks are summed rather than taking the best offering. Taking the maximum
 * lets one strong course mask weak performance everywhere else and
 * systematically inflates reported attainment.
 */
export function aggregatePloScores(
  records: Array<{ ploId: number; obtainedMarks: number; totalMarks: number }>
): Map<number, { obtained: number; total: number; percentage: number }> {
  const byPlo = new Map<number, { obtained: number; total: number; percentage: number }>();

  for (const record of records) {
    const existing = byPlo.get(record.ploId) ?? {
      obtained: 0,
      total: 0,
      percentage: 0,
    };
    existing.obtained += record.obtainedMarks;
    existing.total += record.totalMarks;
    byPlo.set(record.ploId, existing);
  }

  for (const value of byPlo.values()) {
    value.percentage =
      value.total > 0
        ? Math.round((value.obtained / value.total) * 1000) / 10
        : 0;
  }

  return byPlo;
}

// ─── Grades ──────────────────────────────────────────────────────────────────

/**
 * Grade statuses that count towards GPA, transcripts and progress.
 *
 * `superseded` is deliberately excluded: those rows are earlier attempts at a
 * repeated course. Counting them would double the course's credit hours and let
 * a failed first attempt drag down the CGPA the repeat was meant to replace.
 */
export const COUNTABLE_GRADE_STATUSES = ['active', 'final'] as const;

// ─── GPA ─────────────────────────────────────────────────────────────────────

/**
 * Recompute and persist a student's semester GPA and cumulative GPA from their
 * finalised grades.
 *
 * Both tables are read by the graduation tracker and the admin dashboards; if
 * nothing writes them, `cumulativegpa` stays empty and every student is
 * reported as ineligible to graduate regardless of performance.
 */
export async function recalculateStudentGpa(studentId: number): Promise<{
  cumulativeGPA: number;
  totalCreditHours: number;
  semestersUpdated: number;
}> {
  // 'superseded' rows are earlier attempts at a repeated course. Including them
  // would count the same course's credit hours twice and let a failed first
  // attempt drag down a CGPA the repeat was meant to replace.
  const grades = await prisma.studentgrades.findMany({
    where: { studentId, status: { in: [...COUNTABLE_GRADE_STATUSES] } },
    select: {
      creditHours: true,
      qualityPoints: true,
      courseOffering: { select: { semesterId: true } },
    },
  });

  // Group by semester
  const bySemester = new Map<number, { credits: number; points: number }>();
  for (const grade of grades) {
    const semesterId = grade.courseOffering.semesterId;
    const existing = bySemester.get(semesterId) ?? { credits: 0, points: 0 };
    existing.credits += grade.creditHours;
    existing.points += grade.qualityPoints;
    bySemester.set(semesterId, existing);
  }

  for (const [semesterId, totals] of bySemester.entries()) {
    const semesterGPA =
      totals.credits > 0
        ? Math.round((totals.points / totals.credits) * 100) / 100
        : 0;

    await prisma.semestergpa.upsert({
      where: { studentId_semesterId: { studentId, semesterId } },
      update: {
        totalQualityPoints: totals.points,
        totalCreditHours: totals.credits,
        semesterGPA,
        // Distinguishes a refreshed figure from a first calculation
        status: 'recalculated',
        calculatedAt: new Date(),
      },
      create: {
        studentId,
        semesterId,
        totalQualityPoints: totals.points,
        totalCreditHours: totals.credits,
        semesterGPA,
      },
    });
  }

  const totalCreditHours = grades.reduce((s, g) => s + g.creditHours, 0);
  const totalQualityPoints = grades.reduce((s, g) => s + g.qualityPoints, 0);
  const cumulativeGPA =
    totalCreditHours > 0
      ? Math.round((totalQualityPoints / totalCreditHours) * 100) / 100
      : 0;

  await prisma.cumulativegpa.upsert({
    where: { studentId },
    update: {
      totalQualityPoints,
      totalCreditHours,
      cumulativeGPA,
      completedSemesters: bySemester.size,
    },
    create: {
      studentId,
      totalQualityPoints,
      totalCreditHours,
      cumulativeGPA,
      completedSemesters: bySemester.size,
    },
  });

  return {
    cumulativeGPA,
    totalCreditHours,
    semestersUpdated: bySemester.size,
  };
}

// ─── Curriculum ──────────────────────────────────────────────────────────────

/**
 * Resolve the courses that belong to a program.
 *
 * Two structures exist: `program_curriculum` (the real curriculum — it carries
 * `semesterSlot`, `courseCategory` and `isRequired`) and `programcourses` (a
 * plain many-to-many junction). They are not kept in sync, so anything that
 * needs "the program's courses" must go through here rather than picking one
 * arbitrarily and silently disagreeing with the rest of the system.
 *
 * `program_curriculum` wins when it has entries; `programcourses` is the
 * fallback for programs whose curriculum has not been defined yet.
 */
export async function resolveProgramCourseIds(
  programId: number,
  options: { requiredOnly?: boolean } = {}
): Promise<number[]> {
  const curriculum = await prisma.program_curriculum.findMany({
    where: {
      programId,
      ...(options.requiredOnly ? { isRequired: true } : {}),
    },
    select: { courseId: true },
  });

  if (curriculum.length > 0) {
    return curriculum.map((c) => c.courseId);
  }

  const junction = await prisma.programcourses.findMany({
    where: { A: programId },
    select: { B: true },
  });
  return junction.map((j) => j.B);
}

/** Count of courses a student must pass to complete the program. */
export async function countRequiredCourses(programId: number): Promise<number> {
  const ids = await resolveProgramCourseIds(programId, { requiredOnly: true });
  return ids.length;
}

// ─── Closing the loop ────────────────────────────────────────────────────────

export interface UnattainedOutcome {
  kind: 'clo' | 'llo' | 'plo';
  outcomeId: number;
  code: string;
  description: string;
  attainmentPercent: number;
  threshold: number;
  courseOfferingId?: number;
  courseCode?: string;
  ploId?: number;
}

/**
 * Find outcomes that fell short of their target for a program + semester.
 *
 * This is what makes "closing the loop" actionable: without it an admin has to
 * read every attainment table by hand to notice which outcomes need an action
 * plan. Only outcomes with real data and a configured target are reported —
 * an uncalculated outcome is not a failing one.
 */
export async function findUnattainedOutcomes(
  programId: number,
  semesterId: number
): Promise<UnattainedOutcome[]> {
  const results: UnattainedOutcome[] = [];

  const cloAttainments = await prisma.closattainments.findMany({
    where: {
      isAchieved: false,
      totalStudents: { gt: 0 },
      courseOffering: {
        semesterId,
        course: { programMappings: { some: { A: programId } } },
      },
    },
    select: {
      cloId: true,
      courseOfferingId: true,
      attainmentPercent: true,
      targetThreshold: true,
      clo: { select: { code: true, description: true } },
      courseOffering: { select: { course: { select: { code: true } } } },
    },
  });

  for (const a of cloAttainments) {
    results.push({
      kind: 'clo',
      outcomeId: a.cloId,
      code: a.clo.code,
      description: a.clo.description,
      attainmentPercent: a.attainmentPercent,
      threshold: a.targetThreshold ?? 0,
      courseOfferingId: a.courseOfferingId,
      courseCode: a.courseOffering.course.code,
    });
  }

  const lloAttainments = await prisma.llosattainments.findMany({
    where: {
      isAchieved: false,
      totalStudents: { gt: 0 },
      courseOffering: {
        semesterId,
        course: { programMappings: { some: { A: programId } } },
      },
    },
    select: {
      lloId: true,
      courseOfferingId: true,
      attainmentPercent: true,
      targetThreshold: true,
      llo: { select: { code: true, description: true } },
      courseOffering: { select: { course: { select: { code: true } } } },
    },
  });

  for (const a of lloAttainments) {
    results.push({
      kind: 'llo',
      outcomeId: a.lloId,
      code: a.llo.code,
      description: a.llo.description,
      attainmentPercent: a.attainmentPercent,
      threshold: a.targetThreshold ?? 0,
      courseOfferingId: a.courseOfferingId,
      courseCode: a.courseOffering.course.code,
    });
  }

  const ploAttainments = await prisma.ploattainments.findMany({
    where: { programId, semesterId, isAchieved: false, totalStudents: { gt: 0 } },
    select: {
      ploId: true,
      attainmentPercent: true,
      threshold: true,
      plo: { select: { code: true, description: true } },
    },
  });

  for (const a of ploAttainments) {
    results.push({
      kind: 'plo',
      outcomeId: a.ploId,
      ploId: a.ploId,
      code: a.plo.code,
      description: a.plo.description,
      attainmentPercent: a.attainmentPercent,
      threshold: a.threshold,
    });
  }

  return results.sort((a, b) => a.attainmentPercent - b.attainmentPercent);
}

// ─── Rubrics ─────────────────────────────────────────────────────────────────

/** Fraction of an item's marks awarded at each rubric level. */
export const RUBRIC_LEVEL_FRACTIONS = {
  excellent: 1.0,
  good: 0.75,
  satisfactory: 0.5,
  unsatisfactory: 0.25,
} as const;

export type RubricLevel = keyof typeof RUBRIC_LEVEL_FRACTIONS;

export interface RubricCriterionScore {
  criterionId: number;
  level: RubricLevel;
  comment?: string;
}

/**
 * Convert rubric level selections into a mark for one assessment item.
 *
 * Each criterion contributes a share of the item's marks proportional to its
 * weight, scaled by the level awarded. This is what makes a rubric more than
 * documentation: the mark is *derived* from the criteria rather than typed in
 * alongside them, so the two can never disagree.
 */
export function scoreFromRubric(
  itemMarks: number,
  criteria: Array<{ id: number; weight: number }>,
  scores: RubricCriterionScore[]
): { obtainedMarks: number; perCriterion: Array<{ criterionId: number; level: RubricLevel; awardedMarks: number }> } {
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight <= 0) {
    return { obtainedMarks: 0, perCriterion: [] };
  }

  const scoreByCriterion = new Map(scores.map((s) => [s.criterionId, s.level]));
  const perCriterion: Array<{ criterionId: number; level: RubricLevel; awardedMarks: number }> = [];
  let obtained = 0;

  for (const criterion of criteria) {
    const level = scoreByCriterion.get(criterion.id);
    if (!level) continue;

    const criterionMarks = (criterion.weight / totalWeight) * itemMarks;
    const awarded = criterionMarks * RUBRIC_LEVEL_FRACTIONS[level];

    obtained += awarded;
    perCriterion.push({
      criterionId: criterion.id,
      level,
      awardedMarks: Math.round(awarded * 100) / 100,
    });
  }

  return {
    obtainedMarks: Math.round(obtained * 100) / 100,
    perCriterion,
  };
}

// ─── Transcript snapshots ────────────────────────────────────────────────────

export interface TranscriptCourse {
  courseCode: string;
  courseName: string;
  creditHours: number;
  grade: string;
  gpaPoints: number;
  percentage: number;
  isRepeat: boolean;
  attemptNumber: number;
}

export interface TranscriptSemester {
  semesterId: number;
  semesterName: string;
  courses: TranscriptCourse[];
  creditHours: number;
  qualityPoints: number;
  gpa: number;
}

export interface TranscriptSnapshot {
  generatedAt: string;
  student: {
    id: number;
    rollNumber: string;
    name: string;
    program: string | null;
    batch: string | null;
  };
  semesters: TranscriptSemester[];
  totalCreditHours: number;
  totalQualityPoints: number;
  cgpa: number;
}

/**
 * Build a transcript snapshot from a student's countable grades.
 *
 * An official transcript must be a fixed record of what was true when it was
 * issued. Storing only a CGPA figure and recomputing the rest on demand means a
 * later grade correction silently rewrites an already-issued document.
 */
export async function buildTranscriptSnapshot(
  studentId: number,
  semesterId?: number | null
): Promise<TranscriptSnapshot> {
  const student = await prisma.students.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      rollNumber: true,
      user: { select: { first_name: true, last_name: true } },
      program: { select: { name: true, code: true } },
      batch: { select: { name: true } },
    },
  });

  if (!student) {
    throw new Error(`Student ${studentId} not found`);
  }

  const grades = await prisma.studentgrades.findMany({
    where: {
      studentId,
      status: { in: [...COUNTABLE_GRADE_STATUSES] },
      ...(semesterId ? { courseOffering: { semesterId } } : {}),
    },
    select: {
      creditHours: true,
      qualityPoints: true,
      gpaPoints: true,
      grade: true,
      percentage: true,
      isRepeat: true,
      attemptNumber: true,
      courseOffering: {
        select: {
          semesterId: true,
          semester: { select: { name: true } },
          course: { select: { code: true, name: true } },
        },
      },
    },
    orderBy: { courseOffering: { semesterId: 'asc' } },
  });

  const bySemester = new Map<number, TranscriptSemester>();

  for (const grade of grades) {
    const sid = grade.courseOffering.semesterId;
    let entry = bySemester.get(sid);
    if (!entry) {
      entry = {
        semesterId: sid,
        semesterName: grade.courseOffering.semester.name,
        courses: [],
        creditHours: 0,
        qualityPoints: 0,
        gpa: 0,
      };
      bySemester.set(sid, entry);
    }

    entry.courses.push({
      courseCode: grade.courseOffering.course.code,
      courseName: grade.courseOffering.course.name,
      creditHours: grade.creditHours,
      grade: grade.grade,
      gpaPoints: grade.gpaPoints,
      percentage: grade.percentage,
      isRepeat: grade.isRepeat,
      attemptNumber: grade.attemptNumber,
    });
    entry.creditHours += grade.creditHours;
    entry.qualityPoints += grade.qualityPoints;
  }

  const semesters = Array.from(bySemester.values()).map((s) => ({
    ...s,
    gpa:
      s.creditHours > 0
        ? Math.round((s.qualityPoints / s.creditHours) * 100) / 100
        : 0,
  }));

  const totalCreditHours = grades.reduce((sum, g) => sum + g.creditHours, 0);
  const totalQualityPoints = grades.reduce((sum, g) => sum + g.qualityPoints, 0);

  return {
    generatedAt: new Date().toISOString(),
    student: {
      id: student.id,
      rollNumber: student.rollNumber,
      name: `${student.user.first_name} ${student.user.last_name}`,
      program: student.program ? `${student.program.code} - ${student.program.name}` : null,
      batch: student.batch?.name ?? null,
    },
    semesters,
    totalCreditHours,
    totalQualityPoints,
    cgpa:
      totalCreditHours > 0
        ? Math.round((totalQualityPoints / totalCreditHours) * 100) / 100
        : 0,
  };
}

// ─── Prerequisites ───────────────────────────────────────────────────────────

export interface PrerequisiteCheck {
  studentId: number;
  rollNumber: string;
  missing: Array<{ courseId: number; courseCode: string; reason: string }>;
}

/**
 * Check which students have not satisfied a course's prerequisites.
 *
 * `courseprerequisites` was previously stored and editable but never consulted,
 * so a student could be enrolled into a course without having passed what it
 * builds on — which defeats the point of sequencing the curriculum.
 *
 * A prerequisite counts as satisfied when the student holds a countable grade
 * for it with gpaPoints > 0 (i.e. they passed; an F produces a grade row too).
 */
export async function checkPrerequisites(
  courseId: number,
  studentIds: number[]
): Promise<PrerequisiteCheck[]> {
  if (studentIds.length === 0) return [];

  const prerequisites = await prisma.courseprerequisites.findMany({
    where: { A: courseId },
    select: { B: true, courseB: { select: { id: true, code: true } } },
  });

  if (prerequisites.length === 0) return [];

  const prerequisiteIds = prerequisites.map((p) => p.B);

  const passed = await prisma.studentgrades.findMany({
    where: {
      studentId: { in: studentIds },
      status: { in: [...COUNTABLE_GRADE_STATUSES] },
      gpaPoints: { gt: 0 },
      courseOffering: { courseId: { in: prerequisiteIds } },
    },
    select: {
      studentId: true,
      courseOffering: { select: { courseId: true } },
    },
  });

  const passedByStudent = new Map<number, Set<number>>();
  for (const grade of passed) {
    const set = passedByStudent.get(grade.studentId) ?? new Set<number>();
    set.add(grade.courseOffering.courseId);
    passedByStudent.set(grade.studentId, set);
  }

  const students = await prisma.students.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, rollNumber: true },
  });

  const results: PrerequisiteCheck[] = [];

  for (const student of students) {
    const cleared = passedByStudent.get(student.id) ?? new Set<number>();
    const missing = prerequisites
      .filter((p) => !cleared.has(p.B))
      .map((p) => ({
        courseId: p.courseB.id,
        courseCode: p.courseB.code,
        reason: 'Not passed',
      }));

    if (missing.length > 0) {
      results.push({
        studentId: student.id,
        rollNumber: student.rollNumber,
        missing,
      });
    }
  }

  return results;
}
