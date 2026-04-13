import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFacultyIdFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const facultyId = await getFacultyIdFromRequest(req);
    if (!facultyId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const sectionId = searchParams.get('sectionId');

    // Get faculty's sections (optionally filtered)
    const sections = await prisma.sections.findMany({
      where: {
        facultyId,
        status: 'active',
        ...(sectionId && { id: parseInt(sectionId) }),
      },
      include: {
        courseOffering: {
          include: {
            course: { select: { id: true, code: true, name: true, creditHours: true } },
            semester: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (sections.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // If a specific section is requested, return full result sheet data
    if (sectionId) {
      const section = sections[0];
      if (!section) {
        return NextResponse.json(
          { success: false, error: 'Section not found' },
          { status: 404 }
        );
      }

      const courseOfferingId = section.courseOfferingId;

      // Get students enrolled in this section
      const studentSections = await prisma.studentsections.findMany({
        where: { sectionId: section.id, status: 'active' },
        include: {
          student: {
            include: {
              user: { select: { first_name: true, last_name: true } },
            },
          },
        },
        orderBy: { student: { rollNumber: 'asc' } },
      });

      // Get all assessments for this course offering
      const assessments = await prisma.assessments.findMany({
        where: { courseOfferingId, status: 'active' },
        orderBy: [{ type: 'asc' }, { createdAt: 'asc' }],
        select: {
          id: true,
          title: true,
          type: true,
          totalMarks: true,
          weightage: true,
          dueDate: true,
        },
      });

      const studentIds = studentSections.map((ss) => ss.studentId);

      // Get all assessment results for these students
      const assessmentResults = await prisma.studentassessmentresults.findMany({
        where: {
          studentId: { in: studentIds },
          assessmentId: { in: assessments.map((a) => a.id) },
        },
        select: {
          studentId: true,
          assessmentId: true,
          obtainedMarks: true,
          totalMarks: true,
          percentage: true,
          status: true,
        },
      });

      // Get final grades for this course offering
      const finalGrades = await prisma.studentgrades.findMany({
        where: {
          studentId: { in: studentIds },
          courseOfferingId,
          component: 'combined',
          status: 'active',
        },
        select: {
          studentId: true,
          obtainedMarks: true,
          totalMarks: true,
          percentage: true,
          grade: true,
          gpaPoints: true,
        },
      });

      // Build lookup maps
      const resultMap = new Map<string, (typeof assessmentResults)[0]>();
      assessmentResults.forEach((r) => {
        resultMap.set(`${r.studentId}-${r.assessmentId}`, r);
      });

      const gradeMap = new Map<number, (typeof finalGrades)[0]>();
      finalGrades.forEach((g) => gradeMap.set(g.studentId, g));

      // Build result sheet rows
      const rows = studentSections.map((ss) => {
        const student = ss.student;
        const assessmentMarks: Record<
          number,
          { obtained: number | null; total: number; percentage: number | null; status: string }
        > = {};

        assessments.forEach((a) => {
          const result = resultMap.get(`${student.id}-${a.id}`);
          assessmentMarks[a.id] = {
            obtained: result ? result.obtainedMarks : null,
            total: a.totalMarks,
            percentage: result ? result.percentage : null,
            status: result ? result.status : 'not_submitted',
          };
        });

        const grade = gradeMap.get(student.id);

        return {
          studentId: student.id,
          rollNumber: student.rollNumber,
          name: `${student.user.first_name} ${student.user.last_name}`,
          assessmentMarks,
          finalGrade: grade
            ? {
                obtained: grade.obtainedMarks,
                total: grade.totalMarks,
                percentage: grade.percentage,
                grade: grade.grade,
                gpaPoints: grade.gpaPoints,
              }
            : null,
        };
      });

      return NextResponse.json({
        success: true,
        data: {
          section: {
            id: section.id,
            name: section.name,
            course: section.courseOffering.course,
            semester: section.courseOffering.semester,
          },
          assessments,
          rows,
          stats: {
            totalStudents: rows.length,
            gradedStudents: finalGrades.length,
            averagePercentage:
              finalGrades.length > 0
                ? finalGrades.reduce((s, g) => s + g.percentage, 0) / finalGrades.length
                : null,
          },
        },
      });
    }

    // No specific section — return list of sections
    const sectionList = sections.map((s) => ({
      id: s.id,
      name: s.name,
      course: s.courseOffering.course,
      semester: s.courseOffering.semester,
    }));

    return NextResponse.json({ success: true, data: sectionList });
  } catch (error) {
    console.error('Error fetching result sheet:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch result sheet' },
      { status: 500 }
    );
  }
}
