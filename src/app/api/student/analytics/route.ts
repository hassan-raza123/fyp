import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStudentIdFromRequest, getStudentFromRequest } from '@/lib/student-utils';

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
          },
        },
      },
      orderBy: {
        section: {
          courseOffering: {
            semester: {
              startDate: 'desc',
            },
          },
        },
      },
    });

    const courseOfferingIds = studentSections.map(
      (ss) => ss.section.courseOfferingId
    );
    const sectionIds = studentSections.map((ss) => ss.sectionId);

    // Get all assessments for student's courses
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
        assessmentItems: {
          include: {
            clo: {
              select: {
                id: true,
                code: true,
                description: true,
              },
            },
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

    // Get student's assessment results
    const assessmentResults = await prisma.studentassessmentresults.findMany({
      where: {
        studentId: studentId,
        assessmentId: {
          in: assessments.map((a) => a.id),
        },
      },
      include: {
        assessment: {
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get student's grades
    const grades = await prisma.studentgrades.findMany({
      where: {
        studentId: studentId,
        courseOfferingId: {
          in: courseOfferingIds,
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
                startDate: true,
              },
            },
          },
        },
      },
      orderBy: {
        courseOffering: {
          semester: {
            startDate: 'desc',
          },
        },
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

    // Calculate semester-wise performance
    const semesterPerformanceMap = new Map<
      string,
      {
        semester: string;
        semesterId: number;
        assessments: any[];
        averagePercentage: number;
        gpa: number;
        creditHours: number;
      }
    >();

    grades.forEach((grade) => {
      const semester = grade.courseOffering.semester.name;
      if (!semesterPerformanceMap.has(semester)) {
        semesterPerformanceMap.set(semester, {
          semester,
          semesterId: grade.courseOffering.semester.id,
          assessments: [],
          averagePercentage: 0,
          gpa: 0,
          creditHours: 0,
        });
      }
      const semesterData = semesterPerformanceMap.get(semester)!;
      semesterData.creditHours += grade.courseOffering.course.creditHours || 0;
    });

    assessmentResults.forEach((result) => {
      const semester =
        result.assessment.courseOffering.semester.name || 'Unknown';
      const semesterData = semesterPerformanceMap.get(semester);
      if (semesterData) {
        semesterData.assessments.push(result);
      }
    });

    // Calculate semester averages and GPA
    const semesterPerformance = Array.from(semesterPerformanceMap.values())
      .map((semester) => {
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

        // Calculate semester GPA from grades
        const semesterGrades = grades.filter(
          (g) => g.courseOffering.semester.name === semester.semester
        );
        let totalPoints = 0;
        let totalCredits = 0;
        semesterGrades.forEach((grade) => {
          const creditHours = grade.courseOffering.course.creditHours || 0;
          const gradePoints = getGradePoints(grade.grade);
          totalPoints += gradePoints * creditHours;
          totalCredits += creditHours;
        });
        const semesterGPA = totalCredits > 0 ? totalPoints / totalCredits : 0;

        return {
          semester: semester.semester,
          semesterId: semester.semesterId,
          averagePercentage: parseFloat(avgPercentage.toFixed(2)),
          gpa: parseFloat(semesterGPA.toFixed(2)),
          totalAssessments: semester.assessments.length,
          completedAssessments: evaluatedSemesterResults.length,
        };
      })
      .sort((a, b) => a.semesterId - b.semesterId);

    // Calculate overall CGPA
    let totalPoints = 0;
    let totalCredits = 0;
    grades.forEach((grade) => {
      const creditHours = grade.courseOffering.course.creditHours || 0;
      const gradePoints = getGradePoints(grade.grade);
      totalPoints += gradePoints * creditHours;
      totalCredits += creditHours;
    });
    const cgpa = totalCredits > 0 ? totalPoints / totalCredits : 0;

    // Calculate course-wise performance
    const coursePerformanceMap = new Map<
      number,
      {
        courseId: number;
        courseCode: string;
        courseName: string;
        semester: string;
        assessments: any[];
        averagePercentage: number;
        grade: string | null;
        gpa: number;
      }
    >();

    assessments.forEach((assessment) => {
      const courseId = assessment.courseOffering.course.id;
      if (!coursePerformanceMap.has(courseId)) {
        coursePerformanceMap.set(courseId, {
          courseId,
          courseCode: assessment.courseOffering.course.code,
          courseName: assessment.courseOffering.course.name,
          semester: assessment.courseOffering.semester.name,
          assessments: [],
          averagePercentage: 0,
          grade: null,
          gpa: 0,
        });
      }
    });

    assessmentResults.forEach((result) => {
      const courseId = result.assessment.courseOffering.course.id;
      const courseData = coursePerformanceMap.get(courseId);
      if (courseData) {
        courseData.assessments.push(result);
      }
    });

    // Add grades to course performance
    grades.forEach((grade) => {
      const courseData = coursePerformanceMap.get(
        grade.courseOffering.course.id
      );
      if (courseData) {
        courseData.grade = grade.grade;
        courseData.gpa = getGradePoints(grade.grade);
      }
    });

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
          averagePercentage: parseFloat(avgPercentage.toFixed(2)),
          totalAssessments: course.assessments.length,
          completedAssessments: evaluatedCourseResults.length,
        };
      }
    );

    // Get CLO attainments
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

    // Get student's assessment results with item results first
    const studentResults = await prisma.studentassessmentresults.findMany({
      where: {
        studentId: studentId,
        assessmentId: {
          in: assessments.map((a) => a.id),
        },
        status: {
          in: ['evaluated', 'published'],
        },
      },
      include: {
        itemResults: {
          include: {
            assessmentItem: {
              include: {
                clo: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Calculate student's personal CLO attainments
    const studentCLOAttainments = new Map<number, number>();
    const cloItemsMap = new Map<
      number,
      Array<{ itemId: number; marks: number }>
    >();

    assessments.forEach((assessment) => {
      assessment.assessmentItems.forEach((item) => {
        if (item.clo) {
          const cloId = item.clo.id;
          if (!cloItemsMap.has(cloId)) {
            cloItemsMap.set(cloId, []);
          }
          cloItemsMap.get(cloId)!.push({
            itemId: item.id,
            marks: item.marks,
          });
        }
      });
    });

    // Calculate student's attainment for each CLO
    cloItemsMap.forEach((items, cloId) => {
      let totalPossibleMarks = 0;
      let studentObtainedMarks = 0;

      items.forEach((item) => {
        totalPossibleMarks += item.marks;

        studentResults.forEach((result) => {
          const itemResult = result.itemResults.find(
            (ir) => ir.assessmentItem.id === item.itemId
          );
          if (itemResult) {
            studentObtainedMarks += itemResult.obtainedMarks;
          }
        });
      });

      if (totalPossibleMarks > 0) {
        const percentage = (studentObtainedMarks / totalPossibleMarks) * 100;
        studentCLOAttainments.set(cloId, percentage);
      }
    });

    // Group CLO attainments
    const cloAttainmentList: Array<{
      cloId: number;
      cloCode: string;
      cloDescription: string;
      courseCode: string;
      courseName: string;
      studentAttainment: number;
      classAttainment: number;
      status: 'attained' | 'not_attained';
    }> = [];

    const latestCLOAttainments = new Map();
    cloAttainments.forEach((attainment) => {
      const cloId = attainment.cloId;
      if (!latestCLOAttainments.has(cloId)) {
        latestCLOAttainments.set(cloId, attainment);
      }
    });

    latestCLOAttainments.forEach((attainment, cloId) => {
      const studentAttainment = studentCLOAttainments.get(cloId) || 0;
      const classAttainment = attainment.attainmentPercent || 0;
      const threshold = attainment.threshold || 60;

      cloAttainmentList.push({
        cloId: cloId,
        cloCode: attainment.clo.code,
        cloDescription: attainment.clo.description,
        courseCode: attainment.courseOffering.course.code,
        courseName: attainment.courseOffering.course.name,
        studentAttainment: parseFloat(studentAttainment.toFixed(2)),
        classAttainment: parseFloat(classAttainment.toFixed(2)),
        status:
          studentAttainment >= threshold ? 'attained' : 'not_attained',
      });
    });

    // Sort CLOs by attainment
    const strongCLOs = cloAttainmentList
      .filter((clo) => clo.studentAttainment >= 70)
      .sort((a, b) => b.studentAttainment - a.studentAttainment);
    const weakCLOs = cloAttainmentList
      .filter((clo) => clo.studentAttainment < 70)
      .sort((a, b) => a.studentAttainment - b.studentAttainment);

    // Assessment analytics
    const assessmentAnalytics = {
      total: assessments.length,
      completed: evaluatedResults.length,
      pending: assessments.length - evaluatedResults.length,
      averagePercentage: overallPerformance,
      byType: {} as Record<string, { count: number; average: number }>,
      bestPerforming: [] as any[],
      needsImprovement: [] as any[],
    };

    // Group by assessment type
    assessments.forEach((assessment) => {
      const type = assessment.type;
      if (!assessmentAnalytics.byType[type]) {
        assessmentAnalytics.byType[type] = { count: 0, average: 0 };
      }
      assessmentAnalytics.byType[type].count++;
    });

    // Calculate averages by type
    Object.keys(assessmentAnalytics.byType).forEach((type) => {
      const typeResults = evaluatedResults.filter(
        (r) => r.assessment.type === type
      );
      const avg =
        typeResults.length > 0
          ? typeResults.reduce((sum, r) => sum + r.percentage, 0) /
            typeResults.length
          : 0;
      assessmentAnalytics.byType[type].average = parseFloat(avg.toFixed(2));
    });

    // Best and worst performing assessments
    const assessmentPerformance = evaluatedResults.map((result) => ({
      id: result.id,
      title: result.assessment.title,
      type: result.assessment.type,
      course: result.assessment.courseOffering.course.code,
      percentage: result.percentage,
      obtainedMarks: result.obtainedMarks,
      totalMarks: result.totalMarks,
    }));

    assessmentAnalytics.bestPerforming = assessmentPerformance
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);
    assessmentAnalytics.needsImprovement = assessmentPerformance
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, 5);

    // Grade distribution
    const gradeDistribution = {
      A: 0,
      'A-': 0,
      'B+': 0,
      B: 0,
      'B-': 0,
      'C+': 0,
      C: 0,
      'C-': 0,
      'D+': 0,
      D: 0,
      F: 0,
    };

    grades.forEach((grade) => {
      if (grade.grade in gradeDistribution) {
        gradeDistribution[grade.grade as keyof typeof gradeDistribution]++;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        student: {
          id: student.id,
          rollNumber: student.rollNumber,
          name: `${student.user?.first_name} ${student.user?.last_name}`,
          email: student.user?.email,
          program: student.program,
          batch: student.batch,
        },
        overallPerformance: {
          averagePercentage: parseFloat(overallPerformance.toFixed(2)),
          cgpa: parseFloat(cgpa.toFixed(2)),
          totalAssessments: assessments.length,
          completedAssessments: evaluatedResults.length,
        },
        semesterPerformance,
        coursePerformance,
        cloAnalytics: {
          total: cloAttainmentList.length,
          attained: cloAttainmentList.filter((c) => c.status === 'attained')
            .length,
          strongCLOs,
          weakCLOs,
          allCLOs: cloAttainmentList,
        },
        assessmentAnalytics,
        gradeDistribution,
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

// Helper function to convert grade to GPA points
function getGradePoints(grade: string | null): number {
  if (!grade) return 0;
  const gradeMap: Record<string, number> = {
    A: 4.0,
    'A-': 3.7,
    'B+': 3.3,
    B: 3.0,
    'B-': 2.7,
    'C+': 2.3,
    C: 2.0,
    'C-': 1.7,
    'D+': 1.3,
    D: 1.0,
    F: 0.0,
  };
  return gradeMap[grade] || 0;
}

