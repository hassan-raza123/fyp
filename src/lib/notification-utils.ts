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

