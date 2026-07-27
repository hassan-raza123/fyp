import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFacultyIdFromRequest, requireAuth } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit-log';

// PATCH - Update a grade (manual adjustment)
export async function PATCH(
  req: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params;
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

    // A manual grade override is exactly what the results lock exists to stop.
    if (existingGrade.courseOffering.isResultsLocked) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Results are locked for this course offering. Contact your department admin to unlock.',
        },
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

    // A manual grade override must leave a trace, including the stated reason —
    // previously `reason` was accepted from the client and silently discarded.
    const auth = await requireAuth(req);
    if (auth.success && auth.user) {
      await writeAuditLog(req, auth.user, 'grade.update', {
        gradeId,
        studentId: existingGrade.studentId,
        courseOfferingId: existingGrade.courseOfferingId,
        facultyId,
        reason: reason ?? null,
        before: {
          percentage: existingGrade.percentage,
          grade: existingGrade.grade,
          gpaPoints: existingGrade.gpaPoints,
          obtainedMarks: existingGrade.obtainedMarks,
        },
        after: {
          percentage: updatedGrade.percentage,
          grade: updatedGrade.grade,
          gpaPoints: updatedGrade.gpaPoints,
          obtainedMarks: updatedGrade.obtainedMarks,
        },
      });
    }

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
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params;
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

    const auth = await requireAuth(req);
    if (auth.success && auth.user) {
      await writeAuditLog(
        req,
        auth.user,
        action === 'lock' ? 'grade.lock' : 'grade.submit',
        {
          gradeId,
          studentId: grade.studentId,
          courseOfferingId: grade.courseOfferingId,
          facultyId,
          previousStatus: grade.status,
          newStatus,
        }
      );
    }

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

