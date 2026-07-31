import { NextRequest, NextResponse } from 'next/server';
import { resolveDepartmentScope, departmentFilter } from '@/lib/authz';
import { prisma } from '@/lib/prisma';
import { buildTranscriptSnapshot } from '@/lib/obe';
import { requireAuth, getDepartmentIdFromRequest } from '@/lib/auth';
import { Prisma, transcript_type, transcript_status } from '@prisma/client';
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
    if (!success || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // A signed-in user refused for lack of privilege is 403, not 401. Clients
    // read 401 as an expired session and bounce the user to /login, which
    // turns a permissions error into an apparent logout.
    if (!['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get admin's department to scope results
    // A super_admin belongs to no department and must not be scoped out of
    // the system; see resolveDepartmentScope.
    const departmentIdScope = await resolveDepartmentScope(request, user!);
    if (departmentIdScope.error) return departmentIdScope.error;
    const departmentId = departmentIdScope.departmentId;

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const semesterId = searchParams.get('semesterId');
    const status = searchParams.get('status');

    const where: any = {
      // Scoped for departmental roles; unscoped for super_admin
      ...(departmentId !== null ? { student: { departmentId } } : {}),
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
    if (!success || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // A signed-in user refused for lack of privilege is 403, not 401. Clients
    // read 401 as an expired session and bounce the user to /login, which
    // turns a permissions error into an apparent logout.
    if (!['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get admin's department to scope access
    // A super_admin belongs to no department and must not be scoped out of
    // the system; see resolveDepartmentScope.
    const departmentIdScope = await resolveDepartmentScope(request, user!);
    if (departmentIdScope.error) return departmentIdScope.error;
    const departmentId = departmentIdScope.departmentId;

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

    if (departmentId !== null && student.departmentId !== departmentId) {
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

    // Capture the full transcript body now. Storing only a CGPA and rebuilding
    // the rest on demand meant an already-issued official transcript changed
    // whenever a grade was later corrected.
    const snapshot = await buildTranscriptSnapshot(
      validatedData.studentId,
      validatedData.semesterId ?? null
    );

    const transcript = await prisma.transcripts.create({
      data: {
        studentId: validatedData.studentId,
        semesterId: validatedData.semesterId,
        transcriptType: validatedData.transcriptType,
        isOfficial: validatedData.isOfficial,
        totalCGPA: snapshot.cgpa,
        totalCreditHours: snapshot.totalCreditHours,
        data: snapshot as unknown as Prisma.InputJsonValue,
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
