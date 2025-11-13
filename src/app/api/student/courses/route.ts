import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStudentIdFromRequest } from '@/lib/student-utils';

export async function GET(request: NextRequest) {
  try {
    const studentId = await getStudentIdFromRequest(request);
    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Student not found or unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

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
                  include: {
                    department: true,
                    prerequisites: {
                      include: {
                        prerequisite: {
                          select: {
                            id: true,
                            code: true,
                            name: true,
                          },
                        },
                      },
                    },
                    corequisites: {
                      include: {
                        corequisite: {
                          select: {
                            id: true,
                            code: true,
                            name: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Get unique courses from enrolled sections
    const courseMap = new Map();
    studentSections.forEach((ss) => {
      const course = ss.section.courseOffering.course;
      if (!courseMap.has(course.id)) {
        courseMap.set(course.id, {
          ...course,
          sections: [],
        });
      }
      courseMap.get(course.id).sections.push(ss.section);
    });

    let courses = Array.from(courseMap.values());

    // Apply filters
    if (search) {
      courses = courses.filter(
        (c) =>
          c.code.toLowerCase().includes(search.toLowerCase()) ||
          c.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (type && type !== 'all') {
      courses = courses.filter((c) => c.type === type);
    }
    if (status && status !== 'all') {
      courses = courses.filter((c) => c.status.toLowerCase() === status.toLowerCase());
    }

    // Pagination
    const total = courses.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedCourses = courses.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      success: true,
      data: paginatedCourses,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching student courses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

