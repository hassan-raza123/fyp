import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFacultyIdFromRequest } from '@/lib/auth';
import { authorize, resolveDepartmentScope } from '@/lib/authz';

/**
 * Course offerings the caller may enter assessments and marks against.
 *
 * The path says `faculty`, and it used to resolve the caller only through
 * `getFacultyIdFromRequest` — which returns null for anything that is not a
 * faculty account. But `AssessmentList` and `CreateAssessmentForm` are shared
 * components, and `/admin/assessments` renders them: the admin's assessments
 * screen called this endpoint on every load and got a 401, so its course
 * offering selector was permanently empty. The page still rendered, which is
 * why it looked like "no data" rather than a broken call.
 *
 * The two roles want the same shape of answer to a slightly different question:
 *
 *   faculty      → the offerings I teach, with my sections
 *   admin        → the offerings in my department, with all their sections
 *   super_admin   → the same, unscoped
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authorize(request, [
      'super_admin',
      'admin',
      'faculty',
    ]);
    if (!auth.ok) return auth.response;

    let where: Record<string, unknown>;
    let sectionFilter: Record<string, unknown>;

    if (auth.user.role === 'faculty') {
      const facultyId = await getFacultyIdFromRequest(request);
      if (!facultyId) {
        return NextResponse.json(
          { success: false, error: 'Faculty not found or unauthorized' },
          { status: 401 }
        );
      }

      where = {
        sections: { some: { facultyId, status: 'active' } },
        status: 'active',
      };
      sectionFilter = { facultyId, status: 'active' };
    } else {
      const scope = await resolveDepartmentScope(request, auth.user);
      if (scope.error) return scope.error;

      where = {
        status: 'active',
        ...(scope.scoped
          ? { course: { departmentId: scope.departmentId } }
          : {}),
      };
      sectionFilter = { status: 'active' };
    }

    const courseOfferings = await prisma.courseofferings.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        semester: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
          },
        },
        sections: {
          where: sectionFilter,
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: courseOfferings,
    });
  } catch (error) {
    console.error('Error fetching course offerings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch course offerings' },
      { status: 500 }
    );
  }
}
