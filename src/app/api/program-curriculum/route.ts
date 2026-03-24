import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  const { success, error } = await requireAuth(request);
  if (!success) return NextResponse.json({ error }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const programId = searchParams.get('programId');

  const where: Prisma.program_curriculumWhereInput = {};
  if (programId) where.programId = parseInt(programId);

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
  const { success, user, error } = await requireAuth(request);
  if (!success) return NextResponse.json({ error }, { status: 401 });
  if (user?.role !== 'admin') {
    return NextResponse.json({ error: 'Admins only' }, { status: 403 });
  }

  const body = await request.json();
  const { programId, courseId, semesterSlot, courseCategory, isRequired } = body;

  if (!programId || !courseId || !semesterSlot) {
    return NextResponse.json(
      { error: 'programId, courseId, and semesterSlot are required' },
      { status: 400 }
    );
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
