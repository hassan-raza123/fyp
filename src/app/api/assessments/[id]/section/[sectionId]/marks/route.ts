import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFacultyIdFromRequest } from '@/lib/faculty-utils';

// GET - Fetch existing marks for students in a section for an assessment
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; sectionId: string } }
) {
  try {
    const assessmentId = parseInt(params.id);
    const sectionId = parseInt(params.sectionId);

    if (isNaN(assessmentId) || isNaN(sectionId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid assessment or section ID' },
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

    // Verify section belongs to faculty
    const section = await prisma.sections.findFirst({
      where: {
        id: sectionId,
        facultyId: facultyId,
        status: 'active',
      },
    });

    if (!section) {
      return NextResponse.json(
        { success: false, error: 'Section not found or unauthorized' },
        { status: 404 }
      );
    }

    // Get assessment
    const assessment = await prisma.assessments.findUnique({
      where: { id: assessmentId },
      include: {
        assessmentItems: {
          orderBy: {
            questionNo: 'asc',
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

    // Get students in section
    const studentSections = await prisma.studentsections.findMany({
      where: {
        sectionId: sectionId,
        status: 'active',
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                first_name: true,
                last_name: true,
              },
            },
          },
        },
      },
      orderBy: {
        student: {
          rollNumber: 'asc',
        },
      },
    });

    // Get existing results
    const existingResults = await prisma.studentassessmentresults.findMany({
      where: {
        assessmentId: assessmentId,
        studentId: {
          in: studentSections.map((ss) => ss.studentId),
        },
      },
      include: {
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
    });

    // Format response
    const studentsWithMarks = studentSections.map((ss) => {
      const existingResult = existingResults.find(
        (r) => r.studentId === ss.student.id
      );

      const marks: Record<number, number> = {};
      assessment.assessmentItems.forEach((item) => {
        const itemResult = existingResult?.itemResults.find(
          (ir) => ir.assessmentItemId === item.id
        );
        marks[item.id] = itemResult?.obtainedMarks ?? 0;
      });

      return {
        studentId: ss.student.id,
        rollNumber: ss.student.rollNumber,
        name: `${ss.student.user.first_name} ${ss.student.user.last_name}`,
        marks,
        existingResultId: existingResult?.id,
        status: existingResult?.status || 'pending',
        totalMarks: existingResult?.obtainedMarks || 0,
        percentage: existingResult?.percentage || 0,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        assessment: {
          id: assessment.id,
          title: assessment.title,
          type: assessment.type,
          totalMarks: assessment.totalMarks,
          items: assessment.assessmentItems.map((item) => ({
            id: item.id,
            questionNo: item.questionNo,
            description: item.description,
            marks: item.marks,
            cloId: item.cloId,
          })),
        },
        students: studentsWithMarks,
      },
    });
  } catch (error) {
    console.error('Error fetching marks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch marks' },
      { status: 500 }
    );
  }
}

// POST - Save marks (draft or final)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; sectionId: string } }
) {
  try {
    const assessmentId = parseInt(params.id);
    const sectionId = parseInt(params.sectionId);
    const body = await req.json();
    const { marks, status = 'pending', isDraft = false } = body;

    if (isNaN(assessmentId) || isNaN(sectionId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid assessment or section ID' },
        { status: 400 }
      );
    }

    if (!marks || !Array.isArray(marks)) {
      return NextResponse.json(
        { success: false, error: 'Marks array is required' },
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

    // Verify section and assessment belong to faculty
    const section = await prisma.sections.findFirst({
      where: {
        id: sectionId,
        facultyId: facultyId,
      },
    });

    if (!section) {
      return NextResponse.json(
        { success: false, error: 'Section not found or unauthorized' },
        { status: 404 }
      );
    }

    const assessment = await prisma.assessments.findUnique({
      where: { id: assessmentId },
      include: {
        assessmentItems: true,
      },
    });

    if (!assessment || assessment.conductedBy !== facultyId) {
      return NextResponse.json(
        { success: false, error: 'Assessment not found or unauthorized' },
        { status: 404 }
      );
    }

    // Validate marks
    const validationErrors: string[] = [];
    for (const studentMark of marks) {
      for (const item of studentMark.items || []) {
        const assessmentItem = assessment.assessmentItems.find(
          (ai) => ai.id === item.itemId
        );
        if (!assessmentItem) {
          validationErrors.push(
            `Invalid item ID ${item.itemId} for student ${studentMark.studentId}`
          );
          continue;
        }
        if (item.marks > assessmentItem.marks || item.marks < 0) {
          validationErrors.push(
            `Marks for item ${item.itemId} (${item.marks}) exceed maximum (${assessmentItem.marks}) for student ${studentMark.studentId}`
          );
        }
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationErrors,
        },
        { status: 400 }
      );
    }

    // Save marks
    const results = await prisma.$transaction(async (tx) => {
      const savedResults = [];

      for (const studentMark of marks) {
        const totalMarks = assessment.assessmentItems.reduce(
          (sum, item) => sum + item.marks,
          0
        );
        const obtainedMarks = (studentMark.items || []).reduce(
          (sum: number, item: { marks: number }) => sum + item.marks,
          0
        );
        const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

        // Check if result exists
        const existingResult = await tx.studentassessmentresults.findFirst({
          where: {
            studentId: studentMark.studentId,
            assessmentId: assessmentId,
          },
        });

        let result;
        if (existingResult) {
          // Update existing
          result = await tx.studentassessmentresults.update({
            where: { id: existingResult.id },
            data: {
              totalMarks,
              obtainedMarks,
              percentage,
              status: isDraft ? 'pending' : status,
            },
          });

          // Delete old item results
          await tx.studentassessmentitemresults.deleteMany({
            where: {
              studentAssessmentResultId: existingResult.id,
            },
          });
        } else {
          // Create new
          result = await tx.studentassessmentresults.create({
            data: {
              studentId: studentMark.studentId,
              assessmentId: assessmentId,
              totalMarks,
              obtainedMarks,
              percentage,
              status: isDraft ? 'pending' : status,
              remarks: '',
              submittedAt: new Date(),
            },
          });
        }

        // Create item results
        for (const item of studentMark.items || []) {
          const assessmentItem = assessment.assessmentItems.find(
            (ai) => ai.id === item.itemId
          );
          if (assessmentItem) {
            await tx.studentassessmentitemresults.create({
              data: {
                studentAssessmentResultId: result.id,
                assessmentItemId: item.itemId,
                obtainedMarks: item.marks,
                totalMarks: assessmentItem.marks,
                isCorrect: item.marks >= assessmentItem.marks * 0.5,
              },
            });
          }
        }

        savedResults.push(result);
      }

      return savedResults;
    });

    return NextResponse.json({
      success: true,
      message: isDraft
        ? `Draft saved for ${results.length} student(s)`
        : `Marks submitted for ${results.length} student(s)`,
      data: results,
    });
  } catch (error) {
    console.error('Error saving marks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save marks' },
      { status: 500 }
    );
  }
}

