import { NextRequest, NextResponse } from 'next/server';
import { authorize, resolveDepartmentScope } from '@/lib/authz';
import { findDefaulters } from '@/lib/attendance';

/**
 * Students below the attendance threshold, department-wide.
 *
 * GET /api/attendance/defaulters?semesterId=&programId=&includeAtRisk=
 *
 * Scoped through `resolveDepartmentScope` so an admin sees only their own
 * department while a super admin sees everything.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authorize(request, ['admin', 'super_admin']);
    if (!auth.ok) return auth.response;

    const scope = await resolveDepartmentScope(request, auth.user);
    if (scope.error) return scope.error;

    const { searchParams } = new URL(request.url);
    const semesterIdParam = searchParams.get('semesterId');

    if (!semesterIdParam) {
      return NextResponse.json(
        { success: false, error: 'semesterId is required' },
        { status: 400 }
      );
    }

    const semesterId = parseInt(semesterIdParam, 10);
    if (Number.isNaN(semesterId)) {
      return NextResponse.json(
        { success: false, error: 'semesterId must be a number' },
        { status: 400 }
      );
    }

    const programIdParam = searchParams.get('programId');
    const programId = programIdParam ? parseInt(programIdParam, 10) : undefined;

    const defaulters = await findDefaulters(scope.departmentId, semesterId, {
      includeAtRisk: searchParams.get('includeAtRisk') === 'true',
      programId: Number.isNaN(programId as number) ? undefined : programId,
    });

    // A student short in several courses is one student with several problems;
    // both figures matter to a department planning interventions.
    const uniqueStudents = new Set(defaulters.map((d) => d.studentId)).size;

    return NextResponse.json({
      success: true,
      data: {
        defaulters,
        totalRecords: defaulters.length,
        uniqueStudents,
      },
    });
  } catch (error) {
    console.error('Error fetching defaulters:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch defaulters' },
      { status: 500 }
    );
  }
}
