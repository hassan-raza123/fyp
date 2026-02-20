import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { getCurrentDepartmentId } from '@/lib/auth';

/**
 * GET /api/course-offerings
 * Returns active course offerings for the current admin's department.
 * Used by LLO Attainments page and other admin results pages.
 */
export async function GET(request: NextRequest) {
  try {
    const { success, error } = await requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const departmentId = await getCurrentDepartmentId(request);
    if (!departmentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Department not assigned. Please contact super admin.',
        },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';

    const where: { course: { departmentId: number }; status?: string } = {
      course: {
        departmentId,
      },
    };
    if (status) {
      where.status = status;
    }

    const courseOfferings = await prisma.courseofferings.findMany({
      where,
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
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: courseOfferings,
    });
  } catch (error) {
    console.error('Error fetching course offerings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch course offerings',
      },
      { status: 500 }
    );
  }
}
