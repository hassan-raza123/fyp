import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFacultyIdFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const facultyId = await getFacultyIdFromRequest(request);
    if (!facultyId) {
      return NextResponse.json(
        { success: false, error: 'Faculty not found or unauthorized' },
        { status: 401 }
      );
    }

    // Get course offerings where faculty teaches
    const courseOfferings = await prisma.courseofferings.findMany({
      where: {
        sections: {
          some: {
            facultyId: facultyId,
            status: 'active',
          },
        },
        status: 'active',
      },
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
            startDate: true,
            endDate: true,
          },
        },
        sections: {
          where: {
            facultyId: facultyId,
            status: 'active',
          },
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: courseOfferings,
    });
  } catch (error) {
    console.error('Error fetching faculty course offerings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch course offerings' },
      { status: 500 }
    );
  }
}

