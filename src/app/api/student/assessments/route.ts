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
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const courseOfferingId = searchParams.get('courseOfferingId');

    // Get student's enrolled sections
    const studentSections = await prisma.studentsections.findMany({
      where: {
        studentId: studentId,
        status: 'active',
      },
      select: {
        section: {
          select: {
            courseOfferingId: true,
          },
        },
      },
    });

    const courseOfferingIds = studentSections.map(
      (ss) => ss.section.courseOfferingId
    );

    if (courseOfferingIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit,
          total: 0,
          totalPages: 0,
        },
      });
    }

    // Build where clause
    const where: any = {
      courseOfferingId: {
        in: courseOfferingIds,
      },
    };

    if (courseOfferingId) {
      where.courseOfferingId = parseInt(courseOfferingId);
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (type && type !== 'all') {
      where.type = type;
    }

    // Get assessments
    const [assessments, total] = await Promise.all([
      prisma.assessments.findMany({
        where,
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
              sections: {
                where: {
                  studentsections: {
                    some: {
                      studentId: studentId,
                      status: 'active',
                    },
                  },
                },
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              assessmentItems: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          dueDate: 'asc',
        },
      }),
      prisma.assessments.count({ where }),
    ]);

    // Get student's results for these assessments
    const assessmentIds = assessments.map((a) => a.id);
    const results = await prisma.studentassessmentresults.findMany({
      where: {
        studentId: studentId,
        assessmentId: {
          in: assessmentIds,
        },
      },
      select: {
        assessmentId: true,
        status: true,
        percentage: true,
        obtainedMarks: true,
        totalMarks: true,
      },
    });

    // Map results to assessments
    const resultsMap = new Map();
    results.forEach((r) => {
      resultsMap.set(r.assessmentId, r);
    });

    const assessmentsWithResults = assessments.map((assessment) => {
      const result = resultsMap.get(assessment.id);
      return {
        ...assessment,
        studentResult: result || null,
      };
    });

    return NextResponse.json({
      success: true,
      data: assessmentsWithResults,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching student assessments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assessments' },
      { status: 500 }
    );
  }
}

