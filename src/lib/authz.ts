import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './prisma';
import { requireAuth, getDepartmentIdFromRequest } from './auth';
import { TokenPayload } from '@/types/auth';

/**
 * Shared authorization helpers.
 *
 * `proxy.ts` only verifies that a request carries a *valid* token — it does not
 * enforce roles or ownership on `/api/*`. Every route must therefore do its own
 * authorization. These helpers exist so that check is consistent instead of
 * being re-implemented (or forgotten) per route.
 */

export type Role = 'super_admin' | 'admin' | 'faculty' | 'student';

export interface AuthzOk {
  ok: true;
  user: TokenPayload;
}

export interface AuthzFail {
  ok: false;
  response: NextResponse;
}

export type AuthzResult = AuthzOk | AuthzFail;

const forbidden = (message = 'Insufficient permissions'): AuthzFail => ({
  ok: false,
  response: NextResponse.json(
    { success: false, error: message },
    { status: 403 }
  ),
});

const unauthorized = (message = 'Unauthorized'): AuthzFail => ({
  ok: false,
  response: NextResponse.json(
    { success: false, error: message },
    { status: 401 }
  ),
});

/**
 * Require an authenticated user holding one of `roles`.
 *
 * Usage:
 *   const auth = await authorize(request, ['admin', 'super_admin']);
 *   if (!auth.ok) return auth.response;
 *   // auth.user is now typed and guaranteed present
 */
export async function authorize(
  request: NextRequest,
  roles: Role[]
): Promise<AuthzResult> {
  const { success, user } = await requireAuth(request);

  if (!success || !user) {
    return unauthorized();
  }

  if (!roles.includes(user.role as Role)) {
    return forbidden();
  }

  return { ok: true, user };
}

/** Resolve the numeric userId from a token payload, tolerating string ids. */
export function getUserId(user: TokenPayload): number | null {
  const raw = user.userId ?? user.userData?.id;
  if (raw === undefined || raw === null) return null;
  const id = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
  return Number.isNaN(id) ? null : id;
}

/** The faculty row belonging to the current user, or null. */
async function facultyIdOf(user: TokenPayload): Promise<number | null> {
  const userId = getUserId(user);
  if (!userId) return null;
  const faculty = await prisma.faculties.findFirst({
    where: { userId },
    select: { id: true },
  });
  return faculty?.id ?? null;
}

/** The student row belonging to the current user, or null. */
async function studentIdOf(user: TokenPayload): Promise<number | null> {
  const userId = getUserId(user);
  if (!userId) return null;
  const student = await prisma.students.findFirst({
    where: { userId },
    select: { id: true },
  });
  return student?.id ?? null;
}

/**
 * Can this user read/modify the given course?
 *
 * super_admin  → always
 * admin        → course belongs to their department
 * faculty      → they teach a section of one of the course's offerings
 * student      → never (courses are configuration, not student data)
 */
export async function canManageCourse(
  request: NextRequest,
  user: TokenPayload,
  courseId: number
): Promise<boolean> {
  if (user.role === 'super_admin') return true;

  if (user.role === 'admin') {
    const departmentId = await getDepartmentIdFromRequest(request);
    if (!departmentId) return false;
    const course = await prisma.courses.findUnique({
      where: { id: courseId },
      select: { departmentId: true },
    });
    return course?.departmentId === departmentId;
  }

  if (user.role === 'faculty') {
    const facultyId = await facultyIdOf(user);
    if (!facultyId) return false;
    const section = await prisma.sections.findFirst({
      where: { facultyId, courseOffering: { courseId } },
      select: { id: true },
    });
    return section !== null;
  }

  return false;
}

/**
 * Can this user read the given section?
 *
 * super_admin  → always
 * admin        → section's course belongs to their department
 * faculty      → they are assigned to the section
 * student      → they are enrolled in the section
 */
export async function canAccessSection(
  request: NextRequest,
  user: TokenPayload,
  sectionId: number
): Promise<boolean> {
  if (user.role === 'super_admin') return true;

  if (user.role === 'admin') {
    const departmentId = await getDepartmentIdFromRequest(request);
    if (!departmentId) return false;
    const section = await prisma.sections.findUnique({
      where: { id: sectionId },
      select: { courseOffering: { select: { course: { select: { departmentId: true } } } } },
    });
    return section?.courseOffering.course.departmentId === departmentId;
  }

  if (user.role === 'faculty') {
    const facultyId = await facultyIdOf(user);
    if (!facultyId) return false;
    const section = await prisma.sections.findFirst({
      where: { id: sectionId, facultyId },
      select: { id: true },
    });
    return section !== null;
  }

  if (user.role === 'student') {
    const studentId = await studentIdOf(user);
    if (!studentId) return false;
    const enrollment = await prisma.studentsections.findFirst({
      where: { sectionId, studentId, status: 'active' },
      select: { id: true },
    });
    return enrollment !== null;
  }

  return false;
}

