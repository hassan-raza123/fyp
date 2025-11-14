import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFacultyIdFromRequest } from '@/lib/faculty-utils';

// PATCH - Update a grade (manual adjustment)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gradeId = parseInt(params.id);
    if (isNaN(gradeId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid grade ID' },
        { status: 400 }
      );
    }

    const facultyId = await getFacultyIdFromRequest(req);
    if (!facultyId) {
      return NextResponse.json(
        { success: false, error: 'Faculty not found or unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { percentage, grade, gpaPoints, reason } = body;

    // Get the grade and verify it belongs to faculty's course offering
    const existingGrade = await prisma.studentgrades.findUnique({
      where: { id: gradeId },
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

    if (!existingGrade) {
      return NextResponse.json(
        { success: false, error: 'Grade not found' },
        { status: 404 }
      );
    }

    if (existingGrade.courseOffering.sections.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update grade
    const updatedGrade = await prisma.studentgrades.update({
      where: { id: gradeId },
      data: {
        ...(percentage !== undefined && {
          percentage,
          obtainedMarks: (existingGrade.totalMarks * percentage) / 100,
        }),
        ...(grade && { grade }),
        ...(gpaPoints !== undefined && {
          gpaPoints,
          qualityPoints: gpaPoints * existingGrade.creditHours,
        }),
        calculatedAt: new Date(),
        calculatedBy: facultyId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Grade updated successfully',
      data: updatedGrade,
    });
  } catch (error) {
    console.error('Error updating grade:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update grade' },
      { status: 500 }
    );
  }
}

// POST - Submit grades for approval
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gradeId = parseInt(params.id);
    if (isNaN(gradeId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid grade ID' },
        { status: 400 }
      );
    }

    const facultyId = await getFacultyIdFromRequest(req);
    if (!facultyId) {
      return NextResponse.json(
        { success: false, error: 'Faculty not found or unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { action } = body; // 'submit' or 'lock'

    // Get the grade and verify authorization
    const grade = await prisma.studentgrades.findUnique({
      where: { id: gradeId },
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

    if (!grade || grade.courseOffering.sections.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Grade not found or unauthorized' },
        { status: 404 }
      );
    }

    // Update status
    let newStatus: 'active' | 'superseded' | 'final' = 'active';
    if (action === 'submit') {
      newStatus = 'final'; // Submitted grades are marked as final
    } else if (action === 'lock') {
      newStatus = 'final'; // Locked grades are also final
    }

    const updatedGrade = await prisma.studentgrades.update({
      where: { id: gradeId },
      data: {
        status: newStatus as any,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Grade ${action === 'submit' ? 'submitted' : 'locked'} successfully`,
      data: updatedGrade,
    });
  } catch (error) {
    console.error('Error submitting grade:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit grade' },
      { status: 500 }
    );
  }
}

