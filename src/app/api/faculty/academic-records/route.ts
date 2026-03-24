import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFacultyIdFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const facultyId = await getFacultyIdFromRequest(request);
    if (!facultyId) {
      return NextResponse.json(
        { success: false, error: 'Faculty not found or unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const semesterId = searchParams.get('semesterId');
    const sectionId = searchParams.get('sectionId');

    // Get all sections this faculty teaches (optionally filtered by semester)
    const sectionWhere: any = { facultyId };
    if (semesterId) sectionWhere.courseOffering = { semesterId: parseInt(semesterId) };
    if (sectionId) sectionWhere.id = parseInt(sectionId);

    const sections = await prisma.sections.findMany({
      where: sectionWhere,
      include: {
        courseOffering: {
          include: {
            course: { select: { id: true, code: true, name: true, creditHours: true } },
            semester: { select: { id: true, name: true, startDate: true } },
          },
        },
        studentsections: {
          include: {
            student: {
              include: {
                user: { select: { first_name: true, last_name: true, email: true } },
                program: { select: { id: true, code: true, name: true } },
                batch: { select: { id: true, name: true } },
                cumulativeGPA: {
                  select: {
                    cumulativeGPA: true,
                    totalCreditHours: true,
                    completedSemesters: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { courseOffering: { semester: { startDate: 'desc' } } },
    });

    // Gather unique student IDs from all sections
    const studentIdSet = new Set<number>();
    for (const section of sections) {
      for (const ss of section.studentsections) {
        studentIdSet.add(ss.studentId);
      }
    }
    const studentIds = Array.from(studentIdSet);

    // Fetch grades for these students (for all course offerings in faculty's sections)
    const courseOfferingIds = [...new Set(sections.map((s) => s.courseOfferingId))];

    const grades = await prisma.studentgrades.findMany({
      where: {
        studentId: { in: studentIds },
        courseOfferingId: { in: courseOfferingIds },
        status: 'active',
      },
      include: {
        courseOffering: {
          include: {
            course: { select: { id: true, code: true, name: true, creditHours: true } },
            semester: { select: { id: true, name: true, startDate: true } },
          },
        },
      },
    });

    // Build a map: studentId -> list of grades
    const gradesByStudent = new Map<number, typeof grades>();
    for (const grade of grades) {
      if (!gradesByStudent.has(grade.studentId)) {
        gradesByStudent.set(grade.studentId, []);
      }
      gradesByStudent.get(grade.studentId)!.push(grade);
    }

    // Build a map: studentId -> student info (from sections)
    const studentMap = new Map<
      number,
      {
        id: number;
        rollNumber: string;
        name: string;
        email: string;
        program: { id: number; code: string; name: string } | null;
        batch: { id: string; name: string } | null;
        cgpa: number;
        completedSemesters: number;
        totalCreditHours: number;
      }
    >();
    for (const section of sections) {
      for (const ss of section.studentsections) {
        const s = ss.student;
        if (!studentMap.has(s.id)) {
          studentMap.set(s.id, {
            id: s.id,
            rollNumber: s.rollNumber ?? '',
            name: `${s.user?.first_name ?? ''} ${s.user?.last_name ?? ''}`.trim(),
            email: s.user?.email ?? '',
            program: s.program
              ? { id: s.program.id, code: s.program.code, name: s.program.name }
              : null,
            batch: s.batch ? { id: s.batch.id, name: s.batch.name } : null,
            cgpa: Number(s.cumulativeGPA?.cumulativeGPA ?? 0),
            completedSemesters: s.cumulativeGPA?.completedSemesters ?? 0,
            totalCreditHours: s.cumulativeGPA?.totalCreditHours ?? 0,
          });
        }
      }
    }

    // Build students array with semester-wise grades
    const studentsData = Array.from(studentMap.values()).map((studentInfo) => {
      const studentGrades = gradesByStudent.get(studentInfo.id) ?? [];

      // Group by semester
      const semesterMap = new Map<
        number,
        {
          semesterId: number;
          semesterName: string;
          startDate: Date | null;
          courses: {
            courseCode: string;
            courseName: string;
            creditHours: number;
            grade: string;
            gpaPoints: number;
            percentage: number;
          }[];
          totalQualityPoints: number;
          totalCreditHours: number;
        }
      >();

      for (const grade of studentGrades) {
        const sem = grade.courseOffering.semester;
        const course = grade.courseOffering.course;

        if (!semesterMap.has(sem.id)) {
          semesterMap.set(sem.id, {
            semesterId: sem.id,
            semesterName: sem.name,
            startDate: (sem as any).startDate || null,
            courses: [],
            totalQualityPoints: 0,
            totalCreditHours: 0,
          });
        }

        const semData = semesterMap.get(sem.id)!;
        semData.courses.push({
          courseCode: course.code,
          courseName: course.name,
          creditHours: grade.creditHours ?? course.creditHours,
          grade: grade.grade ?? '',
          gpaPoints: Number(grade.gpaPoints ?? 0),
          percentage: Number(grade.percentage ?? 0),
        });
        semData.totalQualityPoints += Number(grade.qualityPoints ?? 0);
        semData.totalCreditHours += grade.creditHours ?? course.creditHours;
      }

      const semesters = Array.from(semesterMap.values())
        .sort((a, b) =>
          a.startDate && b.startDate
            ? new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
            : 0
        )
        .map((sem) => ({
          semesterId: sem.semesterId,
          semesterName: sem.semesterName,
          gpa:
            sem.totalCreditHours > 0
              ? Number((sem.totalQualityPoints / sem.totalCreditHours).toFixed(2))
              : 0,
          creditHours: sem.totalCreditHours,
          courses: sem.courses,
        }));

      return { ...studentInfo, semesters };
    });

    // Stats
    const studentsWithGrades = studentsData.filter((s) => s.semesters.length > 0);
    const totalStudents = studentsData.length;
    const avgCGPA =
      studentsWithGrades.length > 0
        ? studentsWithGrades.reduce((sum, s) => sum + s.cgpa, 0) / studentsWithGrades.length
        : 0;
    const passCount = studentsWithGrades.filter((s) => s.cgpa >= 2.0).length;
    const passRate =
      studentsWithGrades.length > 0
        ? Math.round((passCount / studentsWithGrades.length) * 100)
        : 0;
    const distinctionCount = studentsWithGrades.filter((s) => s.cgpa >= 3.5).length;

    // Grade distribution
    const gradeCounts: Record<string, number> = {};
    for (const student of studentsData) {
      for (const sem of student.semesters) {
        for (const course of sem.courses) {
          if (course.grade) {
            gradeCounts[course.grade] = (gradeCounts[course.grade] ?? 0) + 1;
          }
        }
      }
    }
    const gradeOrder = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'];
    const gradeDistribution = Object.entries(gradeCounts)
      .map(([grade, count]) => ({ grade, count }))
      .sort((a, b) => gradeOrder.indexOf(a.grade) - gradeOrder.indexOf(b.grade));

    // Semester trends
    const semTrendMap = new Map<
      string,
      { semesterName: string; totalGPA: number; studentCount: number; passCount: number }
    >();
    for (const student of studentsData) {
      for (const sem of student.semesters) {
        const key = sem.semesterName;
        if (!semTrendMap.has(key)) {
          semTrendMap.set(key, {
            semesterName: sem.semesterName,
            totalGPA: 0,
            studentCount: 0,
            passCount: 0,
          });
        }
        const trend = semTrendMap.get(key)!;
        trend.totalGPA += sem.gpa;
        trend.studentCount++;
        if (sem.gpa >= 2.0) trend.passCount++;
      }
    }

    const semesterTrends = Array.from(semTrendMap.values()).map((t) => ({
      semester: t.semesterName,
      avgGPA: t.studentCount > 0 ? Number((t.totalGPA / t.studentCount).toFixed(2)) : 0,
      studentCount: t.studentCount,
      passRate: t.studentCount > 0 ? Math.round((t.passCount / t.studentCount) * 100) : 0,
    }));

    // Filter options
    const sectionOptions = sections.map((s) => ({
      id: s.id,
      name: s.name,
      courseName: s.courseOffering.course.name,
      courseCode: s.courseOffering.course.code,
      semesterName: s.courseOffering.semester.name,
    }));

    const semesterOptions = [
      ...new Map(
        sections.map((s) => [
          s.courseOffering.semester.id,
          { id: s.courseOffering.semester.id, name: s.courseOffering.semester.name },
        ])
      ).values(),
    ];

    return NextResponse.json({
      success: true,
      data: {
        students: studentsData,
        stats: {
          totalStudents,
          avgCGPA: Number(avgCGPA.toFixed(2)),
          passRate,
          distinctionCount,
        },
        gradeDistribution,
        semesterTrends,
        filters: { sections: sectionOptions, semesters: semesterOptions },
      },
    });
  } catch (error) {
    console.error('Error fetching faculty academic records:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch academic records' },
      { status: 500 }
    );
  }
}
