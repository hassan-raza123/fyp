import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStudentIdFromRequest } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  try {
    const assessmentId = parseInt(params.id);
    if (isNaN(assessmentId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid assessment ID' },
        { status: 400 }
      );
    }

    const studentId = await getStudentIdFromRequest(req);
    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Student not found or unauthorized' },
        { status: 401 }
      );
    }

    // Verify student is enrolled
    const assessment = await prisma.assessments.findUnique({
      where: { id: assessmentId },
      include: {
        assessmentItems: {
          include: {
            clo: {
              select: {
                id: true,
                code: true,
                description: true,
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
          },
        },
      },
    });

    if (!assessment) {
      return NextResponse.json(
        { success: false, error: 'Assessment not found' },
        { status: 404 }
      );
    }

    const studentSection = await prisma.studentsections.findFirst({
      where: {
        studentId: studentId,
        status: 'active',
        section: {
          courseOfferingId: assessment.courseOfferingId,
        },
      },
    });

    if (!studentSection) {
      return NextResponse.json(
        { success: false, error: 'Not enrolled in this course' },
        { status: 403 }
      );
    }

    // Get student's result
    const result = await prisma.studentassessmentresults.findFirst({
      where: {
        studentId: studentId,
        assessmentId: assessmentId,
      },
      include: {
        itemResults: true,
      },
    });

    // Group items by CLO
    const cloMap = new Map();
    assessment.assessmentItems.forEach((item) => {
      if (item.clo) {
        const cloId = item.clo.id;
        if (!cloMap.has(cloId)) {
          cloMap.set(cloId, {
            clo: item.clo,
            items: [],
            totalMarks: 0,
            obtainedMarks: 0,
          });
        }
        const cloData = cloMap.get(cloId);
        const itemResult = result?.itemResults.find(
          (ir) => ir.assessmentItemId === item.id
        );
        cloData.items.push({
          id: item.id,
          questionNo: item.questionNo,
          description: item.description,
          marks: item.marks,
          obtainedMarks: itemResult?.obtainedMarks || 0,
        });
        cloData.totalMarks += item.marks;
        cloData.obtainedMarks += itemResult?.obtainedMarks || 0;
      }
    });

    // Calculate CLO performance
    const cloCoverage = Array.from(cloMap.values()).map((cloData) => {
      const percentage =
        cloData.totalMarks > 0
          ? (cloData.obtainedMarks / cloData.totalMarks) * 100
          : 0;
      return {
        clo: cloData.clo,
        totalMarks: cloData.totalMarks,
        obtainedMarks: cloData.obtainedMarks,
        percentage: parseFloat(percentage.toFixed(2)),
        items: cloData.items,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        assessment: {
          id: assessment.id,
          title: assessment.title,
          totalMarks: assessment.totalMarks,
        },
        cloCoverage,
      },
    });
  } catch (error) {
    console.error('Error fetching CLO coverage:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch CLO coverage' },
      { status: 500 }
    );
  }
}

