import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStudentIdFromRequest } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  try {
    const courseId = parseInt(params.id);
    if (isNaN(courseId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid course ID' },
        { status: 400 }
      );
    }

    const studentId = await getStudentIdFromRequest(req);
    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Student not found or unauthorized' },
        { status: 401 }
      );
    }

    // Get all course offerings where student was enrolled
    const studentSections = await prisma.studentsections.findMany({
      where: {
        studentId: studentId,
        section: {
          courseOffering: {
            courseId: courseId,
          },
        },
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get grades for these offerings
    const courseOfferingIds = studentSections.map(
      (ss) => ss.section.courseOfferingId
    );
    const grades = await prisma.studentgrades.findMany({
      where: {
        studentId: studentId,
        courseOfferingId: {
          in: courseOfferingIds,
        },
        status: 'active',
      },
    });

    // Format offerings with grades
    const offerings = studentSections.map((ss) => {
      const section = ss.section;
      const offering = section.courseOffering;
      const grade = grades.find(
        (g) => g.courseOfferingId === offering.id
      );
      const faculty = section.faculty;
      const facultyName = faculty
        ? `${faculty.user.first_name} ${faculty.user.last_name}`
        : 'TBA';

      return {
        courseOfferingId: offering.id,
        semester: {
          id: offering.semester.id,
          name: offering.semester.name,
          startDate: offering.semester.startDate,
          endDate: offering.semester.endDate,
        },
        section: {
          id: section.id,
          name: section.name,
          faculty: facultyName,
        },
        grade: grade
          ? {
              grade: grade.grade,
              percentage: grade.percentage,
              gpaPoints: grade.gpaPoints,
              obtainedMarks: grade.obtainedMarks,
              totalMarks: grade.totalMarks,
            }
          : null,
        enrollmentDate: ss.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        course: {
          id: courseId,
          code: studentSections[0]?.section.courseOffering.course.code || '',
          name: studentSections[0]?.section.courseOffering.course.name || '',
        },
        offerings,
      },
    });
  } catch (error) {
    console.error('Error fetching course offerings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch course offerings' },
      { status: 500 }
    );
  }
}

