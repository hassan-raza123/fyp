import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { success, user, error } = await requireAuth(request);
    if (!success || !user) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const userId = user.userId;
    if (!userId || isNaN(Number(userId))) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
    }

    // Get admin's department
    const faculty = await prisma.faculties.findFirst({
      where: { userId },
      select: { departmentId: true },
    });

    if (!faculty?.departmentId) {
      return NextResponse.json(
        { error: 'No department assigned.' },
        { status: 400 }
      );
    }

    const departmentId = faculty.departmentId;

    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId');
    const batchId = searchParams.get('batchId');
    const semesterId = searchParams.get('semesterId');

    // Build student filter
    const studentWhere: any = { departmentId };
    if (programId) studentWhere.programId = parseInt(programId);
    if (batchId) studentWhere.batchId = batchId;

    // Fetch all students in department
    const students = await prisma.students.findMany({
      where: studentWhere,
      include: {
        user: {
          select: { first_name: true, last_name: true, email: true },
        },
        program: { select: { id: true, code: true, name: true } },
        batch: { select: { id: true, name: true } },
        studentGrades: {
          where: {
            status: 'active',
            ...(semesterId
              ? { courseOffering: { semesterId: parseInt(semesterId) } }
              : {}),
          },
          include: {
            courseOffering: {
              include: {
                course: {
                  select: { id: true, code: true, name: true, creditHours: true },
                },
                semester: { select: { id: true, name: true, startDate: true } },
              },
            },
          },
          orderBy: {
            courseOffering: { semester: { startDate: 'asc' } },
          },
        },
        cumulativeGPA: {
          select: { cumulativeGPA: true, totalCreditHours: true, completedSemesters: true },
        },
      },
      orderBy: [{ programId: 'asc' }, { batchId: 'asc' }],
    });

    // Transform students data
    const studentsData = students.map((student) => {
      // Group grades by semester
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

      for (const grade of student.studentGrades) {
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

      const cgpa = student.cumulativeGPA?.cumulativeGPA ?? 0;

      return {
        id: student.id,
        rollNumber: student.rollNumber ?? '',
        name: `${student.user?.first_name ?? ''} ${student.user?.last_name ?? ''}`.trim(),
        email: student.user?.email ?? '',
        program: student.program
          ? { id: student.program.id, code: student.program.code, name: student.program.name }
          : null,
        batch: student.batch ? { id: student.batch.id, name: student.batch.name } : null,
        cgpa: Number(cgpa),
        completedSemesters: student.cumulativeGPA?.completedSemesters ?? semesters.length,
        totalCreditHours: student.cumulativeGPA?.totalCreditHours ?? 0,
        semesters,
      };
    });

    // Calculate department-wide stats
    const studentsWithGrades = studentsData.filter((s) => s.semesters.length > 0);
    const totalStudents = studentsData.length;
    const avgCGPA =
      studentsWithGrades.length > 0
        ? studentsWithGrades.reduce((sum, s) => sum + s.cgpa, 0) / studentsWithGrades.length
        : 0;

    // Pass rate: students with CGPA >= 2.0
    const passCount = studentsWithGrades.filter((s) => s.cgpa >= 2.0).length;
    const passRate =
      studentsWithGrades.length > 0
        ? Math.round((passCount / studentsWithGrades.length) * 100)
        : 0;

    // Distinction: CGPA >= 3.5
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
    const gradeDistribution = Object.entries(gradeCounts)
      .map(([grade, count]) => ({ grade, count }))
      .sort((a, b) => {
        const order = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'];
        return order.indexOf(a.grade) - order.indexOf(b.grade);
      });

    // Semester-wise GPA trend (all students combined, grouped by semester)
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

    // Fetch filter options scoped to department
    const [programs, batches, semesters] = await Promise.all([
      prisma.programs.findMany({
        where: { departmentId },
        select: { id: true, code: true, name: true },
        orderBy: { name: 'asc' },
      }),
      prisma.batches.findMany({
        where: { program: { departmentId } },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      prisma.semesters.findMany({
        select: { id: true, name: true },
        orderBy: { startDate: 'desc' },
      }),
    ]);

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
        filters: { programs, batches, semesters },
      },
    });
  } catch (error) {
    console.error('Error fetching academic records:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch academic records' },
      { status: 500 }
    );
  }
}
