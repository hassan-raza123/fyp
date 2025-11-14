import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';
import { getCurrentDepartmentId } from '@/lib/department-utils';

// GET /api/admin/llo-attainments
export async function GET(request: NextRequest) {
  try {
    const { success } = requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const courseOfferingId = searchParams.get('courseOfferingId');
    const lloId = searchParams.get('lloId');

    // Get current department ID
    const departmentId = await getCurrentDepartmentId();
    if (!departmentId) {
      return NextResponse.json(
        { success: false, error: 'Department not configured' },
        { status: 400 }
      );
    }

    const where: any = {
      llo: {
        course: {
          departmentId: departmentId,
        },
      },
    };

    if (courseOfferingId) {
      where.courseOfferingId = parseInt(courseOfferingId);
    }

    if (lloId) {
      where.lloId = parseInt(lloId);
    }

    const attainments = await prisma.llosattainments.findMany({
      where,
      include: {
        llo: {
          include: {
            course: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
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
      orderBy: {
        calculatedAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, data: attainments });
  } catch (error) {
    console.error('Error fetching LLO attainments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch LLO attainments' },
      { status: 500 }
    );
  }
}

