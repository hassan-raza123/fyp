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

    const studentId = student.id;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

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
          },
        },
      },
    });

    const courseOfferingIds = studentSections.map(
      (ss) => ss.section.courseOfferingId
    );

    // Get assessments with due dates
    const assessments = await prisma.assessments.findMany({
      where: {
        courseOfferingId: {
          in: courseOfferingIds,
        },
        status: {
          in: ['active', 'completed'],
        },
        dueDate: {
          not: null,
        },
        ...(startDate &&
          endDate && {
            dueDate: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }),
      },
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
            semester: {
              select: {
                id: true,
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

    // Get unique semesters
    const semesters = new Map();
    studentSections.forEach((ss) => {
      const semester = ss.section.courseOffering.semester;
      if (!semesters.has(semester.id)) {
        semesters.set(semester.id, semester);
      }
    });

    // Build calendar events
    const events: any[] = [];

    // Add assessment events
    assessments.forEach((assessment) => {
      if (assessment.dueDate) {
        const dueDate = new Date(assessment.dueDate);
        const isExam = assessment.type === 'mid_exam' || assessment.type === 'final_exam';
        
        events.push({
          id: `assessment-${assessment.id}`,
          title: assessment.title,
          description: assessment.description || '',
          date: dueDate.toISOString(),
          type: 'assessment',
          category: isExam ? 'exam' : 'assessment',
          course: {
            code: assessment.courseOffering.course.code,
            name: assessment.courseOffering.course.name,
          },
          semester: assessment.courseOffering.semester.name,
          assessmentId: assessment.id,
          assessmentType: assessment.type,
          totalMarks: assessment.totalMarks,
          startTime: (assessment as any).startTime || null,
          endTime: (assessment as any).endTime || null,
        });
      }
    });

    // Add semester start/end events
    semesters.forEach((semester) => {
      if (semester.startDate) {
        const semesterStartDate = new Date(semester.startDate);
        // Check if within date range if provided
        if (
          !startDate ||
          !endDate ||
          (semesterStartDate >= new Date(startDate) &&
            semesterStartDate <= new Date(endDate))
        ) {
          events.push({
            id: `semester-start-${semester.id}`,
            title: `${semester.name} - Semester Start`,
            description: `Start of ${semester.name} semester`,
            date: semesterStartDate.toISOString(),
            type: 'semester',
            category: 'semester',
            semester: semester.name,
            allDay: true,
          });
        }
      }

      if (semester.endDate) {
        const semesterEndDate = new Date(semester.endDate);
        // Check if within date range if provided
        if (
          !startDate ||
          !endDate ||
          (semesterEndDate >= new Date(startDate) &&
            semesterEndDate <= new Date(endDate))
        ) {
          events.push({
            id: `semester-end-${semester.id}`,
            title: `${semester.name} - Semester End`,
            description: `End of ${semester.name} semester`,
            date: semesterEndDate.toISOString(),
            type: 'semester',
            category: 'semester',
            semester: semester.name,
            allDay: true,
          });
        }
      }
    });

    // Get notifications as announcements (if they have dates)
    // For now, we'll skip this as notifications don't have dates in the schema
    // But we can add system announcements if needed

    // Sort events by date
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({
      success: true,
      data: {
        events,
        summary: {
          total: events.length,
          assessments: events.filter((e) => e.type === 'assessment').length,
          exams: events.filter((e) => e.category === 'exam').length,
          semesterEvents: events.filter((e) => e.type === 'semester').length,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}

