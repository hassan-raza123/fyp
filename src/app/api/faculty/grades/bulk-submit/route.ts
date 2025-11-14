import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFacultyIdFromRequest } from '@/lib/faculty-utils';

// POST - Bulk submit or lock grades
export async function POST(req: NextRequest) {
  try {
    const facultyId = await getFacultyIdFromRequest(req);
    if (!facultyId) {
      return NextResponse.json(
        { success: false, error: 'Faculty not found or unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { gradeIds, action } = body; // action: 'submit' or 'lock'

    if (!gradeIds || !Array.isArray(gradeIds) || gradeIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Grade IDs are required' },
        { status: 400 }
      );
    }

    // Verify all grades belong to faculty's course offerings
    const grades = await prisma.studentgrades.findMany({
      where: {
        id: {
          in: gradeIds.map((id: number) => parseInt(id.toString())),
        },
      },
      include: {
        courseOffering: {
          include: {
            sections: {
              where: {
                facultyId: facultyId,
              },
            },
          },
        },
      },
    });

    // Check authorization
    const unauthorizedGrades = grades.filter(
      (g) => g.courseOffering.sections.length === 0
    );
    if (unauthorizedGrades.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Some grades do not belong to you',
        },
        { status: 403 }
      );
    }

    // Determine status
    let newStatus: 'active' | 'superseded' | 'final' = 'active';
    if (action === 'submit') {
      newStatus = 'final'; // Submitted grades are marked as final
    } else if (action === 'lock') {
      newStatus = 'final'; // Locked grades are also final
    }

    // Update all grades
    const updatedGrades = await prisma.$transaction(
      grades.map((grade) =>
        prisma.studentgrades.update({
          where: { id: grade.id },
          data: {
            status: newStatus as any,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: `Successfully ${action}ed ${updatedGrades.length} grade(s)`,
      data: updatedGrades,
    });
  } catch (error) {
    console.error('Error in bulk grade submission:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}

