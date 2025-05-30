import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';

// GET /api/batches/[id]/sections - Get sections for a batch
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const { success, user, error } = requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
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
