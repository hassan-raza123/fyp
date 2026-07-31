import { prisma } from '@/lib/prisma';
import { notification_type } from '@prisma/client';

/**
 * Create a notification for a user
 */
export async function createNotification(
  userId: number,
  title: string,
  message: string,
  type: notification_type
) {
  try {
    const notification = await prisma.notifications.create({
      data: {
        userId,
        title,
        message,
        type,
        isRead: false,
      },
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

/**
 * Create notifications for multiple users
 */
export async function createNotificationsForUsers(
  userIds: number[],
  title: string,
  message: string,
  type: notification_type
) {
  try {
    const notifications = await prisma.notifications.createMany({
      data: userIds.map((userId) => ({
        userId,
        title,
        message,
        type,
        isRead: false,
      })),
    });
    return notifications;
  } catch (error) {
    console.error('Error creating notifications:', error);
    return null;
  }
}

/**
 * Notify faculty about new assessment created
 */
export async function notifyAssessmentCreated(
  assessmentId: number,
  assessmentTitle: string,
  courseCode: string,
  facultyId: number
) {
  const faculty = await prisma.faculties.findUnique({
    where: { id: facultyId },
    include: { user: true },
  });

  if (!faculty?.user) return;

  return await createNotification(
    faculty.user.id,
    'New Assessment Created',
    `Assessment "${assessmentTitle}" has been created for ${courseCode}.`,
    'assessment'
  );
}

/**
 * Notify faculty about assessment due date reminder
 */
export async function notifyAssessmentDueDateReminder(
  assessmentTitle: string,
  dueDate: Date,
  facultyId: number
) {
  const faculty = await prisma.faculties.findUnique({
    where: { id: facultyId },
    include: { user: true },
  });

  if (!faculty?.user) return;

  const daysUntilDue = Math.ceil(
    (dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return await createNotification(
    faculty.user.id,
    'Assessment Due Date Reminder',
    `Assessment "${assessmentTitle}" is due in ${daysUntilDue} day(s).`,
    'alert'
  );
}

/**
 * Notify faculty about marks entry deadline
 */
export async function notifyMarksEntryDeadline(
  assessmentTitle: string,
  deadline: Date,
  facultyId: number
) {
  const faculty = await prisma.faculties.findUnique({
    where: { id: facultyId },
    include: { user: true },
  });

  if (!faculty?.user) return;

  return await createNotification(
    faculty.user.id,
    'Marks Entry Deadline Approaching',
    `Marks entry deadline for "${assessmentTitle}" is approaching. Please complete marks entry soon.`,
    'alert'
  );
}

/**
 * Notify faculty about grade calculation completed
 */
export async function notifyGradeCalculationCompleted(
  courseCode: string,
  studentCount: number,
  facultyId: number
) {
  const faculty = await prisma.faculties.findUnique({
    where: { id: facultyId },
    include: { user: true },
  });

  if (!faculty?.user) return;

  return await createNotification(
    faculty.user.id,
    'Grade Calculation Completed',
    `Grades have been calculated for ${courseCode}. ${studentCount} student(s) processed.`,
    'grade'
  );
}

/**
 * Notify faculty about CLO attainment calculated
 */
export async function notifyCLOAttainmentCalculated(
  courseCode: string,
  cloCount: number,
  facultyId: number
) {
  const faculty = await prisma.faculties.findUnique({
    where: { id: facultyId },
    include: { user: true },
  });

  if (!faculty?.user) return;

  return await createNotification(
    faculty.user.id,
    'CLO Attainment Calculated',
    `CLO attainments have been calculated for ${courseCode}. ${cloCount} CLO(s) processed.`,
    'result'
  );
}

/**
 * Notify faculty about student enrollment changes
 */
export async function notifyStudentEnrollmentChange(
  courseCode: string,
  changeType: 'added' | 'removed',
  studentCount: number,
  facultyId: number
) {
  const faculty = await prisma.faculties.findUnique({
    where: { id: facultyId },
    include: { user: true },
  });

  if (!faculty?.user) return;

  return await createNotification(
    faculty.user.id,
    'Student Enrollment Change',
    `${studentCount} student(s) ${changeType} in ${courseCode}.`,
    'course'
  );
}

/**
 * Notify faculty about evaluation requests
 */
export async function notifyEvaluationRequest(
  assessmentTitle: string,
  courseCode: string,
  facultyId: number
) {
  const faculty = await prisma.faculties.findUnique({
    where: { id: facultyId },
    include: { user: true },
  });

  if (!faculty?.user) return;

  return await createNotification(
    faculty.user.id,
    'Evaluation Request',
    `Evaluation requested for "${assessmentTitle}" in ${courseCode}.`,
    'assessment'
  );
}

/**
 * Notify faculty about report generation
 */
export async function notifyReportGenerated(
  reportType: string,
  facultyId: number
) {
  const faculty = await prisma.faculties.findUnique({
    where: { id: facultyId },
    include: { user: true },
  });

  if (!faculty?.user) return;

  return await createNotification(
    faculty.user.id,
    'Report Generated',
    `Your ${reportType} report has been generated successfully.`,
    'system'
  );
}


/**
 * Alert students who are falling behind in a course offering.
 *
 * At-risk students were already computed for the faculty dashboards but nobody
 * told the students themselves. Early warning is the point of tracking
 * attainment during a semester rather than after it.
 *
 * A student is at risk when their aggregate percentage across evaluated
 * assessments is below the course offering's pass threshold.
 */
export async function notifyAtRiskStudents(
  courseOfferingId: number,
  options: { thresholdOverride?: number } = {}
): Promise<{ notified: number; threshold: number }> {
  const offering = await prisma.courseofferings.findUnique({
    where: { id: courseOfferingId },
    select: {
      id: true,
      course: { select: { code: true, name: true } },
      passfailcriteria: { select: { minPassPercent: true } },
      sections: {
        where: { status: 'active' },
        select: {
          studentsections: {
            where: { status: 'active' },
            select: {
              student: { select: { id: true, userId: true } },
            },
          },
        },
      },
    },
  });

  if (!offering) return { notified: 0, threshold: 0 };

  const threshold =
    options.thresholdOverride ?? offering.passfailcriteria?.minPassPercent ?? 50;

  // studentId -> userId, deduped across sections
  const studentUsers = new Map<number, number>();
  for (const section of offering.sections) {
    for (const enrolment of section.studentsections) {
      studentUsers.set(enrolment.student.id, enrolment.student.userId);
    }
  }

  if (studentUsers.size === 0) return { notified: 0, threshold };

  const results = await prisma.studentassessmentresults.findMany({
    where: {
      studentId: { in: Array.from(studentUsers.keys()) },
      status: { in: ['evaluated', 'published'] },
      assessment: { courseOfferingId },
    },
    select: { studentId: true, obtainedMarks: true, totalMarks: true },
  });

  const totals = new Map<number, { obtained: number; total: number }>();
  for (const result of results) {
    const entry = totals.get(result.studentId) ?? { obtained: 0, total: 0 };
    entry.obtained += result.obtainedMarks;
    entry.total += result.totalMarks;
    totals.set(result.studentId, entry);
  }

  const atRisk: Array<{ userId: number; percentage: number }> = [];
  for (const [studentId, totalsForStudent] of totals.entries()) {
    // Students with nothing evaluated yet are not "at risk", just unassessed
    if (totalsForStudent.total <= 0) continue;

    const percentage = (totalsForStudent.obtained / totalsForStudent.total) * 100;
    if (percentage < threshold) {
      const userId = studentUsers.get(studentId);
      if (userId) atRisk.push({ userId, percentage });
    }
  }

  await Promise.all(
    atRisk.map(({ userId, percentage }) =>
      createNotification(
        userId,
        `Performance alert: ${offering.course.code}`,
        `Your current aggregate in ${offering.course.code} (${offering.course.name}) is ${percentage.toFixed(1)}%, below the ${threshold}% pass threshold. Please contact your instructor to discuss support options.`,
        notification_type.alert
      )
    )
  );

  return { notified: atRisk.length, threshold };
}

/**
 * Notify faculty and department admins that an outcome missed its target, so a
 * corrective action plan can be raised.
 */
export async function notifyOutcomeBelowTarget(
  courseCode: string,
  outcomeCode: string,
  attainmentPercent: number,
  targetPercent: number,
  recipientUserIds: number[]
) {
  if (recipientUserIds.length === 0) return null;

  return createNotificationsForUsers(
    recipientUserIds,
    `${outcomeCode} below target in ${courseCode}`,
    `${outcomeCode} attained ${attainmentPercent.toFixed(1)}% against a target of ${targetPercent}%. An action plan is required to close the loop.`,
    notification_type.alert
  );
}

/**
 * Warn students whose attendance has fallen below the exam-eligibility
 * requirement in a section.
 *
 * Fired when a session is finalized, because that is the moment the percentage
 * actually changes. Warning only at exam time would be useless — by then the
 * student has no remaining classes with which to recover.
 */
export async function notifyAttendanceShortfall(sectionId: number) {
  const { getSectionAttendanceSummary } = await import('./attendance');
  const summary = await getSectionAttendanceSummary(sectionId);

  const flagged = summary.students.filter(
    (student) => student.verdict === 'ineligible' || student.verdict === 'at_risk'
  );

  if (flagged.length === 0) return { notified: 0 };

  const section = await prisma.sections.findUnique({
    where: { id: sectionId },
    select: {
      name: true,
      courseOffering: {
        select: { course: { select: { code: true, name: true } } },
      },
    },
  });

  if (!section) return { notified: 0 };

  // Notifications address a user, not a student record.
  const students = await prisma.students.findMany({
    where: { id: { in: flagged.map((student) => student.studentId) } },
    select: { id: true, userId: true },
  });
  const userIdByStudent = new Map(students.map((s) => [s.id, s.userId]));

  const course = section.courseOffering.course;

  await Promise.all(
    flagged.map((student) => {
      const userId = userIdByStudent.get(student.studentId);
      if (!userId) return null;

      const isShort = student.verdict === 'ineligible';

      return createNotification(
        userId,
        isShort
          ? `Attendance below requirement: ${course.code}`
          : `Attendance warning: ${course.code}`,
        isShort
          ? `Your attendance in ${course.code} (${course.name}) is ${student.tally.attendancePercent}%, below the ${student.threshold}% required to sit the exam. Contact your instructor or the department office if this is due to approved leave.`
          : `Your attendance in ${course.code} (${course.name}) is ${student.tally.attendancePercent}%, close to the ${student.threshold}% requirement. Missing further classes may make you ineligible to sit the exam.`,
        notification_type.attendance
      );
    })
  );

  return { notified: flagged.length };
}
