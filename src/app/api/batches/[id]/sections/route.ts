import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { authorize, canAccessBatch, forbiddenResponse } from '@/lib/authz';

// GET /api/batches/[id]/sections - Get sections for a batch
export async function GET(
  request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params;
  try {
    // The timetable of a batch names the faculty teaching each section — a
    // staff view of a cohort the caller may have nothing to do with.
    const auth = await authorize(request, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;

    if (!(await canAccessBatch(request, auth.user, params.id))) {
      return forbiddenResponse();
    }

    const sections = await prisma.sections.findMany({
      where: {
        batchId: params.id,
        status: 'active',
      },
      include: {
        courseOffering: {
          include: {
            course: {
              select: {
                code: true,
                name: true,
              },
            },
            semester: {
              select: {
                name: true,
              },
            },
          },
        },
        faculty: {
          include: {
            user: {
              select: {
                first_name: true,
                last_name: true,
              },
            },
          },
        },
        _count: {
          select: {
            studentsections: true,
          },
        },
      },
    });

    // Transform the data to include currentStudents count
    const transformedSections = sections.map((section) => ({
      ...section,
      currentStudents: section._count.studentsections,
    }));

    return NextResponse.json({
      success: true,
      data: transformedSections,
    });
  } catch (error) {
    console.error('Error fetching batch sections:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch batch sections' },
      { status: 500 }
    );
  }
}
