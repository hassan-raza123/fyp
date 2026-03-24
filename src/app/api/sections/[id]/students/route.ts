import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// POST /api/sections/[id]/students - Add a student to a section
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    console.log('--- POST /api/sections/[id]/students called ---');
    // Check authentication
    const { success, user, error } = await requireAuth(request);
    console.log('Auth result:', { success, user, error });
    if (!success) {
      console.log('Auth failed');
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Role check
    if (!['admin', 'super_admin', 'faculty'].includes(user?.role ?? '')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log('Received body:', body); // Debug log
    const { studentId } = body;

    if (!studentId || isNaN(Number(studentId)) || Number(studentId) <= 0) {
      console.log('Invalid studentId:', studentId);
      return NextResponse.json(
        {
          success: false,
          error: 'Student ID is required and must be a valid number',
          received: body,
        },
        { status: 400 }
      );
    }

    // Await params for Next.js 14+
    const { id } = await context.params;
    const sectionId = parseInt(id);
    console.log('Section ID:', sectionId);
    if (isNaN(sectionId) || sectionId <= 0) {
      console.log('Invalid sectionId:', id);
      return NextResponse.json(
        {
          success: false,
          error: 'Section ID is invalid',
          received: context.params,
        },
        { status: 400 }
      );
    }

    // Check if section exists and get current student count
    const section = await prisma.sections.findUnique({
      where: { id: sectionId },
      include: {
        _count: {
          select: {
            studentsections: true,
          },
        },
        batch: true,
      },
    });
    console.log('Section found:', !!section, section);

    if (!section) {
      console.log('Section not found');
      return NextResponse.json(
        { success: false, error: 'Section not found' },
        { status: 404 }
      );
    }

    // Check if section is full
    if (section._count.studentsections >= section.maxStudents) {
      console.log('Section is full');
      return NextResponse.json(
        { success: false, error: 'Section is full' },
        { status: 400 }
      );
    }

    // Check if student exists and belongs to the same batch
    const student = await prisma.students.findUnique({
      where: { id: parseInt(studentId) },
      include: {
        batch: true,
      },
    });
    console.log('Student found:', !!student, student);

    if (!student) {
      console.log('Student not found');
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    // Check if student belongs to the same batch as the section
    if (student.batchId !== section.batchId) {
      console.log('Student batch mismatch:', student.batchId, section.batchId);
      return NextResponse.json(
        { success: false, error: 'Student does not belong to this batch' },
        { status: 400 }
      );
    }

    // Check if student is already actively enrolled in this section (dropped students can re-enroll)
    const existingEnrollment = await prisma.studentsections.findFirst({
      where: {
        studentId: parseInt(studentId),
        sectionId: sectionId,
        status: 'active',
      },
    });
    console.log(
      'Existing enrollment:',
      !!existingEnrollment,
      existingEnrollment
    );

    if (existingEnrollment) {
      console.log('Student already enrolled');
      return NextResponse.json(
        {
          success: false,
          error: 'Student is already enrolled in this section',
        },
        { status: 400 }
      );
    }

    // Check if student is already enrolled in another section of the same course offering
    const sectionWithCourseOffering = await prisma.sections.findUnique({
      where: { id: sectionId },
      select: {
        courseOfferingId: true,
      },
    });

    if (sectionWithCourseOffering) {
      const existingCourseEnrollment = await prisma.studentsections.findFirst({
        where: {
          studentId: parseInt(studentId),
          section: {
            courseOfferingId: sectionWithCourseOffering.courseOfferingId,
          },
          status: 'active',
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

      if (existingCourseEnrollment) {
        console.log('Student already enrolled in another section of the same course');
        return NextResponse.json(
          {
            success: false,
            error: `Student is already enrolled in ${existingCourseEnrollment.section.courseOffering.course.code} (${existingCourseEnrollment.section.courseOffering.course.name}) - Section ${existingCourseEnrollment.section.name}. A student can only be enrolled in one section per course.`,
          },
          { status: 400 }
        );
      }
    }

    // Get section with course offering and faculty for notification
    const sectionWithDetails = await prisma.sections.findUnique({
      where: { id: sectionId },
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

    // Add student to section
    const studentSection = await prisma.studentsections.create({
      data: {
        studentId: parseInt(studentId),
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
                email: true,
              },
            },
          },
        },
      },
    });
    console.log('Student added to section:', studentSection);

    // Send notification to faculty about enrollment change
    if (sectionWithDetails?.faculty?.user?.id && sectionWithDetails?.courseOffering?.course?.code) {
      const { notifyStudentEnrollmentChange } = await import('@/lib/notification-utils');
      await notifyStudentEnrollmentChange(
        sectionWithDetails.courseOffering.course.code,
        'added',
        1,
        sectionWithDetails.facultyId ?? 0
      );
    }

    return NextResponse.json({
      success: true,
      data: studentSection,
    });
  } catch (error) {
    console.error('Error adding student to section:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add student to section',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// DELETE /api/sections/[id]/students - Remove a student from a section
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    console.log('--- DELETE /api/sections/[id]/students called ---');
    // Check authentication
    const { success, user, error } = await requireAuth(request);
    console.log('Auth result:', { success, user, error });
    if (!success) {
      console.log('Auth failed');
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Role check
    if (!['admin', 'super_admin', 'faculty'].includes(user?.role ?? '')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { studentId } = body;
    console.log('Received studentId:', studentId);

    if (!studentId || isNaN(Number(studentId)) || Number(studentId) <= 0) {
      console.log('Invalid studentId:', studentId);
      return NextResponse.json(
        {
          success: false,
          error: 'Student ID is required and must be a valid number',
          received: { studentId },
        },
        { status: 400 }
      );
    }

    // Handle both sync and async params (Next.js 15+ compatibility)
    const resolvedParams = context.params instanceof Promise ? await context.params : context.params;
    const sectionId = parseInt(resolvedParams.id);
    console.log('Section ID:', sectionId);
    if (isNaN(sectionId) || sectionId <= 0) {
      console.log('Invalid sectionId:', resolvedParams.id);
      return NextResponse.json(
        {
          success: false,
          error: 'Section ID is invalid',
          received: context.params,
        },
        { status: 400 }
      );
    }

    // Check if enrollment exists
    const enrollment = await prisma.studentsections.findFirst({
      where: {
        studentId: parseInt(studentId),
        sectionId: sectionId,
      },
    });
    console.log('Enrollment found:', !!enrollment, enrollment);

    if (!enrollment) {
      console.log('Enrollment not found');
      return NextResponse.json(
        { success: false, error: 'Student is not enrolled in this section' },
        { status: 404 }
      );
    }

    // Get section with course offering and faculty for notification
    const sectionWithDetails = await prisma.sections.findUnique({
      where: { id: sectionId },
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

    // Remove student from section
    await prisma.studentsections.delete({
      where: {
        id: enrollment.id,
      },
    });
    console.log('Student removed from section:', enrollment.id);

    // Send notification to faculty about enrollment change
    if (sectionWithDetails?.faculty?.user?.id && sectionWithDetails?.courseOffering?.course?.code) {
      const { notifyStudentEnrollmentChange } = await import('@/lib/notification-utils');
      await notifyStudentEnrollmentChange(
        sectionWithDetails.courseOffering.course.code,
        'removed',
        1,
        sectionWithDetails.facultyId ?? 0
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Student removed from section successfully',
    });
  } catch (error) {
    console.error('Error removing student from section:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to remove student from section',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { success, error } = await requireAuth(request as any);
    if (!success) {
      return NextResponse.json(
        { error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Handle both sync and async params (Next.js 15+ compatibility)
    const resolvedParams = params instanceof Promise ? await params : params;
    const sectionId = parseInt(resolvedParams.id);
    if (isNaN(sectionId)) {
      return NextResponse.json(
        { error: 'Invalid section ID' },
        { status: 400 }
      );
    }

    const students = await prisma.studentsections.findMany({
      where: {
        sectionId: sectionId,
        status: 'active',
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
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

    // Transform the data to include full name
    const transformedStudents = students.map(({ student }) => ({
      id: student.id,
      rollNumber: student.rollNumber,
      user: {
        name: `${student.user.first_name} ${student.user.last_name}`,
      },
    }));

    return NextResponse.json(transformedStudents);
  } catch (error) {
    console.error('Error fetching section students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch section students' },
      { status: 500 }
    );
  }
}
