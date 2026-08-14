import { NextRequest, NextResponse } from 'next/server';
import { resolveDepartmentScope } from '@/lib/authz';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { getCurrentDepartmentId } from '@/lib/auth';
import { authorize } from '@/lib/authz';

// GET /api/admin/llo-attainments
export async function GET(request: NextRequest) {
  try {
    const auth = await authorize(request, ['super_admin', 'admin']);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const courseOfferingId = searchParams.get('courseOfferingId');
    const lloId = searchParams.get('lloId');

    // A super_admin belongs to no department by design; demanding one here
    // locked the highest-privilege role out of the screen entirely.
    const scope = await resolveDepartmentScope(request, auth.user);
    if (scope.error) return scope.error;
    const departmentId = scope.departmentId;

    const where: any = {
      llo: {
        course: {
          ...(departmentId === null ? {} : { departmentId }),
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

