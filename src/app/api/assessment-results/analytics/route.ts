import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');
    const assessmentId = searchParams.get('assessmentId');

    if (!sectionId || !assessmentId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get all results for the section and assessment
    const results = await prisma.studentassessmentresults.findMany({
      where: {
        assessmentId: parseInt(assessmentId),
        student: {
          studentsections: {
            some: {
              sectionId: parseInt(sectionId),
            },
          },
        },
      },
      include: {
        student: true,
      },
    });

    if (results.length === 0) {
      return NextResponse.json({ error: 'No results found' }, { status: 404 });
    }

    // Calculate performance metrics
    const totalStudents = results.length;
    const totalMarks = results.reduce(
      (sum, result) => sum + result.obtainedMarks,
      0
    );
    const averageMarks = totalMarks / totalStudents;
    const highestMarks = Math.max(...results.map((r) => r.obtainedMarks));
    const lowestMarks = Math.min(...results.map((r) => r.obtainedMarks));
    const passCount = results.filter((r) => r.percentage >= 50).length;
    const passRate = (passCount / totalStudents) * 100;

    // Calculate grade distribution
    const gradeRanges = [
      { grade: 'A+', min: 95, max: 100 },
      { grade: 'A', min: 90, max: 94.99 },
      { grade: 'A-', min: 85, max: 89.99 },
      { grade: 'B+', min: 80, max: 84.99 },
      { grade: 'B', min: 75, max: 79.99 },
      { grade: 'B-', min: 70, max: 74.99 },
      { grade: 'C+', min: 65, max: 69.99 },
      { grade: 'C', min: 60, max: 64.99 },
      { grade: 'C-', min: 55, max: 59.99 },
      { grade: 'D+', min: 50, max: 54.99 },
      { grade: 'D', min: 45, max: 49.99 },
      { grade: 'F', min: 0, max: 44.99 },
    ];

    const gradeDistribution = gradeRanges.map((range) => {
      const count = results.filter(
        (r) => r.percentage >= range.min && r.percentage <= range.max
      ).length;
      return {
        grade: range.grade,
        count,
        percentage: (count / totalStudents) * 100,
      };
    });

    return NextResponse.json({
      metrics: {
        averageMarks,
        highestMarks,
        lowestMarks,
        passRate,
        totalStudents,
      },
      gradeDistribution,
    });
  } catch (error) {
    console.error('Error in analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
