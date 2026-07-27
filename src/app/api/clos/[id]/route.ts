import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize, canManageCourse, forbidden } from '@/lib/authz';
import { writeAuditLog } from '@/lib/audit-log';

// GET /api/clos/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Students may read CLOs (they are shown course outcomes), so all roles pass
    // here; write operations below are restricted to staff.
    const auth = await authorize(request, [
      'super_admin',
      'admin',
      'faculty',
      'student',
    ]);
    if (!auth.ok) return auth.response;

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid CLO ID' },
        { status: 400 }
      );
    }

    const clo = await prisma.clos.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    if (!clo) {
      return NextResponse.json(
        { success: false, error: 'CLO not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: clo });
  } catch (error) {
    console.error('Error fetching CLO:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch CLO' },
      { status: 500 }
    );
  }
}

// PUT /api/clos/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorize(req, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid CLO ID' },
        { status: 400 }
      );
    }

    const data = await req.json();
    const { code, description, courseId, bloomLevel, status } = data;

    if (!code || !description || !courseId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const codeRegex = /^CLO\d+$/;
    if (!codeRegex.test(code)) {
      return NextResponse.json(
        { success: false, error: 'Invalid CLO code format. Use format: CLO1, CLO2, etc.' },
        { status: 400 }
      );
    }

    const existingCLO = await prisma.clos.findUnique({ where: { id } });
    if (!existingCLO) {
      return NextResponse.json(
        { success: false, error: 'CLO not found' },
        { status: 404 }
      );
    }

    const course = await prisma.courses.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Must be allowed to manage both the CLO's current course and the target
    // course, otherwise a CLO could be moved into a course out of reach.
    const allowedOnCurrent = await canManageCourse(
      req,
      auth.user,
      existingCLO.courseId
    );
    const allowedOnTarget = await canManageCourse(req, auth.user, courseId);
    if (!allowedOnCurrent || !allowedOnTarget) {
      return forbidden('You do not have access to this course').response;
    }

    const duplicateCLO = await prisma.clos.findFirst({
      where: { code, courseId, id: { not: id } },
    });
    if (duplicateCLO) {
      return NextResponse.json(
        { success: false, error: 'CLO code already exists for this course' },
        { status: 400 }
      );
    }

    const updatedCLO = await prisma.clos.update({
      where: { id },
      data: { code, description, courseId, bloomLevel, status: status || 'active' },
      include: {
        course: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    await writeAuditLog(req, auth.user, 'clo.update', {
      cloId: id,
      courseId,
      before: {
        code: existingCLO.code,
        description: existingCLO.description,
        courseId: existingCLO.courseId,
        bloomLevel: existingCLO.bloomLevel,
        status: existingCLO.status,
      },
      after: { code, description, courseId, bloomLevel, status },
    });

    return NextResponse.json({ success: true, data: updatedCLO });
  } catch (error) {
    console.error('Error updating CLO:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/clos/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorize(req, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid CLO ID' }, { status: 400 });
    }

    const existingCLO = await prisma.clos.findUnique({ where: { id } });
    if (!existingCLO) {
      return NextResponse.json({ error: 'CLO not found' }, { status: 404 });
    }

    if (!(await canManageCourse(req, auth.user, existingCLO.courseId))) {
      return forbidden('You do not have access to this course').response;
    }

    await prisma.clos.delete({ where: { id } });

    await writeAuditLog(req, auth.user, 'clo.delete', {
      cloId: id,
      courseId: existingCLO.courseId,
      code: existingCLO.code,
      description: existingCLO.description,
    });

    return NextResponse.json({ message: 'CLO deleted successfully' });
  } catch (error) {
    console.error('Error deleting CLO:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
