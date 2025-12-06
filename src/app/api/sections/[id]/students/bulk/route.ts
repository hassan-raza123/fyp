import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// POST /api/sections/[id]/students/bulk - Add multiple students to a section
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Check authentication
    const { success, user, error } = await requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { studentIds } = body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Student IDs array is required' },
        { status: 400 }
      );
    }

    // Handle both sync and async params (Next.js 15+ compatibility)
    const resolvedParams = context.params instanceof Promise ? await context.params : context.params;
    const sectionId = parseInt(resolvedParams.id);
    
    if (isNaN(sectionId) || sectionId <= 0) {
      return NextResponse.json(
        { success: false, error: 'Section ID is invalid' },
        { status: 400 }
      );
    }

    // Get section details
    const section = await prisma.sections.findUnique({
      where: { id: sectionId },
      include: {
        _count: {
          select: {
            studentsections: true,
          },
        },
        batch: true,
        courseOffering: {
          include: {
            course: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
        faculty: {
          include: {
            user: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!section) {
      return NextResponse.json(
        { success: false, error: 'Section not found' },
        { status: 404 }
      );
    }

    // Check available space
    const availableSpace = section.maxStudents - section._count.studentsections;
    if (studentIds.length > availableSpace) {
      return NextResponse.json(
        {
          success: false,
          error: `Section can only accommodate ${availableSpace} more student(s). You are trying to add ${studentIds.length} student(s).`,
        },
        { status: 400 }
      );
    }

    // Get all students and validate
    const students = await prisma.students.findMany({
      where: {
        id: { in: studentIds.map((id: any) => parseInt(id)) },
      },
      include: {
        batch: true,
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    if (students.length !== studentIds.length) {
      return NextResponse.json(
        { success: false, error: 'Some students not found' },
        { status: 404 }
      );
    }

    // Validate all students belong to same batch
    const invalidBatchStudents = students.filter(
      (s) => s.batchId !== section.batchId
    );
    if (invalidBatchStudents.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Some students do not belong to batch ${section.batch.name}`,
        },
        { status: 400 }
      );
    }

    // Check existing enrollments
    const existingEnrollments = await prisma.studentsections.findMany({
      where: {
        studentId: { in: students.map((s) => s.id) },
        OR: [
          { sectionId: sectionId },
          {
            section: {
              courseOfferingId: section.courseOfferingId,
            },
            status: 'active',
          },
        ],
      },
      include: {
        section: {
          include: {
            courseOffering: {
              include: {
                course: {
                  select: {
                    code: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const alreadyEnrolled = existingEnrollments.filter(
      (e) => e.sectionId === sectionId
    );
    const enrolledInOtherSection = existingEnrollments.filter(
      (e) => e.sectionId !== sectionId && e.section.courseOfferingId === section.courseOfferingId
    );

    if (alreadyEnrolled.length > 0 || enrolledInOtherSection.length > 0) {
      const errors: string[] = [];
      if (alreadyEnrolled.length > 0) {
        errors.push(`${alreadyEnrolled.length} student(s) already enrolled in this section`);
      }
      if (enrolledInOtherSection.length > 0) {
        errors.push(`${enrolledInOtherSection.length} student(s) already enrolled in another section of ${section.courseOffering.course.code}`);
      }
      return NextResponse.json(
        { success: false, error: errors.join('. ') },
        { status: 400 }
      );
    }

    // Enroll all students
    const enrollments = await prisma.$transaction(
      students.map((student) =>
        prisma.studentsections.create({
          data: {
            studentId: student.id,
            sectionId: sectionId,
            status: 'active',
          },
        })
      )
    );

    // Send notification to faculty
    if (section.faculty?.user?.id && section.courseOffering?.course?.code) {
      const { notifyStudentEnrollmentChange } = await import('@/lib/notification-utils');
      await notifyStudentEnrollmentChange(
        section.courseOffering.course.code,
        'added',
        enrollments.length,
        section.facultyId
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        enrolled: enrollments.length,
        students: students.map((s) => ({
          id: s.id,
          rollNumber: s.rollNumber,
          name: `${s.user.first_name} ${s.user.last_name}`,
        })),
      },
      message: `Successfully enrolled ${enrollments.length} student(s)`,
    });
  } catch (error) {
    console.error('Error bulk adding students to section:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add students to section',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

