import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStudentIdFromRequest, getStudentFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get logged-in student
    const student = await getStudentFromRequest(request);
    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found or unauthorized' },
        { status: 401 }
      );
    }

    const studentId = student.id;

    // Get student's enrolled sections
    const studentSections = await prisma.studentsections.findMany({
      where: {
        studentId: studentId,
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
                    creditHours: true,
                  },
                },
                semester: {
                  select: {
                    id: true,
                    name: true,
                    startDate: true,
                    endDate: true,
                  },
                },
              },
            },
            faculty: {
              include: {
                user: {
                  select: {
                    first_name: true,
                    last_name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Get unique courses
    const courseIds = [
      ...new Set(
        studentSections.map((ss) => ss.section.courseOffering.courseId)
      ),
    ];
    const totalCourses = courseIds.length;

    // Get current semester
    const currentSemester = await prisma.semesters.findFirst({
      where: {
        status: 'active',
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Get assessments for student's sections
    const courseOfferingIds = studentSections.map(
      (ss) => ss.section.courseOfferingId
    );
    const assessments = await prisma.assessments.findMany({
      where: {
        courseOfferingId: {
          in: courseOfferingIds,
        },
        status: {
          in: ['active', 'published'],
        },
      },
      include: {
        courseOffering: {
          include: {
            course: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    // Get upcoming assessments (next 7 days)
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingAssessments = assessments.filter((a) => {
      if (!a.dueDate) return false;
      const dueDate = new Date(a.dueDate);
      return dueDate >= now && dueDate <= nextWeek;
    });

    // Get overdue assessments
    const overdueAssessments = assessments.filter((a) => {
      if (!a.dueDate) return false;
      return new Date(a.dueDate) < now;
    });

    // Get assessment results
    const assessmentResults = await prisma.studentassessmentresults.findMany({
      where: {
        studentId: studentId,
        assessmentId: {
          in: assessments.map((a) => a.id),
        },
      },
      include: {
        assessment: {
          select: {
            id: true,
            title: true,
            type: true,
            totalMarks: true,
          },
        },
      },
    });

    const completedAssignments = assessmentResults.filter(
      (r) => r.status === 'evaluated' || r.status === 'published'
    ).length;

    // Calculate average grade from published results
    const publishedResults = assessmentResults.filter(
      (r) => r.status === 'published'
    );
    const averageGrade =
      publishedResults.length > 0
        ? publishedResults.reduce((sum, r) => sum + r.percentage, 0) /
          publishedResults.length
        : 0;

    // Get student grades
    const grades = await prisma.studentgrades.findMany({
      where: {
        studentId: studentId,
        status: 'active',
      },
      include: {
        courseOffering: {
          include: {
            course: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Calculate CGPA from grades
    let totalQualityPoints = 0;
    let totalCreditHours = 0;
    grades.forEach((grade) => {
      totalQualityPoints += grade.qualityPoints;
      totalCreditHours += grade.creditHours;
    });
    const cgpa = totalCreditHours > 0 ? totalQualityPoints / totalCreditHours : 0;

    // Get recent activities (last 5)
    const recentActivities = await prisma.notifications.findMany({
      where: {
        userId: student.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
      select: {
        id: true,
        message: true,
        type: true,
        createdAt: true,
      },
    });

    // Format courses for display
    const courses = studentSections.map((ss) => {
      const section = ss.section;
      const course = section.courseOffering.course;
      const faculty = section.faculty;
      const facultyName = faculty
        ? `${faculty.user.first_name} ${faculty.user.last_name}`
        : 'TBA';

      // Get grade for this course
      const courseGrade = grades.find(
        (g) => g.courseOfferingId === section.courseOfferingId
      );

      return {
        id: course.id,
        code: course.code,
        name: course.name,
        instructor: facultyName,
        grade: courseGrade?.grade || null,
        sectionName: section.name,
        creditHours: course.creditHours,
        courseId: course.id, // Add courseId for linking
      };
    });

    // Format assignments for display
    const assignments = assessments.slice(0, 5).map((assessment) => {
      const result = assessmentResults.find(
        (r) => r.assessmentId === assessment.id
      );
      const dueDate = assessment.dueDate
        ? new Date(assessment.dueDate)
        : null;
      const isOverdue = dueDate && dueDate < now;
      const isUpcoming = dueDate && dueDate >= now;

      let status: 'upcoming' | 'submitted' | 'overdue' = 'upcoming';
      if (result) {
        status = 'submitted';
      } else if (isOverdue) {
        status = 'overdue';
      }

      return {
        id: assessment.id,
        title: assessment.title,
        course: assessment.courseOffering.course.code,
        dueDate: dueDate ? dueDate.toISOString() : null,
        status,
        priority: isOverdue ? 'high' : isUpcoming ? 'medium' : 'low',
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        studentInfo: {
          name: `${student.user.first_name} ${student.user.last_name}`,
          studentId: student.rollNumber,
          program: student.program?.name || 'N/A',
          semester: currentSemester?.name || 'N/A',
          cgpa: parseFloat(cgpa.toFixed(2)),
        },
        stats: {
          enrolledCourses: totalCourses,
          averageGrade: parseFloat(averageGrade.toFixed(1)),
          attendanceRate: 0, // TODO: Implement attendance tracking
          completedAssignments,
        },
        courses,
        assignments,
        recentActivities: recentActivities.map((activity) => ({
          id: activity.id.toString(),
          summary: activity.message,
          time: formatTimeAgo(activity.createdAt),
          type: activity.type,
        })),
        upcomingAssessments: upcomingAssessments.length,
        overdueAssessments: overdueAssessments.length,
      },
    });
  } catch (error) {
    console.error('Error fetching student overview:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch student overview' },
      { status: 500 }
    );
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}

