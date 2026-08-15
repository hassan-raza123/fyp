import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize, canAccessCourse, forbiddenResponse } from '@/lib/authz';

// GET /api/courses/[id]/prerequisites — list prerequisites for a course
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(request, [
    'super_admin',
    'admin',
    'faculty',
    'student',
  ]);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const courseId = parseInt(id);

  if (Number.isNaN(courseId)) {
    return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
  }

  if (!(await canAccessCourse(request, auth.user, courseId))) {
    return forbiddenResponse();
  }

  const course = await prisma.courses.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      code: true,
      name: true,
      // courses_B = prerequisites OF this course (this course depends on these)
      courses_B: {
        include: {
          courseA: {
            select: { id: true, code: true, name: true, creditHours: true, type: true, status: true },
          },
        },
      },
    },
  });

  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

  return NextResponse.json({ success: true, data: course.courses_B.map((r: any) => r.courseA) });
}

// POST /api/courses/[id]/prerequisites — add a prerequisite
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(request, ['super_admin', 'admin']);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const courseId = parseInt(id);
  const body = await request.json();
  const { prerequisiteId } = body;

  if (!prerequisiteId) {
    return NextResponse.json({ error: 'prerequisiteId is required' }, { status: 400 });
  }

  if (courseId === parseInt(prerequisiteId)) {
    return NextResponse.json({ error: 'A course cannot be its own prerequisite' }, { status: 400 });
  }

  // Both courses are named by the caller, and both are checked: the course
  // being changed, and the one being made its prerequisite. A prerequisite is
  // a graduation gate, so a foreign write here blocks real students.
  if (!(await canAccessCourse(request, auth.user, courseId))) {
    return forbiddenResponse();
  }
  if (!(await canAccessCourse(request, auth.user, parseInt(prerequisiteId)))) {
    return forbiddenResponse();
  }

  await prisma.courseprerequisites.create({
    data: { A: parseInt(prerequisiteId), B: courseId },
  });

  const prerequisite = await prisma.courses.findUnique({
    where: { id: parseInt(prerequisiteId) },
    select: { id: true, code: true, name: true, creditHours: true, type: true },
  });

  return NextResponse.json({ success: true, data: prerequisite }, { status: 201 });
}

// DELETE /api/courses/[id]/prerequisites — remove a prerequisite
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(request, ['super_admin', 'admin']);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const courseId = parseInt(id);
  const body = await request.json();
  const { prerequisiteId } = body;

  if (!prerequisiteId) {
    return NextResponse.json({ error: 'prerequisiteId is required' }, { status: 400 });
  }

  if (!(await canAccessCourse(request, auth.user, courseId))) {
    return forbiddenResponse();
  }

  await prisma.courseprerequisites.delete({
    where: { A_B: { A: parseInt(prerequisiteId), B: courseId } },
  });

  return NextResponse.json({ success: true, message: 'Prerequisite removed' });
}
