import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFacultyIdFromRequest } from '@/lib/auth';

// GET - Get all courses with LLO attainments for faculty
export async function GET(req: NextRequest) {
  try {
    const facultyId = await getFacultyIdFromRequest(req);
    if (!facultyId) {
      return NextResponse.json(
        { success: false, error: 'Faculty not found or unauthorized' },
        { status: 401 }
      );
    }

    // Get faculty's sections
    const sections = await prisma.sections.findMany({
      where: {
        facultyId: facultyId,
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
                labHours: true,
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

    // Only include courses that have a lab component (labHours > 0)
    const courseMap = new Map<
      number,
      {
        course: any;
        courseOfferings: any[];
        sections: any[];
      }
    >();

    sections.forEach((section) => {
      const course = section.courseOffering.course;
      // Only include courses with lab hours
      if (course.labHours === 0) return;

      const courseId = course.id;
      if (!courseMap.has(courseId)) {
        courseMap.set(courseId, {
          course,
          courseOfferings: [],
          sections: [],
        });
      }
      const courseData = courseMap.get(courseId)!;
      if (!courseData.courseOfferings.find((co) => co.id === section.courseOfferingId)) {
        courseData.courseOfferings.push(section.courseOffering);
      }
      courseData.sections.push(section);
    });

    // Get LLOs and attainments for each course
    const coursesWithLLOs = await Promise.all(
      Array.from(courseMap.entries()).map(async ([courseId, courseData]) => {
        const llos = await prisma.llos.findMany({
          where: {
            courseId: courseId,
            status: 'active',
          },
          orderBy: { code: 'asc' },
        });

        const courseOfferingIds = courseData.courseOfferings.map((co) => co.id);

        const attainments = await prisma.llosattainments.findMany({
          where: {
            lloId: { in: llos.map((l) => l.id) },
            courseOfferingId: { in: courseOfferingIds },
            status: 'active',
          },
          orderBy: { calculatedAt: 'desc' },
        });

        const totalLLOs = llos.length;
        const attainedLLOs = attainments.filter(
          (a) => a.attainmentPercent >= a.threshold
        ).length;
        const averageAttainment =
          attainments.length > 0
            ? attainments.reduce((sum, a) => sum + a.attainmentPercent, 0) /
              attainments.length
            : 0;

        return {
          course: courseData.course,
          totalLLOs,
          attainedLLOs,
          averageAttainment,
          llos: llos.map((llo) => {
            const lloAttainments = attainments.filter((a) => a.lloId === llo.id);
            const latestAttainment = lloAttainments[0];
            return {
              id: llo.id,
              code: llo.code,
              description: llo.description,
              bloomLevel: llo.bloomLevel,
              attainmentPercent: latestAttainment?.attainmentPercent ?? null,
              threshold: latestAttainment?.threshold ?? 60,
              status:
                latestAttainment &&
                latestAttainment.attainmentPercent >= latestAttainment.threshold
                  ? 'attained'
                  : latestAttainment
                  ? 'not_attained'
                  : 'not_calculated',
              calculatedAt: latestAttainment?.calculatedAt ?? null,
            };
          }),
          courseOfferings: courseData.courseOfferings.map((co) => ({
            id: co.id,
            semester: co.semester,
            sections: courseData.sections
              .filter((s) => s.courseOfferingId === co.id)
              .map((s) => ({ id: s.id, name: s.name })),
          })),
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: coursesWithLLOs,
    });
  } catch (error) {
    console.error('Error fetching LLO attainments dashboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch LLO attainments' },
      { status: 500 }
    );
  }
}
