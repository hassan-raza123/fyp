import { prisma } from './prisma';
import { attendance_status, exam_eligibility_override } from '@prisma/client';

/**
 * Shared attendance logic.
 *
 * Attendance answers one question the OBE chain cannot: was the student
 * actually taught the material their outcomes are measured against. HEC and
 * most Pakistani universities gate exam eligibility on it, so the percentage
 * has to be derived the same way everywhere — a dashboard that disagrees with
 * the defaulter list is worse than no dashboard.
 *
 * Two rules govern every calculation here and are applied in one place so they
 * cannot drift:
 *
 *  - Only **finalized** sessions count. A session still being marked would
 *    otherwise manufacture absences indistinguishable from real ones — the same
 *    reasoning that keeps unassessed students out of the attainment denominator.
 *
 *  - **Excused** absences leave the denominator entirely. Counting approved
 *    medical or official leave as absence penalises exactly the students the
 *    approval was meant to protect.
 */

// ─── Thresholds ──────────────────────────────────────────────────────────────

/**
 * Fallback minimum attendance when neither the course offering nor the system
 * settings specify one. 75% is the figure HEC and most Pakistani universities
 * apply for exam eligibility.
 */
export const DEFAULT_ATTENDANCE_THRESHOLD = 75;

/**
 * Resolve the minimum attendance percentage for a course offering.
 *
 * Mirrors `resolveThresholds` in obe.ts: the per-offering criteria row wins,
 * then the system-wide setting, then the constant. Kept as a cascade so a
 * department can set one policy without editing every offering.
 */
export async function resolveAttendanceThreshold(
  courseOfferingId: number
): Promise<number> {
  const criteria = await prisma.passfailcriteria.findUnique({
    where: { courseOfferingId },
    select: { minAttendancePercent: true },
  });

  if (criteria?.minAttendancePercent != null) {
    return criteria.minAttendancePercent;
  }

  const settings = await prisma.settings.findFirst({ select: { obe: true } });
  const obe = settings?.obe as { minAttendancePercent?: number } | null;

  if (typeof obe?.minAttendancePercent === 'number') {
    return obe.minAttendancePercent;
  }

  return DEFAULT_ATTENDANCE_THRESHOLD;
}

// ─── Percentage calculation ──────────────────────────────────────────────────

export interface AttendanceTally {
  present: number;
  absent: number;
  late: number;
  excused: number;
  /** present + absent + late — excused is deliberately outside this */
  countedSessions: number;
  attendedSessions: number;
  attendancePercent: number;
  /** False when no finalized session applies, so the percentage means nothing */
  hasData: boolean;
}

/** Empty tally, used when a student has no applicable finalized sessions. */
export function emptyTally(): AttendanceTally {
  return {
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    countedSessions: 0,
    attendedSessions: 0,
    attendancePercent: 0,
    hasData: false,
  };
}

/**
 * Reduce a student's records into a tally.
 *
 * `totalFinalizedSessions` is the number of finalized sessions the student was
 * enrolled for. Sessions with no record for the student are counted as absent:
 * unlike marks entry, a finalized session means the roll was taken, so a
 * missing row is a genuine absence rather than missing data.
 */
export function tallyAttendance(
  records: Array<{ status: attendance_status }>,
  totalFinalizedSessions: number
): AttendanceTally {
  let present = 0;
  let absent = 0;
  let late = 0;
  let excused = 0;

  for (const record of records) {
    if (record.status === 'present') present++;
    else if (record.status === 'late') late++;
    else if (record.status === 'excused') excused++;
    else absent++;
  }

  // Finalized sessions the student has no row for at all.
  const unrecorded = Math.max(
    0,
    totalFinalizedSessions - (present + absent + late + excused)
  );
  absent += unrecorded;

  const countedSessions = present + absent + late;
  const attendedSessions = present + late;

  if (countedSessions === 0) {
    return { ...emptyTally(), excused };
  }

  return {
    present,
    absent,
    late,
    excused,
    countedSessions,
    attendedSessions,
    attendancePercent:
      Math.round((attendedSessions / countedSessions) * 1000) / 10,
    hasData: true,
  };
}

// ─── Eligibility ─────────────────────────────────────────────────────────────

export type EligibilityVerdict =
  | 'eligible'
  | 'at_risk'
  | 'ineligible'
  | 'condoned'
  | 'barred'
  | 'no_data';

export interface StudentAttendance {
  studentId: number;
  rollNumber: string;
  name: string;
  tally: AttendanceTally;
  threshold: number;
  verdict: EligibilityVerdict;
  override: exam_eligibility_override;
  overrideRemarks: string | null;
}

/**
 * Margin below which a student is flagged before they actually fall short.
 * Warning only once the threshold is already breached is too late to act on —
 * by then no amount of attendance can recover the percentage.
 */
export const AT_RISK_MARGIN = 5;

/**
 * Decide a student's exam eligibility.
 *
 * An admin override wins outright — that is the point of recording one. This
 * system warns and flags rather than hard-blocking, so `ineligible` is a
 * verdict the UI surfaces, not a gate that silently drops a student.
 */
