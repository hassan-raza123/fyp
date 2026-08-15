import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import {
  authorize,
  canAccessCourse,
  canAccessProgram,
  forbiddenResponse,
  programScopeFilter,
} from '@/lib/authz';

export async function GET(request: NextRequest) {
  const auth = await authorize(request, ['super_admin', 'admin', 'faculty']);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const programIdParam = searchParams.get('programId');
  const programId = programIdParam ? parseInt(programIdParam, 10) : null;

  if (programId !== null && Number.isNaN(programId)) {
    return NextResponse.json({ error: 'Invalid programId' }, { status: 400 });
  }

  const scope = await programScopeFilter(request, auth.user, programId);
  if ('error' in scope) return scope.error;

  const where = scope.where as Prisma.program_curriculumWhereInput;

  const entries = await prisma.program_curriculum.findMany({
    where,
    include: {
      course: {
        select: {
          id: true,
          code: true,
          name: true,
          creditHours: true,
          theoryHours: true,
          labHours: true,
          type: true,
          status: true,
        },
      },
      program: { select: { id: true, name: true, code: true, duration: true } },
    },
    orderBy: [{ semesterSlot: 'asc' }, { courseCategory: 'asc' }],
  });

  return NextResponse.json({ success: true, data: entries });
}

export async function POST(request: NextRequest) {
  const auth = await authorize(request, ['super_admin', 'admin']);
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const { programId, courseId, semesterSlot, courseCategory, isRequired } = body;

  if (!programId || !courseId || !semesterSlot) {
    return NextResponse.json(
      { error: 'programId, courseId, and semesterSlot are required' },
      { status: 400 }
    );
  }

  // The curriculum defines what a degree requires. Both ids come from the
  // body, so both sides are checked: the programme being written into, and the
  // course being pulled in.
  if (!(await canAccessProgram(request, auth.user, parseInt(programId)))) {
    return forbiddenResponse();
  }
  if (!(await canAccessCourse(request, auth.user, parseInt(courseId)))) {
    return forbiddenResponse();
  }

  // Check if already exists
  const existing = await prisma.program_curriculum.findUnique({
    where: { programId_courseId: { programId: parseInt(programId), courseId: parseInt(courseId) } },
  });
  if (existing) {
    return NextResponse.json(
      { error: 'Course is already in this program curriculum' },
      { status: 409 }
    );
  }

  const entry = await prisma.program_curriculum.create({
    data: {
      programId: parseInt(programId),
      courseId: parseInt(courseId),
      semesterSlot: parseInt(semesterSlot),
      courseCategory: courseCategory ?? 'core',
      isRequired: isRequired ?? true,
    },
    include: {
      course: { select: { id: true, code: true, name: true, creditHours: true, type: true } },
      program: { select: { id: true, name: true, code: true } },
    },
  });

  return NextResponse.json({ success: true, data: entry }, { status: 201 });
}
