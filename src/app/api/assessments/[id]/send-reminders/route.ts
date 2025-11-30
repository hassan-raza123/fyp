import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFacultyIdFromRequest } from '@/lib/auth';
import { createNotificationsForUsers } from '@/lib/notification-utils';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const facultyId = await getFacultyIdFromRequest(req);
    if (!facultyId) {
      return NextResponse.json(
        { success: false, error: 'Faculty not found or unauthorized' },
        { status: 401 }
      );
    }

    const assessmentId = parseInt(params.id);
    const body = await req.json();
    const { message } = body;

    // Verify assessment belongs to faculty
    const assessment = await prisma.assessments.findUnique({
      where: { id: assessmentId },
      include: {
        courseOffering: {
          include: {
            sections: {
              where: {
                facultyId: facultyId,
                status: 'active',
              },
              include: {
                studentsections: {
                  where: {
                    status: 'active',
                  },
                  include: {
                    student: {
                      include: {
                        user: {
                          select: {
                            id: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!assessment) {
      return NextResponse.json(
        { success: false, error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Check authorization
    if (assessment.conductedBy !== facultyId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get all student user IDs from sections
    const studentUserIds: number[] = [];
    assessment.courseOffering.sections.forEach((section) => {
      section.studentsections.forEach((ss) => {
        if (ss.student?.user?.id) {
          studentUserIds.push(ss.student.user.id);
        }
      });
    });

    // Remove duplicates
    const uniqueStudentUserIds = Array.from(new Set(studentUserIds));

    if (uniqueStudentUserIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No students found in this assessment' },
        { status: 400 }
      );
    }

    // Send notifications to all students
    const reminderMessage = message || `Reminder: Assessment "${assessment.title}" is due on ${new Date(assessment.dueDate).toLocaleDateString()}. Please complete it on time.`;

    await createNotificationsForUsers(
      uniqueStudentUserIds,
      `Assessment Reminder: ${assessment.title}`,
      reminderMessage,
      'assessment'
    );

    return NextResponse.json({
      success: true,
      message: `Reminders sent to ${uniqueStudentUserIds.length} student(s)`,
      data: {
        studentsNotified: uniqueStudentUserIds.length,
      },
    });
  } catch (error) {
    console.error('Error sending reminders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send reminders' },
      { status: 500 }
    );
  }
}