/**
 * Can this user read the given student's records?
 *
 * super_admin  → always
 * admin        → student belongs to their department
 * faculty      → the student is enrolled in a section they teach
 * student      → only themselves
 */
export async function canAccessStudent(
  request: NextRequest,
  user: TokenPayload,
  studentId: number
): Promise<boolean> {
  if (user.role === 'super_admin') return true;

  if (user.role === 'admin') {
    const departmentId = await getDepartmentIdFromRequest(request);
    if (!departmentId) return false;
    const student = await prisma.students.findUnique({
      where: { id: studentId },
      select: { departmentId: true },
    });
    return student?.departmentId === departmentId;
  }

  if (user.role === 'faculty') {
    const facultyId = await facultyIdOf(user);
    if (!facultyId) return false;
    const enrollment = await prisma.studentsections.findFirst({
      where: { studentId, section: { facultyId } },
      select: { id: true },
    });
    return enrollment !== null;
  }

  if (user.role === 'student') {
    const selfId = await studentIdOf(user);
    return selfId === studentId;
  }

  return false;
}

/**
 * Can this user modify the given course offering's assessments/marks?
 * Same rules as `canManageCourse`, resolved through the offering.
 */
export async function canManageCourseOffering(
  request: NextRequest,
  user: TokenPayload,
  courseOfferingId: number
): Promise<boolean> {
  const offering = await prisma.courseofferings.findUnique({
    where: { id: courseOfferingId },
    select: { courseId: true },
  });
  if (!offering) return false;
  return canManageCourse(request, user, offering.courseId);
}

/**
 * Reject the request when the course offering's results are locked.
 * Returns null when entry is allowed, or the error response when it is not.
 *
 * Admins and super_admins are allowed through so a lock can still be corrected
 * by staff; faculty are blocked, which is the point of the lock.
 */
export async function assertResultsUnlocked(
  user: TokenPayload,
  courseOfferingId: number
): Promise<NextResponse | null> {
  if (user.role === 'admin' || user.role === 'super_admin') return null;

  const offering = await prisma.courseofferings.findUnique({
    where: { id: courseOfferingId },
    select: { isResultsLocked: true },
  });

  if (offering?.isResultsLocked) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Results are locked for this course offering. Contact your department admin to unlock.',
      },
      { status: 403 }
    );
  }

  return null;
}

export { forbidden, unauthorized };

/**
 * Resolve the department a request should be scoped to.
 *
 * A `super_admin` deliberately belongs to no department — they oversee all of
 * them — so scoping does not apply to them. Routes that simply demanded a
 * department id rejected super admins outright, which locked the highest
 * privilege role out of most of the system.
 *
 * Returns:
 *   - `{ scoped: false }`             → super_admin, apply no department filter
 *   - `{ scoped: true, departmentId }`→ filter by this department
 *   - `{ error }`                     → the caller has no department assigned
 */
export async function resolveDepartmentScope(
  request: NextRequest,
  user: TokenPayload
): Promise<
  | { scoped: false; departmentId: null; error?: undefined }
  | { scoped: true; departmentId: number; error?: undefined }
  | { scoped: false; departmentId: null; error: NextResponse }
> {
  if (user.role === 'super_admin') {
    return { scoped: false, departmentId: null };
  }

  const departmentId = await getDepartmentIdFromRequest(request);

  if (!departmentId) {
    return {
      scoped: false,
      departmentId: null,
      error: NextResponse.json(
        {
          success: false,
          error: 'Department not assigned. Please contact super admin.',
        },
        { status: 400 }
      ),
    };
  }

  return { scoped: true, departmentId };
}

/**
 * Build a Prisma `where` fragment for department scoping.
 * Empty for super_admin, `{ departmentId }` otherwise.
 */
export function departmentFilter(
  departmentId: number | null,
  field = 'departmentId'
): Record<string, number> {
  return departmentId === null ? {} : { [field]: departmentId };
}
