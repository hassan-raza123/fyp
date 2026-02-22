import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/surveys
 * - Admin: returns all surveys for their department
 * - Student: returns active surveys for their enrolled course offerings
 * - Faculty: returns surveys for their course offerings
 */
export async function GET(request: NextRequest) {
  try {
    const { success, user, error } = await requireAuth(request);
    if (!success) {
      return NextResponse.json({ success: false, error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseOfferingId = searchParams.get('courseOfferingId');
    const programId = searchParams.get('programId');

    const where: any = {};
    if (courseOfferingId) {
      where.courseOfferingId = parseInt(courseOfferingId);
    }
    if (programId) {
      where.programId = parseInt(programId);
    }

    // Students only see active surveys for courses they are enrolled in
    if (user?.role === 'student') {
      const student = await prisma.students.findFirst({
        where: { userId: user.userId },
        select: { id: true, programId: true },
      });
      if (!student) {
        return NextResponse.json({ success: true, data: [] });
      }
      const enrolledSectionIds = await prisma.studentsections.findMany({
        where: { studentId: student.id, status: 'active' },
        select: { section: { select: { courseOfferingId: true } } },
      });
      const offeringIds = [
        ...new Set(enrolledSectionIds.map((e) => e.section.courseOfferingId)),
      ];
      where.status = 'active';
      where.OR = [
        { courseOfferingId: { in: offeringIds } },
        { programId: student.programId },
      ];
    }

    const surveys = await prisma.surveys.findMany({
      where,
      include: {
        courseOffering: {
          include: {
            course: { select: { code: true, name: true } },
            semester: { select: { name: true } },
          },
        },
        program: { select: { id: true, name: true, code: true } },
        creator: { select: { first_name: true, last_name: true } },
        _count: { select: { questions: true, responses: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: surveys });
  } catch (error) {
    console.error('[GET_SURVEYS]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch surveys.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/surveys
 * Admin/Faculty creates a new survey for a course offering.
 */
export async function POST(request: NextRequest) {
  try {
    const { success, user, error } = await requireAuth(request);
    if (!success) {
      return NextResponse.json({ success: false, error }, { status: 401 });
    }

    if (user?.role === 'student') {
      return NextResponse.json(
        { success: false, error: 'Students cannot create surveys.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, type, courseOfferingId, programId, dueDate } = body;

    if (!title || (!courseOfferingId && !programId)) {
      return NextResponse.json(
        { success: false, error: 'title and either courseOfferingId or programId are required.' },
        { status: 400 }
      );
    }

    const survey = await prisma.surveys.create({
      data: {
        title,
        description: description ?? null,
        type: type ?? 'course_exit',
        courseOfferingId: courseOfferingId ? parseInt(courseOfferingId) : null,
        programId: programId ? parseInt(programId) : null,
        createdBy: user!.userId,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'draft',
      },
      include: {
        courseOffering: {
          include: {
            course: { select: { code: true, name: true } },
            semester: { select: { name: true } },
          },
        },
        program: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json({ success: true, data: survey });
  } catch (error) {
    console.error('[CREATE_SURVEY]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create survey.' },
      { status: 500 }
    );
  }
}
