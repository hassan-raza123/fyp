import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFacultyIdFromRequest } from '@/lib/faculty-utils';

// GET - Get grades for faculty's course offerings
export async function GET(req: NextRequest) {
  try {
    const facultyId = await getFacultyIdFromRequest(req);
    if (!facultyId) {
      return NextResponse.json(
        { success: false, error: 'Faculty not found or unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const courseOfferingId = searchParams.get('courseOfferingId');
    const sectionId = searchParams.get('sectionId');

    // Get faculty's sections
    const sections = await prisma.sections.findMany({
      where: {
        facultyId: facultyId,
        status: 'active',
        ...(sectionId && { id: parseInt(sectionId) }),
        courseOffering: {
          ...(courseOfferingId && { id: parseInt(courseOfferingId) }),
        },
      },
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
              },
            },
          },
        },
      },
    });

    const courseOfferingIds = sections.map((s) => s.courseOfferingId);
    const sectionIds = sections.map((s) => s.id);

    // Get students in these sections
    const studentSections = await prisma.studentsections.findMany({
      where: {
        sectionId: {
          in: sectionIds,
        },
        status: 'active',
      },
      include: {
        student: {
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
    });

    const studentIds = studentSections.map((ss) => ss.studentId);

    // Get grades
    const grades = await prisma.studentgrades.findMany({
      where: {
        courseOfferingId: {
          in: courseOfferingIds,
        },
        studentId: {
          in: studentIds,
        },
        status: 'active',
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                first_name: true,
                last_name: true,
              },
            },
          },
        },
        courseOffering: {
          include: {
            course: {
              select: {
                code: true,
                name: true,
              },
            },
            semester: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        student: {
          rollNumber: 'asc',
        },
      },
    });

    // Group by course offering
    const gradesByCourseOffering = new Map<
      number,
      {
        courseOffering: any;
        grades: any[];
        statistics: {
          totalStudents: number;
          calculatedGrades: number;
          averagePercentage: number;
          gradeDistribution: Record<string, number>;
        };
      }
    >();

    sections.forEach((section) => {
      const coId = section.courseOfferingId;
      if (!gradesByCourseOffering.has(coId)) {
        gradesByCourseOffering.set(coId, {
          courseOffering: section.courseOffering,
          grades: [],
          statistics: {
            totalStudents: 0,
            calculatedGrades: 0,
            averagePercentage: 0,
            gradeDistribution: {},
          },
        });
      }
    });

    grades.forEach((grade) => {
      const data = gradesByCourseOffering.get(grade.courseOfferingId);
      if (data) {
        data.grades.push({
          id: grade.id,
          studentId: grade.studentId,
          rollNumber: grade.student.rollNumber,
          name: `${grade.student.user.first_name} ${grade.student.user.last_name}`,
          totalMarks: grade.totalMarks,
          obtainedMarks: grade.obtainedMarks,
          percentage: grade.percentage,
          grade: grade.grade,
          gpaPoints: grade.gpaPoints,
          qualityPoints: grade.qualityPoints,
          status: grade.status,
          calculatedAt: grade.calculatedAt.toISOString(),
        });
      }
    });

    // Calculate statistics
    gradesByCourseOffering.forEach((data, coId) => {
      const section = sections.find((s) => s.courseOfferingId === coId);
      if (section) {
        const sectionStudentIds = studentSections
          .filter((ss) => ss.sectionId === section.id)
          .map((ss) => ss.studentId);
        data.statistics.totalStudents = sectionStudentIds.length;
        data.statistics.calculatedGrades = data.grades.length;

        if (data.grades.length > 0) {
          data.statistics.averagePercentage =
            data.grades.reduce((sum, g) => sum + g.percentage, 0) /
            data.grades.length;

          // Grade distribution
          data.grades.forEach((g) => {
            data.statistics.gradeDistribution[g.grade] =
              (data.statistics.gradeDistribution[g.grade] || 0) + 1;
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: Array.from(gradesByCourseOffering.values()),
    });
  } catch (error) {
    console.error('Error fetching grades:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch grades' },
      { status: 500 }
    );
  }
}


