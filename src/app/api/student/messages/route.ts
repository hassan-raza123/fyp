import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStudentFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const student = await getStudentFromRequest(request);
    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found or unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // announcement, course, system, all
    const courseId = searchParams.get('courseId');
    const isRead = searchParams.get('isRead'); // true, false, all
    const search = searchParams.get('search');

    // Get student's enrolled sections to filter course-related notifications
    const studentSections = await prisma.studentsections.findMany({
      where: {
        studentId: student.id,
        status: 'active',
      },
      include: {
        section: {
          include: {
            courseOffering: {
              include: {
                course: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const courseOfferingIds = studentSections.map(
      (ss) => ss.section.courseOfferingId
    );
    const enrolledCourseIds = studentSections.map(
      (ss) => ss.section.courseOffering.course.id
    );

    // Build where clause for notifications
    const where: any = {
      userId: student.user.id,
    };

    // Filter by read status
    if (isRead && isRead !== 'all') {
      where.isRead = isRead === 'true';
    }

    // Filter by type
    if (type && type !== 'all') {
      where.type = type;
    }

    // Get all notifications
    const notifications = await prisma.notifications.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filter and enrich notifications
    let filteredNotifications = notifications;

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      filteredNotifications = filteredNotifications.filter(
        (n) =>
          n.title.toLowerCase().includes(searchLower) ||
          n.message.toLowerCase().includes(searchLower)
      );
    }

    // Enrich notifications with course information if available
    const enrichedNotifications = await Promise.all(
      filteredNotifications.map(async (notification) => {
        // Try to extract course information from notification message/title
        // Check if notification mentions any enrolled course
        let relatedCourse = null;
        for (const courseId of enrolledCourseIds) {
          const course = studentSections.find(
            (ss) => ss.section.courseOffering.course.id === courseId
          )?.section.courseOffering.course;

          if (course) {
            const courseCode = course.code.toLowerCase();
            const notificationText = (
              notification.title + ' ' + notification.message
            ).toLowerCase();

            if (notificationText.includes(courseCode)) {
              relatedCourse = {
                id: course.id,
                code: course.code,
                name: course.name,
              };
              break;
            }
          }
        }

        // Determine notification category
        let category: 'announcement' | 'course' | 'system' | 'assessment' | 'grade' =
          'system';
        if (notification.type === 'announcement') {
          category = relatedCourse ? 'course' : 'announcement';
        } else if (notification.type === 'course') {
          category = 'course';
        } else if (notification.type === 'assessment') {
          category = 'assessment';
        } else if (notification.type === 'grade') {
          category = 'grade';
        } else {
          category = 'system';
        }

        return {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          category,
          isRead: notification.isRead,
          createdAt: notification.createdAt.toISOString(),
          relatedCourse,
        };
      })
    );

    // Filter by course if specified
    let finalNotifications = enrichedNotifications;
    if (courseId && courseId !== 'all') {
      finalNotifications = enrichedNotifications.filter(
        (n) => n.relatedCourse?.id === parseInt(courseId)
      );
    }

    // Group by category for summary
    const summary = {
      total: finalNotifications.length,
      unread: finalNotifications.filter((n) => !n.isRead).length,
      announcements: finalNotifications.filter((n) => n.category === 'announcement')
        .length,
      course: finalNotifications.filter((n) => n.category === 'course').length,
      system: finalNotifications.filter((n) => n.category === 'system').length,
      assessment: finalNotifications.filter((n) => n.category === 'assessment')
        .length,
      grade: finalNotifications.filter((n) => n.category === 'grade').length,
    };

    return NextResponse.json({
      success: true,
      data: {
        messages: finalNotifications,
        summary,
        courses: studentSections.map((ss) => ({
          id: ss.section.courseOffering.course.id,
          code: ss.section.courseOffering.course.code,
          name: ss.section.courseOffering.course.name,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching student messages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