export function eligibilityVerdict(
  tally: AttendanceTally,
  threshold: number,
  override: exam_eligibility_override = 'none'
): EligibilityVerdict {
  if (override === 'eligible') return 'condoned';
  if (override === 'ineligible') return 'barred';

  if (!tally.hasData) return 'no_data';

  if (tally.attendancePercent < threshold) return 'ineligible';
  if (tally.attendancePercent < threshold + AT_RISK_MARGIN) return 'at_risk';

  return 'eligible';
}

/** True only for verdicts that permit sitting the exam. */
export function canSitExam(verdict: EligibilityVerdict): boolean {
  return verdict === 'eligible' || verdict === 'at_risk' || verdict === 'condoned';
}

// ─── Section-level summary ───────────────────────────────────────────────────

export interface SectionAttendanceSummary {
  sectionId: number;
  totalSessions: number;
  finalizedSessions: number;
  openSessions: number;
  threshold: number;
  students: StudentAttendance[];
  /** Students whose verdict is `ineligible` — the defaulter list */
  defaulterCount: number;
  /** Mean attendance across students with data */
  averageAttendance: number;
}

/**
 * Build the full attendance picture for one section.
 *
 * Written as a single pass over the section's records rather than a query per
 * student: a 60-student section would otherwise issue 60 round trips every time
 * the marking screen loads.
 */
export async function getSectionAttendanceSummary(
  sectionId: number
): Promise<SectionAttendanceSummary> {
  const section = await prisma.sections.findUnique({
    where: { id: sectionId },
    select: { courseOfferingId: true },
  });

  if (!section) {
    throw new Error(`Section ${sectionId} not found`);
  }

  const threshold = await resolveAttendanceThreshold(section.courseOfferingId);

  const sessions = await prisma.attendance_sessions.findMany({
    where: { sectionId },
    select: { id: true, status: true },
  });

  const finalizedIds = sessions
    .filter((s) => s.status === 'finalized')
    .map((s) => s.id);

  const enrollments = await prisma.studentsections.findMany({
    where: { sectionId, status: 'active' },
    select: {
      studentId: true,
      eligibilityOverride: true,
      eligibilityRemarks: true,
      student: {
        select: {
          rollNumber: true,
          user: { select: { first_name: true, last_name: true } },
        },
      },
    },
    orderBy: { student: { rollNumber: 'asc' } },
  });

  const records =
    finalizedIds.length > 0
      ? await prisma.attendance_records.findMany({
          where: { sessionId: { in: finalizedIds } },
          select: { studentId: true, status: true },
        })
      : [];

  const byStudent = new Map<number, Array<{ status: attendance_status }>>();
  for (const record of records) {
    const list = byStudent.get(record.studentId) ?? [];
    list.push({ status: record.status });
    byStudent.set(record.studentId, list);
  }

  const students: StudentAttendance[] = enrollments.map((enrollment) => {
    const tally = tallyAttendance(
      byStudent.get(enrollment.studentId) ?? [],
      finalizedIds.length
    );

    return {
      studentId: enrollment.studentId,
      rollNumber: enrollment.student.rollNumber,
      name: `${enrollment.student.user.first_name} ${enrollment.student.user.last_name}`,
      tally,
      threshold,
      verdict: eligibilityVerdict(tally, threshold, enrollment.eligibilityOverride),
      override: enrollment.eligibilityOverride,
      overrideRemarks: enrollment.eligibilityRemarks,
    };
  });

  const withData = students.filter((s) => s.tally.hasData);
  const averageAttendance =
    withData.length > 0
      ? Math.round(
          (withData.reduce((sum, s) => sum + s.tally.attendancePercent, 0) /
            withData.length) *
            10
        ) / 10
      : 0;

  return {
    sectionId,
    totalSessions: sessions.length,
    finalizedSessions: finalizedIds.length,
    openSessions: sessions.length - finalizedIds.length,
    threshold,
    students,
    defaulterCount: students.filter((s) => s.verdict === 'ineligible').length,
    averageAttendance,
  };
}

// ─── Course-offering level ───────────────────────────────────────────────────

/**
 * Attendance for every student in a course offering, across all its sections.
 *
 * Eligibility is a property of the offering rather than the section — a student
 * sits one exam for the course regardless of which section they attend.
 */
export async function getCourseOfferingAttendance(
  courseOfferingId: number
): Promise<StudentAttendance[]> {
  const sections = await prisma.sections.findMany({
    where: { courseOfferingId },
    select: { id: true },
  });

  const summaries = await Promise.all(
    sections.map((section) => getSectionAttendanceSummary(section.id))
  );

  return summaries.flatMap((summary) => summary.students);
}

// ─── Per-student, across courses ─────────────────────────────────────────────

export interface StudentCourseAttendance {
  sectionId: number;
  sectionName: string;
  courseOfferingId: number;
  courseCode: string;
  courseName: string;
  semesterName: string;
  tally: AttendanceTally;
  threshold: number;
  verdict: EligibilityVerdict;
  overrideRemarks: string | null;
}

/**
 * One student's attendance in every course they are enrolled in.
 *
 * `semesterId` narrows it to a single semester; without it the student sees
 * their whole history, which is what the transcript-style view needs.
 */
