import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStudentIdFromRequest, getStudentFromRequest } from '@/lib/auth';
import { plo_status } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const student = await getStudentFromRequest(request);
    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found or unauthorized' },
        { status: 401 }
      );
    }

    const studentId = student.id;
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId');
    const semesterId = searchParams.get('semesterId');

    // Use student's program if not specified
    const targetProgramId = programId
      ? parseInt(programId)
      : student.program?.id || null;

    if (!targetProgramId) {
      return NextResponse.json(
        { success: false, error: 'Program not found' },
        { status: 400 }
      );
    }

    // Verify student is in this program
    if (student.program?.id !== targetProgramId) {
      return NextResponse.json(
        { success: false, error: 'Not enrolled in this program' },
        { status: 403 }
      );
    }

    // Get all PLOs for the program
    const plos = await prisma.plos.findMany({
      where: {
        programId: targetProgramId,
        status: plo_status.active,
      },
      include: {
        cloMappings: {
          include: {
            clo: {
              select: {
                id: true,
                code: true,
                description: true,
                courseId: true,
              },
            },
          },
        },
      },
      orderBy: {
        code: 'asc',
      },
    });

    // Get student's enrolled sections
    const studentSections = await prisma.studentsections.findMany({
      where: {
        studentId: studentId,
        status: 'active',
        ...(semesterId && {
          section: {
            courseOffering: {
              semesterId: parseInt(semesterId),
            },
          },
        }),
      },
      include: {
        section: {
          include: {
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
        },
      },
    });

    const courseOfferingIds = studentSections.map(
      (ss) => ss.section.courseOfferingId
    );
    const sectionIds = studentSections.map((ss) => ss.sectionId);

    // Get student's CLO attainments
    const studentCLOAttainments = await prisma.closattainments.findMany({
      where: {
        courseOfferingId: {
          in: courseOfferingIds,
        },
        sectionId: {
          in: sectionIds,
        },
        status: 'active',
      },
      include: {
        clo: {
          select: {
            id: true,
            code: true,
            description: true,
          },
        },
      },
      orderBy: {
        calculatedAt: 'desc',
      },
    });

    // Get latest CLO attainment per CLO
    const latestCLOAttainments = new Map();
    studentCLOAttainments.forEach((attainment) => {
      const cloId = attainment.cloId;
      if (!latestCLOAttainments.has(cloId)) {
        latestCLOAttainments.set(cloId, attainment);
      }
    });

    // Get all assessments for student's courses
    const assessments = await prisma.assessments.findMany({
      where: {
        courseOfferingId: {
          in: courseOfferingIds,
        },
        status: {
          in: ['active', 'published'],
        },
      },
      include: {
        assessmentItems: {
          include: {
            clo: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    // Get student's assessment results
    const assessmentIds = assessments.map((a) => a.id);
    const studentResults = await prisma.studentassessmentresults.findMany({
      where: {
        studentId: studentId,
        assessmentId: {
          in: assessmentIds,
        },
        status: {
          in: ['evaluated', 'published'],
        },
      },
      include: {
        itemResults: {
          include: {
            assessmentItem: {
              include: {
                clo: {
                  select: {
                    id: true,
                    code: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Calculate student's personal CLO attainments
    const studentPersonalCLOAttainments = new Map<number, number>();

    // Group CLO items by CLO
    const cloItemsMap = new Map<number, Array<{ itemId: number; marks: number }>>();
    assessments.forEach((assessment) => {
      assessment.assessmentItems.forEach((item) => {
        if (item.clo) {
          const cloId = item.clo.id;
          if (!cloItemsMap.has(cloId)) {
            cloItemsMap.set(cloId, []);
          }
          cloItemsMap.get(cloId)!.push({
            itemId: item.id,
            marks: item.marks,
          });
        }
      });
    });

    // Calculate student's attainment for each CLO
    cloItemsMap.forEach((items, cloId) => {
      let totalPossibleMarks = 0;
      let studentObtainedMarks = 0;

      items.forEach((item) => {
        totalPossibleMarks += item.marks;

        // Find student's result for this item
        studentResults.forEach((result) => {
          const itemResult = result.itemResults.find(
            (ir) => ir.assessmentItem.id === item.itemId
          );
          if (itemResult) {
            studentObtainedMarks += itemResult.obtainedMarks;
          }
        });
      });

      if (totalPossibleMarks > 0) {
        const percentage = (studentObtainedMarks / totalPossibleMarks) * 100;
        studentPersonalCLOAttainments.set(cloId, percentage);
      }
    });

    // Calculate PLO attainments
    const ploAttainments = plos.map((plo) => {
      // Get CLOs that contribute to this PLO
      const contributingClos = plo.cloMappings.map((mapping) => {
        const cloId = mapping.clo.id;
        const studentAttainment = studentPersonalCLOAttainments.get(cloId) || 0;
        const classAttainment = latestCLOAttainments.get(cloId)?.attainmentPercent || 0;

        return {
          cloId: cloId,
          cloCode: mapping.clo.code,
          cloDescription: mapping.clo.description,
          weight: mapping.weight,
          studentAttainment: parseFloat(studentAttainment.toFixed(2)),
          classAttainment: parseFloat(classAttainment.toFixed(2)),
        };
      });

      // Calculate weighted average for student
      const totalWeight = contributingClos.reduce(
        (sum, clo) => sum + clo.weight,
        0
      );
      const studentWeightedSum = contributingClos.reduce(
        (sum, clo) => sum + clo.studentAttainment * clo.weight,
        0
      );
      const studentPLOAttainment =
        totalWeight > 0 ? studentWeightedSum / totalWeight : 0;

      // Calculate weighted average for class
      const classWeightedSum = contributingClos.reduce(
        (sum, clo) => sum + clo.classAttainment * clo.weight,
        0
      );
      const classPLOAttainment =
        totalWeight > 0 ? classWeightedSum / totalWeight : 0;

      // Get threshold (use default 60 or from CLO attainments)
      const threshold = 60; // Default threshold

      return {
        ploId: plo.id,
        ploCode: plo.code,
        description: plo.description,
        studentAttainment: {
          percentage: parseFloat(studentPLOAttainment.toFixed(2)),
          status: studentPLOAttainment >= threshold ? 'attained' : 'not_attained',
        },
        classAttainment: {
          percentage: parseFloat(classPLOAttainment.toFixed(2)),
          status: classPLOAttainment >= threshold ? 'attained' : 'not_attained',
        },
        threshold: threshold,
        contributingClos: contributingClos,
      };
    });

    // Calculate overall program progress
    const totalPLOs = ploAttainments.length;
    const attainedPLOs = ploAttainments.filter(
      (plo) => plo.studentAttainment.status === 'attained'
    ).length;
    const overallProgress = totalPLOs > 0 ? (attainedPLOs / totalPLOs) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        program: {
          id: student.program?.id || 0,
          code: student.program?.code || '',
          name: student.program?.name || '',
        },
        semester: semesterId
          ? studentSections[0]?.section.courseOffering.semester.name || null
          : null,
        overallProgress: {
          totalPLOs,
          attainedPLOs,
          remainingPLOs: totalPLOs - attainedPLOs,
          progressPercentage: parseFloat(overallProgress.toFixed(2)),
        },
        ploAttainments,
      },
    });
  } catch (error) {
    console.error('Error fetching student PLO attainments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch PLO attainments' },
      { status: 500 }
    );
  }
}

