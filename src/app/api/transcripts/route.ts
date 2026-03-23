import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getDepartmentIdFromRequest } from '@/lib/auth';
import { transcript_type, transcript_status } from '@prisma/client';
import { z } from 'zod';

const createTranscriptSchema = z.object({
  studentId: z.number(),
  semesterId: z.number().optional(),
  transcriptType: z.nativeEnum(transcript_type),
  isOfficial: z.boolean().default(false),
});

export async function GET(request: NextRequest) {
  try {
    const { success, user, error } = await requireAuth(request);
    if (!success || user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get admin's department to scope results
    const departmentId = await getDepartmentIdFromRequest(request);
    if (!departmentId) {
      return NextResponse.json(
        { success: false, error: 'Department not found for your account' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const semesterId = searchParams.get('semesterId');
    const status = searchParams.get('status');

    const where: any = {
      student: { departmentId },
    };
    if (studentId) where.studentId = parseInt(studentId);
    if (semesterId) where.semesterId = parseInt(semesterId);
    if (status) where.status = status;

    const transcripts = await prisma.transcripts.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            },
            program: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            department: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        semester: {
          select: {
            id: true,
            name: true,
          },
        },
        generator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
      orderBy: {
        generatedAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, data: transcripts });
  } catch (error) {
    console.error('Error fetching transcripts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transcripts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { success, user, error } = await requireAuth(request);
    if (!success || user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get admin's department to scope access
    const departmentId = await getDepartmentIdFromRequest(request);
    if (!departmentId) {
      return NextResponse.json(
        { success: false, error: 'Department not found for your account' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = createTranscriptSchema.parse(body);

    // Validate student exists and belongs to admin's department
    const student = await prisma.students.findUnique({
      where: { id: validatedData.studentId },
      include: {
        cumulativeGPA: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    if (student.departmentId !== departmentId) {
      return NextResponse.json(
        { success: false, error: 'Student does not belong to your department' },
        { status: 403 }
      );
    }

    // Validate semester if provided
    if (validatedData.semesterId) {
      const semester = await prisma.semesters.findUnique({
        where: { id: validatedData.semesterId },
      });
      if (!semester) {
        return NextResponse.json(
          { success: false, error: 'Semester not found' },
          { status: 404 }
        );
      }
    }

    // Calculate total CGPA and credit hours
    const cumulativeGPA = student.cumulativeGPA;
    const totalCGPA = cumulativeGPA?.cumulativeGPA || null;
    const totalCreditHours = cumulativeGPA?.totalCreditHours || null;

    const transcript = await prisma.transcripts.create({
      data: {
        studentId: validatedData.studentId,
        semesterId: validatedData.semesterId,
        transcriptType: validatedData.transcriptType,
        isOfficial: validatedData.isOfficial,
        totalCGPA,
        totalCreditHours,
        generatedBy: user.userId,
        status: transcript_status.generated,
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            },
            program: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            department: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        semester: {
          select: {
            id: true,
            name: true,
          },
        },
        generator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Transcript generated successfully',
      data: transcript,
    });
  } catch (error) {
    console.error('Error creating transcript:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to generate transcript' },
      { status: 500 }
    );
  }
}
