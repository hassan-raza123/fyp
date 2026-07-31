import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { authorize, canAccessProgram, forbiddenResponse, resolveDepartmentScope } from '@/lib/authz';

// GET /api/plos
export async function GET(request: NextRequest) {
  try {
    // PLOs are programme configuration — an accreditation artefact, not
    // student-facing data. Students read their own attainment through
    // /api/student/plo-attainments, which resolves them from the session.
    const auth = await authorize(request, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId');

    const where: any = {};

    if (programId) {
      const id = parseInt(programId, 10);
      if (Number.isNaN(id)) {
        return NextResponse.json(
          { success: false, error: 'Invalid programId' },
          { status: 400 }
        );
      }
      if (!(await canAccessProgram(request, auth.user, id))) {
        return forbiddenResponse();
      }
      where.programId = id;
    } else {
      // No programme named: scope the listing to what the caller may see rather
      // than returning every PLO in the system.
      const scope = await resolveDepartmentScope(request, auth.user);
      if (scope.error) return scope.error;
      if (scope.scoped) {
        where.program = { departmentId: scope.departmentId };
      }
    }

    const plos = await prisma.plos.findMany({
      where,
      include: {
        program: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, data: plos });
  } catch (error) {
    console.error('Error fetching PLOs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch PLOs' },
      { status: 500 }
    );
  }
}
