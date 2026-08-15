import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize, resolveDepartmentScope, forbiddenResponse } from '@/lib/authz';

/**
 * GET /api/departments/[id]/programs
 *
 * The programmes belonging to a department.
 *
 * This route did not exist either. `faculty/students/[id]` calls it to fill the
 * programme dropdown when editing a student, and surfaces the failure as a
 * "Failed to fetch programs" toast — so the field could never be populated and
 * the form could not be completed.
 */
export async function GET(
  request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params;
  try {
    const auth = await authorize(request, [
      'super_admin',
      'admin',
      'faculty',
    ]);
    if (!auth.ok) return auth.response;

    const departmentId = parseInt(params.id, 10);
    if (Number.isNaN(departmentId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid department ID' },
        { status: 400 }
      );
    }

    // A departmental role may only read its own department's programmes; a
    // super_admin is unscoped by design.
    const scope = await resolveDepartmentScope(request, auth.user);
    if (scope.error) return scope.error;
    if (scope.scoped && scope.departmentId !== departmentId) {
      return forbiddenResponse();
    }

    const programs = await prisma.programs.findMany({
      where: { departmentId, status: 'active' },
      select: {
        id: true,
        name: true,
        code: true,
        duration: true,
        totalCreditHours: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: programs });
  } catch (error) {
    console.error('Error fetching department programs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch programs' },
      { status: 500 }
    );
  }
}
