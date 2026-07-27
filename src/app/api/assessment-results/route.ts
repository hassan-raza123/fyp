import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  authorize,
  canAccessSection,
  canAccessStudent,
  forbidden,
} from '@/lib/authz';
import { writeAuditLog } from '@/lib/audit-log';

export async function GET(request: NextRequest) {
  try {
    // Staff only: this reads other students' marks. Students have dedicated
    // endpoints under /api/student/* that are scoped to themselves.
    const auth = await authorize(request, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const sectionId = searchParams.get('sectionId');
    const assessmentId = searchParams.get('assessmentId');

    // A caller must be scoped to something they own, otherwise this would
    // return every result in the system.
    if (!studentId && !sectionId && !assessmentId) {
      return NextResponse.json(
        { success: false, error: 'A studentId, sectionId or assessmentId filter is required' },
        { status: 400 }
      );
    }

    if (sectionId && !(await canAccessSection(request, auth.user, parseInt(sectionId)))) {
      return forbidden('You do not have access to this section').response;
    }

    if (studentId && !(await canAccessStudent(request, auth.user, parseInt(studentId)))) {
      return forbidden('You do not have access to this student').response;
    }

    const where: any = {};
    if (studentId) {
      where.studentId = parseInt(studentId);
    }
    if (assessmentId) {
      where.assessmentId = parseInt(assessmentId);
    }
    if (sectionId) {
      // Filter by section through student sections
      where.student = {
        studentsections: {
          some: {
            sectionId: parseInt(sectionId),
          },
        },
      };
    }

    const results = await prisma.studentassessmentresults.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            rollNumber: true,
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        },
        assessment: {
          select: {
            id: true,
            title: true,
            type: true,
            totalMarks: true,
          },
        },
        itemResults: {
          include: {
            assessmentItem: {
              select: {
                id: true,
                questionNo: true,
                marks: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('Error fetching assessment results:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assessment results' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Staff only — entering marks is never a student action.
    const auth = await authorize(request, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const { sectionId, marks } = body;

    if (!sectionId || !marks || !Array.isArray(marks)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    if (!(await canAccessSection(request, auth.user, Number(sectionId)))) {
      return forbidden('You do not have access to this section').response;
    }

    if (marks.length === 0) {
      return NextResponse.json(
        { error: 'No marks provided' },
        { status: 400 }
      );
    }

    // Validate no negative marks
    for (const studentMark of marks) {
      if (studentMark.items.some((item: any) => item.marks < 0)) {
        return NextResponse.json(
          { error: 'Marks cannot be negative' },
          { status: 400 }
        );
      }
    }

    // Check if results are locked for this course offering
    const assessment = await prisma.assessments.findUnique({
      where: { id: marks[0]?.assessmentId },
      select: { courseOffering: { select: { isResultsLocked: true } } },
    });
    if (assessment?.courseOffering?.isResultsLocked) {
      return NextResponse.json(
        { error: 'Results are locked for this course offering' },
        { status: 403 }
      );
    }

    // Start a transaction to ensure all operations succeed or fail together
    const results = await prisma.$transaction(async (tx) => {
      const createdResults = [];

      for (const studentMark of marks) {
        // Calculate total marks and percentage
        const totalMarks = studentMark.items.reduce(
          (sum: number, item: any) => sum + item.totalMarks,
          0
        );
        const obtainedMarks = studentMark.items.reduce(
          (sum: number, item: any) => sum + item.marks,
          0
        );
        const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

        // Check if result already exists
        const existingResult = await tx.studentassessmentresults.findFirst({
          where: {
            studentId: studentMark.studentId,
            assessmentId: studentMark.assessmentId,
          },
        });

        let result;
        if (existingResult) {
          // Update existing result
          result = await tx.studentassessmentresults.update({
            where: { id: existingResult.id },
            data: {
              totalMarks,
              obtainedMarks,
              percentage,
              status: 'pending',
            },
          });

          // Delete old item results
          await tx.studentassessmentitemresults.deleteMany({
            where: {
              studentAssessmentResultId: existingResult.id,
            },
          });
        } else {
          // Create new result
          result = await tx.studentassessmentresults.create({
            data: {
              studentId: studentMark.studentId,
              assessmentId: studentMark.assessmentId,
              totalMarks,
              obtainedMarks,
              percentage,
              status: 'pending',
              remarks: '',
            },
          });
        }

        // Create individual item results
        for (const item of studentMark.items) {
          await tx.studentassessmentitemresults.create({
            data: {
              studentAssessmentResultId: result.id,
              assessmentItemId: item.itemId,
              obtainedMarks: item.marks,
              totalMarks: item.totalMarks,
            },
          });
        }

        createdResults.push(result);
      }

      return createdResults;
    });

    await writeAuditLog(request, auth.user, 'marks.bulk_entry', {
      sectionId: Number(sectionId),
      studentCount: results.length,
      entries: results.map((r) => ({
        studentId: r.studentId,
        assessmentId: r.assessmentId,
        obtainedMarks: r.obtainedMarks,
        totalMarks: r.totalMarks,
      })),
    });

    return NextResponse.json({
      success: true,
      message: 'Assessment results saved successfully',
      data: results,
    });
  } catch (error) {
    console.error('Error saving assessment results:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save assessment results' },
      { status: 500 }
    );
  }
}