export async function getStudentAttendance(
  studentId: number,
  semesterId?: number
): Promise<StudentCourseAttendance[]> {
  const enrollments = await prisma.studentsections.findMany({
    where: {
      studentId,
      status: 'active',
      ...(semesterId
        ? { section: { courseOffering: { semesterId } } }
        : {}),
    },
    select: {
      sectionId: true,
      eligibilityOverride: true,
      eligibilityRemarks: true,
      section: {
        select: {
          name: true,
          courseOfferingId: true,
          courseOffering: {
            select: {
              course: { select: { code: true, name: true } },
              semester: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (enrollments.length === 0) return [];

  const sectionIds = enrollments.map((e) => e.sectionId);

  const finalizedSessions = await prisma.attendance_sessions.findMany({
    where: { sectionId: { in: sectionIds }, status: 'finalized' },
    select: { id: true, sectionId: true },
  });

  const sessionCountBySection = new Map<number, number>();
  const sessionToSection = new Map<number, number>();
  for (const session of finalizedSessions) {
    sessionCountBySection.set(
      session.sectionId,
      (sessionCountBySection.get(session.sectionId) ?? 0) + 1
    );
    sessionToSection.set(session.id, session.sectionId);
  }

  const records =
    finalizedSessions.length > 0
      ? await prisma.attendance_records.findMany({
          where: {
            studentId,
            sessionId: { in: finalizedSessions.map((s) => s.id) },
          },
          select: { sessionId: true, status: true },
        })
      : [];

  const recordsBySection = new Map<number, Array<{ status: attendance_status }>>();
  for (const record of records) {
    const sectionId = sessionToSection.get(record.sessionId);
    if (sectionId === undefined) continue;
    const list = recordsBySection.get(sectionId) ?? [];
    list.push({ status: record.status });
    recordsBySection.set(sectionId, list);
  }

  const results: StudentCourseAttendance[] = [];

  for (const enrollment of enrollments) {
    const threshold = await resolveAttendanceThreshold(
      enrollment.section.courseOfferingId
    );
    const tally = tallyAttendance(
      recordsBySection.get(enrollment.sectionId) ?? [],
      sessionCountBySection.get(enrollment.sectionId) ?? 0
    );

    results.push({
      sectionId: enrollment.sectionId,
      sectionName: enrollment.section.name,
      courseOfferingId: enrollment.section.courseOfferingId,
      courseCode: enrollment.section.courseOffering.course.code,
      courseName: enrollment.section.courseOffering.course.name,
      semesterName: enrollment.section.courseOffering.semester.name,
      tally,
      threshold,
      verdict: eligibilityVerdict(tally, threshold, enrollment.eligibilityOverride),
      overrideRemarks: enrollment.eligibilityRemarks,
    });
  }

  return results;
}

// ─── Defaulters ──────────────────────────────────────────────────────────────

export interface Defaulter {
  studentId: number;
  rollNumber: string;
  name: string;
  courseCode: string;
  courseName: string;
  /// Carried through so an eligibility override can be written without having
  /// to resolve the enrollment by matching on names.
  sectionId: number;
  sectionName: string;
  attendancePercent: number;
  attendedSessions: number;
  countedSessions: number;
  threshold: number;
  verdict: EligibilityVerdict;
}

/**
 * Every student below the attendance threshold in a department + semester.
 *
 * This is the list a department actually acts on — without it an admin has to
 * open each section by hand to find who is short, which in practice means the
 * shortfall is discovered at exam time when nothing can be done about it.
 */
export async function findDefaulters(
  departmentId: number | null,
  semesterId: number,
  options: { includeAtRisk?: boolean; programId?: number } = {}
): Promise<Defaulter[]> {
  const sections = await prisma.sections.findMany({
    where: {
      courseOffering: {
        semesterId,
        ...(departmentId !== null
          ? { course: { departmentId } }
          : {}),
        ...(options.programId
          ? { course: { programMappings: { some: { A: options.programId } } } }
          : {}),
      },
    },
    select: {
      id: true,
      name: true,
      courseOffering: {
        select: { course: { select: { code: true, name: true } } },
      },
    },
  });

  const defaulters: Defaulter[] = [];

  for (const section of sections) {
    const summary = await getSectionAttendanceSummary(section.id);

    for (const student of summary.students) {
      const isDefaulter =
        student.verdict === 'ineligible' ||
        (options.includeAtRisk && student.verdict === 'at_risk');

      if (!isDefaulter) continue;

      defaulters.push({
        studentId: student.studentId,
        rollNumber: student.rollNumber,
        name: student.name,
        courseCode: section.courseOffering.course.code,
        courseName: section.courseOffering.course.name,
        sectionId: section.id,
        sectionName: section.name,
        attendancePercent: student.tally.attendancePercent,
        attendedSessions: student.tally.attendedSessions,
        countedSessions: student.tally.countedSessions,
        threshold: student.threshold,
        verdict: student.verdict,
      });
    }
  }

  return defaulters.sort((a, b) => a.attendancePercent - b.attendancePercent);
}
