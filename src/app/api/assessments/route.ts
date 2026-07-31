import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import {
  authorize,
  canManageCourseOffering,
  assertResultsUnlocked,
  forbiddenResponse,
} from '@/lib/authz';
import { assessment_status, assessment_type } from '@prisma/client';
import { NextRequest } from 'next/server';

// Validation schema for assessment type
const validAssessmentTypes = [
  'quiz',
  'assignment',
  'sessional_exam',
  'mid_exam',
  'final_exam',
  'project',
  'presentation',
  'lab_report',
  'lab_exam',
  'viva',
  'class_participation',
  'case_study',
] as const;

export async function GET(request: NextRequest) {
  try {
    const { success, user, error } = await requireAuth(request);
    if (!success) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseOfferingId = searchParams.get('courseOfferingId');

    const where: any = {};
    if (courseOfferingId) {
      where.courseOfferingId = parseInt(courseOfferingId);
    }

    // If user is faculty, only show their assessments
    if (user?.role === 'faculty') {
      const { getFacultyIdFromRequest } = await import('@/lib/auth');
      const facultyId = await getFacultyIdFromRequest(request);
      if (facultyId) {
        where.conductedBy = facultyId;
      } else {
        // Faculty not found, return empty
        return NextResponse.json([]);
      }
    }

    const assessments = await prisma.assessments.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        assessmentItems: true,
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
      },
    });

    // When filtering by courseOffering, include weightage summary
    if (courseOfferingId) {
      const usedWeightage = assessments
        .filter((a) => a.status !== 'cancelled')
        .reduce((sum, a) => sum + a.weightage, 0);
      return NextResponse.json({
        assessments,
        usedWeightage: Math.round(usedWeightage * 100) / 100,
        remainingWeightage: Math.round((100 - usedWeightage) * 100) / 100,
      });
    }

    return NextResponse.json(assessments);
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authorize(request, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;
    const user = auth.user;

    const body = await request.json();
    let {
      title,
      description,
      type,
      totalMarks,
      dueDate,
      instructions,
      weightage,
      courseOfferingId,
    } = body;

    const offeringId = Number(courseOfferingId);
    if (!Number.isInteger(offeringId) || offeringId <= 0) {
      return NextResponse.json(
        { error: 'A valid courseOfferingId is required' },
        { status: 400 }
      );
    }

    // `courseOfferingId` arrives in the body. Without this it was never
    // compared against the offerings the caller actually teaches, so any
    // faculty member could plant a graded assessment in another department's
    // course.
    if (!(await canManageCourseOffering(request, user, offeringId))) {
      return forbiddenResponse();
    }

    // A locked offering is locked for a reason: results have been finalised.
    const lockError = await assertResultsUnlocked(user, offeringId);
    if (lockError) return lockError;

    // Normalize and map type
    let normalizedType = typeof type === 'string' ? type.toLowerCase() : type;
    if (normalizedType === 'exam') {
      normalizedType = 'mid_exam'; // Map 'exam' to 'mid_exam'
    }
    // Validate assessment type
    if (!validAssessmentTypes.includes(normalizedType)) {
      return NextResponse.json(
        {
          error: 'Invalid assessment type',
          validTypes: validAssessmentTypes,
        },
        { status: 400 }
      );
    }

    // Get faculty ID from the user data in headers
    const faculty = await prisma.faculties.findFirst({
      where: {
        userId: user?.userId,
      },
    });

    if (!faculty) {
      return NextResponse.json({ error: 'Faculty not found' }, { status: 404 });
    }

    // Validate total weightage ≤ 100 for this course offering
    const existingWeightage = await prisma.assessments.aggregate({
      where: {
        courseOfferingId: offeringId,
        status: { not: 'cancelled' },
      },
      _sum: { weightage: true },
    });
    const usedWeightage = existingWeightage._sum.weightage ?? 0;
    if (usedWeightage + Number(weightage) > 100) {
      return NextResponse.json(
        {
          error: `Total weightage would exceed 100%. Currently used: ${usedWeightage}%. Available: ${(100 - usedWeightage).toFixed(1)}%`,
          usedWeightage,
          remainingWeightage: 100 - usedWeightage,
        },
        { status: 400 }
      );
    }

    try {
      const assessment = await prisma.assessments.create({
        data: {
          title,
          description,
          type: normalizedType as assessment_type,
          totalMarks: Number(totalMarks),
          dueDate: new Date(dueDate),
          instructions,
          weightage: Number(weightage),
          courseOfferingId: offeringId,
          conductedBy: faculty.id,
          status: assessment_status.active,
        },
        include: {
          courseOffering: {
            include: {
              course: {
                select: {
                  code: true,
                },
              },
            },
          },
        },
      });

      // Send notification to faculty
      const { notifyAssessmentCreated } = await import('@/lib/notification-utils');
      await notifyAssessmentCreated(
        assessment.id,
        assessment.title,
        assessment.courseOffering.course.code,
        faculty.id
      );

      return NextResponse.json(assessment);
    } catch (err) {
      console.error('Error creating assessment (prisma):', err);
      return NextResponse.json(
        { error: 'Failed to create assessment' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/assessments:', error);
    return NextResponse.json(
      { error: 'Failed to create assessment' },
      { status: 500 }
    );
  }
}

// New endpoint to get valid assessment types
export async function GET_TYPES() {
  return NextResponse.json({ types: validAssessmentTypes });
}
