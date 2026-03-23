import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStudentFromRequest } from '@/lib/auth';

// Helper function to convert grade to GPA points
function getGradePoints(grade: string | null): number {
  if (!grade) return 0;
  const gradeMap: Record<string, number> = {
    'A+': 4.0,
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

    // Get student's grades
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
      orderBy: {
        courseOffering: {
          semester: {
            startDate: 'asc',
          },
        },
      },
    });

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
    const sectionIds = studentSections.map((ss) => ss.sectionId);

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
            courseId: true,
          },
        },
        courseOffering: {
          include: {
            course: {
              select: {
                id: true,
                code: true,
              },
            },
          },
        },
      },
      orderBy: {
        calculatedAt: 'desc',
      },
    });

    // Get assessments for CLO/LLO calculation
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
              },
            },
            llo: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    // Get student's assessment results
    const assessmentResults = await prisma.studentassessmentresults.findMany({
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
                llo: {
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

    // Calculate student's personal LLO attainments
    const studentLLOAttainments = new Map<number, number>();
    const lloItemsMap = new Map<
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
        if (item.llo) {
          const lloId = item.llo.id;
          if (!lloItemsMap.has(lloId)) {
            lloItemsMap.set(lloId, []);
          }
          lloItemsMap.get(lloId)!.push({
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

        assessmentResults.forEach((result) => {
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

    // Calculate student's attainment for each LLO
    lloItemsMap.forEach((items, lloId) => {
      let totalPossibleMarks = 0;
      let studentObtainedMarks = 0;

      items.forEach((item) => {
        totalPossibleMarks += item.marks;

        assessmentResults.forEach((result) => {
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
        studentLLOAttainments.set(lloId, percentage);
      }
    });

    // Group CLO attainments by course
    const cloAttainmentByCourse = new Map<
      number,
      Array<{
        cloCode: string;
        cloDescription: string;
        attainmentPercent: number;
        status: 'attained' | 'not_attained';
      }>
    >();

    const latestCLOAttainments = new Map();
    cloAttainments.forEach((attainment) => {
      const cloId = attainment.cloId;
      if (!latestCLOAttainments.has(cloId)) {
        latestCLOAttainments.set(cloId, attainment);
      }
    });

    latestCLOAttainments.forEach((attainment, cloId) => {
      const studentAttainment = studentCLOAttainments.get(cloId) || 0;
      const threshold = attainment.threshold || 60;
      const courseId = attainment.courseOffering.course.id;

      if (!cloAttainmentByCourse.has(courseId)) {
        cloAttainmentByCourse.set(courseId, []);
      }

      cloAttainmentByCourse.get(courseId)!.push({
        cloCode: attainment.clo.code,
        cloDescription: attainment.clo.description,
        attainmentPercent: parseFloat(studentAttainment.toFixed(2)),
        status:
          studentAttainment >= threshold ? 'attained' : 'not_attained',
      });
    });

    // Get PLO attainments
    const programId = student.program?.id || student.programId;
    let ploAttainments: any[] = [];
    if (programId) {
      // Get threshold from graduation criteria instead of hardcoding
      const criteria = await prisma.graduation_criteria.findFirst({
        where: { programId: programId },
      });
      const ploThreshold = criteria?.minPloAttainmentPercent ?? 60;

      const plos = await prisma.plos.findMany({
        where: {
          programId: programId,
          status: 'active',
        },
        include: {
          cloMappings: {
            include: {
              clo: {
                select: {
                  id: true,
                },
              },
            },
          },
          lloMappings: {
            include: {
              llo: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      });

      ploAttainments = plos.map((plo) => {
        // Include CLO contributions
        const contributingClos = plo.cloMappings.map((mapping) => {
          const cloId = mapping.clo.id;
          const studentAttainment = studentCLOAttainments.get(cloId) || 0;
          return {
            weight: mapping.weight,
            studentAttainment: parseFloat(studentAttainment.toFixed(2)),
          };
        });

        // Include LLO contributions
        const contributingLlos = plo.lloMappings.map((mapping) => {
          const lloId = mapping.llo.id;
          const studentAttainment = studentLLOAttainments.get(lloId) || 0;
          return {
            weight: mapping.weight,
            studentAttainment: parseFloat(studentAttainment.toFixed(2)),
          };
        });

        const allContributions = [...contributingClos, ...contributingLlos];

        const totalWeight = allContributions.reduce(
          (sum, item) => sum + item.weight,
          0
        );
        const studentWeightedSum = allContributions.reduce(
          (sum, item) => sum + item.studentAttainment * item.weight,
          0
        );
        const studentPLOAttainment =
          totalWeight > 0 ? studentWeightedSum / totalWeight : 0;

        return {
          ploCode: plo.code,
          description: plo.description,
          attainmentPercent: parseFloat(studentPLOAttainment.toFixed(2)),
          status:
            studentPLOAttainment >= ploThreshold ? 'attained' : 'not_attained',
        };
      });
    }

    // Group grades by semester
    const semesterGrades = new Map<
      string,
      {
        semester: string;
        semesterId: number;
        courses: any[];
        gpa: number;
        creditHours: number;
      }
    >();

    grades.forEach((grade) => {
      const semester = grade.courseOffering.semester.name;
      if (!semesterGrades.has(semester)) {
        semesterGrades.set(semester, {
          semester,
          semesterId: grade.courseOffering.semester.id,
          courses: [],
          gpa: 0,
          creditHours: 0,
        });
      }
      const semesterData = semesterGrades.get(semester)!;
      semesterData.courses.push({
        courseCode: grade.courseOffering.course.code,
        courseName: grade.courseOffering.course.name,
        creditHours: grade.creditHours,
        grade: grade.grade,
        gpaPoints: grade.gpaPoints,
        percentage: grade.percentage,
        cloAttainments:
          cloAttainmentByCourse.get(grade.courseOffering.course.id) || [],
      });
      semesterData.creditHours += grade.creditHours;
    });

    // Calculate semester GPAs
    const semesterData = Array.from(semesterGrades.values()).map((semester) => {
      let totalPoints = 0;
      let totalCredits = 0;
      semester.courses.forEach((course) => {
        totalPoints += course.gpaPoints * course.creditHours;
        totalCredits += course.creditHours;
      });
      const semesterGPA = totalCredits > 0 ? totalPoints / totalCredits : 0;

      return {
        ...semester,
        gpa: parseFloat(semesterGPA.toFixed(2)),
      };
    });

    // Calculate overall CGPA
    let totalPoints = 0;
    let totalCredits = 0;
    grades.forEach((grade) => {
      totalPoints += grade.gpaPoints * grade.creditHours;
      totalCredits += grade.creditHours;
    });
    const cgpa = totalCredits > 0 ? totalPoints / totalCredits : 0;

    // Calculate degree completion status
    const totalCreditHours = grades.reduce(
      (sum, grade) => sum + grade.creditHours,
      0
    );
    const program = await prisma.programs.findUnique({
      where: { id: student.programId },
      select: { totalCreditHours: true },
    });
    const requiredCreditHours = program?.totalCreditHours || 0;
    const completionPercentage =
      requiredCreditHours > 0
        ? (totalCreditHours / requiredCreditHours) * 100
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        student: {
          id: student.id,
          rollNumber: student.rollNumber,
          name: `${student.user?.first_name} ${student.user?.last_name}`,
          email: student.user?.email,
          program: student.program,
          department: student.department,
          batch: student.batch,
        },
        semesters: semesterData,
        overall: {
          cgpa: parseFloat(cgpa.toFixed(2)),
          totalCreditHours,
          requiredCreditHours,
          completionPercentage: parseFloat(completionPercentage.toFixed(2)),
          totalCourses: grades.length,
        },
        cloAttainmentsSummary: {
          total: Array.from(cloAttainmentByCourse.values()).flat().length,
          attained: Array.from(cloAttainmentByCourse.values())
            .flat()
            .filter((clo) => clo.status === 'attained').length,
        },
        ploAttainmentsSummary: {
          total: ploAttainments.length,
          attained: ploAttainments.filter((plo) => plo.status === 'attained')
            .length,
          plos: ploAttainments,
        },
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching student transcript:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transcript' },
      { status: 500 }
    );
  }
}

