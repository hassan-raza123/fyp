import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize, canManageCourse, forbidden } from '@/lib/authz';
import { writeAuditLog } from '@/lib/audit-log';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // All roles may read a course's CLOs — students are shown course outcomes.
    const auth = await authorize(req, [
      'super_admin',
      'admin',
      'faculty',
      'student',
    ]);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const courseId = parseInt(id);

    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
    }

    const clos = await prisma.clos.findMany({
      where: {
        courseId: courseId,
        status: 'active',
      },
      orderBy: {
        code: 'asc',
      },
    });

    return NextResponse.json({ success: true, data: clos });
  } catch (error) {
    console.error('Error fetching CLOs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch CLOs' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorize(req, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const courseId = parseInt(id);
    if (isNaN(courseId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid course id' },
        { status: 400 }
      );
    }

    if (!(await canManageCourse(req, auth.user, courseId))) {
      return forbidden('You do not have access to this course').response;
    }

    const { code, description, bloomLevel, status } = await req.json();

    if (!code || !description) {
      return NextResponse.json(
        { success: false, error: 'Code and description are required' },
        { status: 400 }
      );
    }

    const clo = await prisma.clos.create({
      data: { code, description, bloomLevel, status, courseId },
    });

    await writeAuditLog(req, auth.user, 'clo.create', {
      cloId: clo.id,
      courseId,
      code,
      description,
      bloomLevel,
    });

    return NextResponse.json({ success: true, data: clo });
  } catch (error) {
    console.error('Error creating CLO:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create CLO' },
      { status: 500 }
    );
  }
}
