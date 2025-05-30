import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';
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
  'lab_performance',
  'lab_exam',
  'viva',
] as const;

export async function GET(request: NextRequest) {
  try {
    const { success, user, error } = requireAuth(request);
    if (!success) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const assessments = await prisma.assessments.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        assessmentItems: true,
      },
    });

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
    const { success, user, error } = requireAuth(request);
    if (!success) {
      console.log('Auth failed:', error);
      return NextResponse.json({ error }, { status: 401 });
    }

    const body = await request.json();
    console.log('Received request body:', body);
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

    // Normalize and map type
    let normalizedType = typeof type === 'string' ? type.toLowerCase() : type;
    if (normalizedType === 'exam') {
      normalizedType = 'mid_exam'; // Map 'exam' to 'mid_exam'
    }
    console.log('Mapped/Normalized assessment type:', normalizedType);

    // Validate assessment type
    if (!validAssessmentTypes.includes(normalizedType)) {
      console.log('Invalid assessment type received:', normalizedType);
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
      console.log('Faculty not found for userId:', user?.userId);
      return NextResponse.json({ error: 'Faculty not found' }, { status: 404 });
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
          courseOfferingId: Number(courseOfferingId),
          conductedBy: faculty.id,
          status: assessment_status.active,
        },
      });
      return NextResponse.json(assessment);
    } catch (err) {
      console.error('Error creating assessment (prisma):', err);
      return NextResponse.json(
        { error: 'Failed to create assessment', details: String(err) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/assessments:', error);
    return NextResponse.json(
      { error: 'Failed to create assessment', details: String(error) },
      { status: 500 }
    );
  }
}

// New endpoint to get valid assessment types
export async function GET_TYPES() {
  return NextResponse.json({ types: validAssessmentTypes });
}
