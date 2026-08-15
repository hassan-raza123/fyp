import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize, canManageCourseOffering, forbiddenResponse } from '@/lib/authz';

export async function GET(request: NextRequest, { params: _params }: { params: Promise<{ id: string }> }) {
  const params = await _params;
  const auth = await authorize(request, ['super_admin', 'admin', 'faculty']);
  if (!auth.ok) return auth.response;

  const criterion = await prisma.passfailcriteria.findUnique({
    where: { id: parseInt(params.id) },
    include: {
      courseofferings: {
        include: {
          course: { select: { code: true, name: true } },
          semester: { select: { name: true } },
        },
      },
    },
  });

  if (!criterion) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (!(await canManageCourseOffering(request, auth.user, criterion.courseOfferingId))) {
    return forbiddenResponse();
  }

  return NextResponse.json({ success: true, data: criterion });
}

export async function PUT(request: NextRequest, { params: _params }: { params: Promise<{ id: string }> }) {
  const params = await _params;
  const auth = await authorize(request, ['super_admin', 'admin']);
  if (!auth.ok) return auth.response;

  // The GET above resolves ownership through the course offering; so must this.
  const existing = await prisma.passfailcriteria.findUnique({
    where: { id: parseInt(params.id) },
    select: { courseOfferingId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Criteria not found' }, { status: 404 });
  }
  if (
    !(await canManageCourseOffering(request, auth.user, existing.courseOfferingId))
  ) {
    return forbiddenResponse();
  }

  const body = await request.json();
  const { minPassPercent, minCloAttainmentPercent, minLloAttainmentPercent, minAttendancePercent, status } = body;

  const criterion = await prisma.passfailcriteria.update({
    where: { id: parseInt(params.id) },
    data: {
      ...(minPassPercent !== undefined && { minPassPercent: parseFloat(minPassPercent) }),
      ...(minCloAttainmentPercent !== undefined && {
        minCloAttainmentPercent: minCloAttainmentPercent === null ? null : parseFloat(minCloAttainmentPercent),
      }),
      ...(minLloAttainmentPercent !== undefined && {
        minLloAttainmentPercent: minLloAttainmentPercent === null ? null : parseFloat(minLloAttainmentPercent),
      }),
      ...(minAttendancePercent !== undefined && {
        minAttendancePercent: minAttendancePercent === null ? null : parseFloat(minAttendancePercent),
      }),
      ...(status !== undefined && { status }),
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true, data: criterion });
}
