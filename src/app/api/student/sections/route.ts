import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStudentIdFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const studentId = await getStudentIdFromRequest(request);
    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Student not found or unauthorized' },
        { status: 401 }
      );
    }

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
                    labHours: true,
                    theoryHours: true,
                    creditHours: true,
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
        section: {
          courseOffering: {
            semester: {
              startDate: 'desc',
            },
          },
        },
      },
    });

    // Transform to section format
    const sections = studentSections.map((ss) => ({
      id: ss.section.id,
      name: ss.section.name,
      courseOfferingId: ss.section.courseOfferingId,
      courseOffering: {
        id: ss.section.courseOffering.id,
        course: ss.section.courseOffering.course,
        semester: ss.section.courseOffering.semester,
      },
    }));

    return NextResponse.json({
      success: true,
      data: sections,
    });
  } catch (error) {
    console.error('Error fetching student sections:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sections' },
      { status: 500 }
    );
  }
}

