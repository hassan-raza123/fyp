import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFacultyIdFromRequest } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params;
  try {
    const courseId = await Promise.resolve(parseInt(params.id));

    if (isNaN(courseId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid course ID' },
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

    // Get faculty's sections for this course
    const sections = await prisma.sections.findMany({
      where: {
        facultyId: facultyId,
        status: 'active',
        courseOffering: {
          courseId: courseId,
        },
      },
      include: {
        courseOffering: {
          include: {
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

    // Get all CLOs for this course
    const clos = await prisma.clos.findMany({
      where: {
        courseId: courseId,
        status: 'active',
      },
      orderBy: {
        code: 'asc',
      },
    });

    // Get CLO attainments for faculty's course offerings
    const cloAttainments = await prisma.closattainments.findMany({
      where: {
        cloId: {
          in: clos.map((c) => c.id),
        },
        courseOfferingId: {
          in: courseOfferingIds,
        },
        status: 'active',
      },
      include: {
        courseOffering: {
          include: {
            semester: {
              select: {
                name: true,
              },
            },
            sections: {
              select: {
                id: true,
                name: true,
                facultyId: true,
              },
            },
          },
        },
      },
      orderBy: {
        calculatedAt: 'desc',
      },
    });

    // Group attainments by CLO
    const cloAttainmentMap = new Map<
      number,
      Array<{
        courseOfferingId: number;
        semester: string;
        sectionId: number | null;
        sectionName: string | null;
        attainmentPercent: number;
        threshold: number;
        totalStudents: number;
        studentsAchieved: number;
        calculatedAt: Date;
        status: 'attained' | 'not_attained';
      }>
    >();

    clos.forEach((clo) => {
      cloAttainmentMap.set(clo.id, []);
    });

    cloAttainments.forEach((attainment) => {
      const existing = cloAttainmentMap.get(attainment.cloId);
      if (existing) {
        // Get section for this course offering (if faculty teaches it)
        const section = attainment.courseOffering.sections.find(
          (s) => s.facultyId === facultyId
        ) || attainment.courseOffering.sections[0];

        existing.push({
          courseOfferingId: attainment.courseOfferingId,
          semester: attainment.courseOffering.semester.name,
          sectionId: section?.id || null,
          sectionName: section?.name || null,
          attainmentPercent: attainment.attainmentPercent,
          threshold: attainment.threshold,
          totalStudents: attainment.totalStudents,
          studentsAchieved: attainment.studentsAchieved,
          calculatedAt: attainment.calculatedAt,
          status:
            attainment.attainmentPercent >= attainment.threshold
              ? 'attained'
              : 'not_attained',
        });
      }
    });

    // Format response
    const result = clos.map((clo) => {
      const attainments = cloAttainmentMap.get(clo.id) || [];
      const latestAttainment = attainments[0]; // Most recent
      const averageAttainment =
        attainments.length > 0
          ? attainments.reduce((sum, a) => sum + a.attainmentPercent, 0) /
            attainments.length
          : null;

      return {
        clo: {
          id: clo.id,
          code: clo.code,
          description: clo.description,
          bloomLevel: clo.bloomLevel,
        },
        latestAttainment: latestAttainment
          ? {
              attainmentPercent: latestAttainment.attainmentPercent,
              threshold: latestAttainment.threshold,
              status: latestAttainment.status,
              semester: latestAttainment.semester,
              sectionName: latestAttainment.sectionName,
            }
          : null,
        averageAttainment,
        sectionWiseBreakdown: attainments.map((a) => ({
          semester: a.semester,
          sectionName: a.sectionName,
          attainmentPercent: a.attainmentPercent,
          threshold: a.threshold,
          status: a.status,
          totalStudents: a.totalStudents,
          studentsAchieved: a.studentsAchieved,
          calculatedAt: a.calculatedAt.toISOString(),
        })),
      };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching CLO attainments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch CLO attainments' },
      { status: 500 }
    );
  }
}

