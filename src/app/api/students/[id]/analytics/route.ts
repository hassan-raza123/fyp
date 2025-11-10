import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFacultyIdFromRequest } from '@/lib/faculty-utils';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = await Promise.resolve(parseInt(params.id));

    if (isNaN(studentId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid student ID' },
        { status: 400 }
      );
    }

    // Get logged-in faculty ID
    const facultyId = await getFacultyIdFromRequest(req);
    if (!facultyId) {
      return NextResponse.json(
        { success: false, error: 'Faculty not found or unauthorized' },
        { status: 401 }
      );
    }

    // Get student details
    const student = await prisma.students.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        batch: {
          select: {
            id: true,
            name: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    // Get student's sections where faculty teaches
    const studentSections = await prisma.studentsections.findMany({
      where: {
        studentId: studentId,
        section: {
          facultyId: facultyId,
          status: 'active',
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
                  },
                },
              },
            },
          },
        },
      },
    });

    const sectionIds = studentSections.map((ss) => ss.sectionId);
    const courseOfferingIds = studentSections.map(
      (ss) => ss.section.courseOfferingId
    );

    // Get all assessments for these course offerings
    const assessments = await prisma.assessments.findMany({
      where: {
        courseOfferingId: {
          in: courseOfferingIds,
        },
        conductedBy: facultyId,
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
            semester: {
              select: {
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

    const assessmentIds = assessments.map((a) => a.id);

    // Get student's assessment results
    const assessmentResults = await prisma.studentassessmentresults.findMany({
      where: {
        studentId: studentId,
        assessmentId: {
          in: assessmentIds,
        },
      },
      include: {
        assessment: {
          include: {
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
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate overall performance
    const evaluatedResults = assessmentResults.filter(
      (r) => r.status === 'evaluated' || r.status === 'published'
    );
    const overallPerformance =
      evaluatedResults.length > 0
        ? evaluatedResults.reduce((sum, r) => sum + r.percentage, 0) /
          evaluatedResults.length
        : 0;

    // Calculate performance by course
    const coursePerformanceMap = new Map<
      number,
      {
        courseId: number;
        courseCode: string;
        courseName: string;
        assessments: any[];
        averagePercentage: number;
        totalAssessments: number;
        completedAssessments: number;
      }
    >();

    assessments.forEach((assessment) => {
      const courseId = assessment.courseOffering.course.id;
      if (!coursePerformanceMap.has(courseId)) {
        coursePerformanceMap.set(courseId, {
          courseId,
          courseCode: assessment.courseOffering.course.code,
          courseName: assessment.courseOffering.course.name,
          assessments: [],
          averagePercentage: 0,
          totalAssessments: 0,
          completedAssessments: 0,
        });
      }
    });

    assessmentResults.forEach((result) => {
      const courseId = result.assessment.courseOffering.course.id;
      const courseData = coursePerformanceMap.get(courseId);
      if (courseData) {
        courseData.assessments.push(result);
        if (result.status === 'evaluated' || result.status === 'published') {
          courseData.completedAssessments++;
        }
      }
    });

    // Calculate average for each course
    const coursePerformance = Array.from(coursePerformanceMap.values()).map(
      (course) => {
        const evaluatedCourseResults = course.assessments.filter(
          (r) => r.status === 'evaluated' || r.status === 'published'
        );
        const avgPercentage =
          evaluatedCourseResults.length > 0
            ? evaluatedCourseResults.reduce((sum, r) => sum + r.percentage, 0) /
              evaluatedCourseResults.length
            : 0;

        return {
          ...course,
          averagePercentage: avgPercentage,
          totalAssessments: assessments.filter(
            (a) => a.courseOffering.course.id === course.courseId
          ).length,
        };
      }
    );

    // Get CLO attainments for student's courses
    const cloAttainments = await prisma.closattainments.findMany({
      where: {
        courseOfferingId: {
          in: courseOfferingIds,
        },
        sectionId: {
          in: sectionIds,
        },
        status: 'active',
      },
      include: {
        clo: {
          select: {
            id: true,
            code: true,
            description: true,
          },
        },
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
      orderBy: {
        calculatedAt: 'desc',
      },
    });

    // Group CLO attainments by course
    const cloAttainmentByCourse = new Map<
      number,
      Array<{
        cloCode: string;
        cloDescription: string;
        attainmentPercent: number;
        threshold: number;
        status: string;
        calculatedAt: Date;
      }>
    >();

    cloAttainments.forEach((ca) => {
      const courseId = ca.courseOffering.course.id;
      if (!cloAttainmentByCourse.has(courseId)) {
        cloAttainmentByCourse.set(courseId, []);
      }
      const courseClos = cloAttainmentByCourse.get(courseId);
      if (courseClos) {
        // Only add if not already added (get latest)
        const existing = courseClos.find((c) => c.cloCode === ca.clo.code);
        if (!existing) {
          courseClos.push({
            cloCode: ca.clo.code,
            cloDescription: ca.clo.description,
            attainmentPercent: ca.attainmentPercent,
            threshold: ca.threshold,
            status:
              ca.attainmentPercent >= ca.threshold
                ? 'attained'
                : 'not_attained',
            calculatedAt: ca.calculatedAt,
          });
        }
      }
    });

    // Format CLO attainments by course
    const cloAttainmentSummary = coursePerformance.map((course) => ({
      courseId: course.courseId,
      courseCode: course.courseCode,
      courseName: course.courseName,
      clos: cloAttainmentByCourse.get(course.courseId) || [],
    }));

    // Calculate performance trends (by semester)
    const semesterPerformanceMap = new Map<
      string,
      {
        semester: string;
        assessments: any[];
        averagePercentage: number;
      }
    >();

    assessmentResults.forEach((result) => {
      const semester =
        result.assessment.courseOffering.semester.name || 'Unknown';
      if (!semesterPerformanceMap.has(semester)) {
        semesterPerformanceMap.set(semester, {
          semester,
          assessments: [],
          averagePercentage: 0,
        });
      }
      const semesterData = semesterPerformanceMap.get(semester);
      if (semesterData) {
        semesterData.assessments.push(result);
      }
    });

    const performanceTrends = Array.from(semesterPerformanceMap.values()).map(
      (semester) => {
        const evaluatedSemesterResults = semester.assessments.filter(
          (r) => r.status === 'evaluated' || r.status === 'published'
        );
        const avgPercentage =
          evaluatedSemesterResults.length > 0
            ? evaluatedSemesterResults.reduce(
                (sum, r) => sum + r.percentage,
                0
              ) / evaluatedSemesterResults.length
            : 0;

        return {
          semester: semester.semester,
          averagePercentage: avgPercentage,
          totalAssessments: semester.assessments.length,
        };
      }
    );

    // Get class averages for comparison
    const classAverages = await Promise.all(
      courseOfferingIds.map(async (coId) => {
        const courseOffering = await prisma.courseofferings.findUnique({
          where: { id: coId },
          include: {
            course: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
            sections: {
              where: {
                id: {
                  in: sectionIds,
                },
              },
              include: {
                studentsections: {
                  select: {
                    studentId: true,
                  },
                },
              },
            },
          },
        });

        if (!courseOffering) return null;

        const sectionStudentIds = courseOffering.sections.flatMap((s) =>
          s.studentsections.map((ss) => ss.studentId)
        );

        const courseAssessments = assessments.filter(
          (a) => a.courseOfferingId === coId
        );
        const courseAssessmentIds = courseAssessments.map((a) => a.id);

        const classResults = await prisma.studentassessmentresults.findMany({
          where: {
            assessmentId: {
              in: courseAssessmentIds,
            },
            studentId: {
              in: sectionStudentIds,
            },
            status: {
              in: ['evaluated', 'published'],
            },
          },
        });

        const classAverage =
          classResults.length > 0
            ? classResults.reduce((sum, r) => sum + r.percentage, 0) /
              classResults.length
            : 0;

        return {
          courseId: courseOffering.course.id,
          courseCode: courseOffering.course.code,
          courseName: courseOffering.course.name,
          classAverage,
        };
      })
    );

    // Match class averages with student performance
    const performanceComparison = coursePerformance.map((studentCourse) => {
      const classAvg = classAverages.find(
        (ca) => ca && ca.courseId === studentCourse.courseId
      );
      return {
        ...studentCourse,
        classAverage: classAvg?.classAverage || 0,
        difference:
          studentCourse.averagePercentage - (classAvg?.classAverage || 0),
      };
    });

    // Get enrollment history
    const enrollmentHistory = studentSections.map((ss) => ({
      sectionId: ss.section.id,
      sectionName: ss.section.name,
      course: {
        id: ss.section.courseOffering.course.id,
        code: ss.section.courseOffering.course.code,
        name: ss.section.courseOffering.course.name,
      },
      semester: ss.section.courseOffering.semester.name,
      status: ss.status,
      enrolledAt: ss.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        student: {
          id: student.id,
          rollNumber: student.rollNumber,
          name: `${student.user.first_name} ${student.user.last_name}`,
          email: student.user.email,
          batch: student.batch,
          department: student.department,
        },
        overallPerformance,
        totalAssessments: assessments.length,
        completedAssessments: evaluatedResults.length,
        coursePerformance: performanceComparison,
        cloAttainmentSummary,
        performanceTrends,
        enrollmentHistory,
        assessmentResults: assessmentResults.map((r) => ({
          id: r.id,
          assessmentTitle: r.assessment.title,
          assessmentType: r.assessment.type,
          course: {
            code: r.assessment.courseOffering.course.code,
            name: r.assessment.courseOffering.course.name,
          },
          semester: r.assessment.courseOffering.semester.name,
          obtainedMarks: r.obtainedMarks,
          totalMarks: r.totalMarks,
          percentage: r.percentage,
          status: r.status,
          submittedAt: r.submittedAt,
          evaluatedAt: r.evaluatedAt,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching student analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch student analytics' },
      { status: 500 }
    );
  }
}
