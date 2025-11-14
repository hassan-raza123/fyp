import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFacultyIdFromRequest } from '@/lib/faculty-utils';

// GET - Get all courses with CLO attainments for faculty
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

    // Get unique courses
    const courseMap = new Map<
      number,
      {
        course: any;
        courseOfferings: any[];
        sections: any[];
      }
    >();

    sections.forEach((section) => {
      const courseId = section.courseOffering.course.id;
      if (!courseMap.has(courseId)) {
        courseMap.set(courseId, {
          course: section.courseOffering.course,
          courseOfferings: [],
          sections: [],
        });
      }
      const courseData = courseMap.get(courseId)!;
      if (
        !courseData.courseOfferings.find(
          (co) => co.id === section.courseOfferingId
        )
      ) {
        courseData.courseOfferings.push(section.courseOffering);
      }
      courseData.sections.push(section);
    });

    // Get CLOs and attainments for each course
    const coursesWithCLOs = await Promise.all(
      Array.from(courseMap.entries()).map(async ([courseId, courseData]) => {
        // Get CLOs for this course
        const clos = await prisma.clos.findMany({
          where: {
            courseId: courseId,
            status: 'active',
          },
          orderBy: {
            code: 'asc',
          },
        });

        const courseOfferingIds = courseData.courseOfferings.map((co) => co.id);

        // Get CLO attainments
        const attainments = await prisma.closattainments.findMany({
          where: {
            cloId: {
              in: clos.map((c) => c.id),
            },
            courseOfferingId: {
              in: courseOfferingIds,
            },
            status: 'active',
          },
          orderBy: {
            calculatedAt: 'desc',
          },
        });

        // Calculate overall statistics
        const totalCLOs = clos.length;
        const attainedCLOs = attainments.filter(
          (a) => a.attainmentPercent >= a.threshold
        ).length;
        const averageAttainment =
          attainments.length > 0
            ? attainments.reduce((sum, a) => sum + a.attainmentPercent, 0) /
              attainments.length
            : 0;

        return {
          course: courseData.course,
          totalCLOs,
          attainedCLOs,
          averageAttainment,
          clos: clos.map((clo) => {
            const cloAttainments = attainments.filter(
              (a) => a.cloId === clo.id
            );
            const latestAttainment = cloAttainments[0];
            return {
              id: clo.id,
              code: clo.code,
              description: clo.description,
              bloomLevel: clo.bloomLevel,
              attainmentPercent: latestAttainment?.attainmentPercent || null,
              threshold: latestAttainment?.threshold || 60,
              status:
                latestAttainment &&
                latestAttainment.attainmentPercent >= latestAttainment.threshold
                  ? 'attained'
                  : latestAttainment
                  ? 'not_attained'
                  : 'not_calculated',
              calculatedAt: latestAttainment?.calculatedAt || null,
            };
          }),
          courseOfferings: courseData.courseOfferings.map((co) => ({
            id: co.id,
            semester: co.semester,
            sections: courseData.sections
              .filter((s) => s.courseOfferingId === co.id)
              .map((s) => ({
                id: s.id,
                name: s.name,
              })),
          })),
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: coursesWithCLOs,
    });
  } catch (error) {
    console.error('Error fetching CLO attainments dashboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch CLO attainments' },
      { status: 500 }
    );
  }
}

