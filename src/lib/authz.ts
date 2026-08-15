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
 * Can this user read the *roster* of the given section?
 *
 * Stricter than `canAccessSection` on purpose. A roster names every enrolled
 * student — roll numbers and email addresses included — which is a staff view.
 * An enrolled student passes `canAccessSection` because they legitimately read
 * their own section's marks and attendance, but that is not a reason to hand
 * them their classmates' contact details.
 */
export async function canReadSectionRoster(
  request: NextRequest,
  user: TokenPayload,
  sectionId: number
): Promise<boolean> {
  if (!['super_admin', 'admin', 'faculty'].includes(user.role)) return false;
  return canAccessSection(request, user, sectionId);
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
 * Can this user *read* the given course?
 *
 * Wider than `canManageCourse`, which is about configuration: a student needs
 * to read the course they are taking, so enrolment counts here even though it
 * confers no right to change anything.
 */
export async function canAccessCourse(
  request: NextRequest,
  user: TokenPayload,
  courseId: number
): Promise<boolean> {
  if (await canManageCourse(request, user, courseId)) return true;

  if (user.role === 'student') {
    const studentId = await studentIdOf(user);
    if (!studentId) return false;
    const enrolment = await prisma.studentsections.findFirst({
      where: {
        studentId,
        section: { courseOffering: { courseId } },
      },
      select: { id: true },
    });
    return enrolment !== null;
  }

  return false;
}

/**
 * Can this user read/modify the given programme?
 *
 * super_admin  → always
 * admin        → the programme belongs to their department
 * faculty      → the programme is in their department
 * student      → they are enrolled in it
 *
 * A department admin runs one department, not the system. Routes that only
 * checked for the `admin` role let the admin of one department rename, delete
 * from, and read another department's programmes.
 */
export async function canAccessProgram(
  request: NextRequest,
  user: TokenPayload,
  programId: number
): Promise<boolean> {
  if (user.role === 'super_admin') return true;

  const program = await prisma.programs.findUnique({
    where: { id: programId },
    select: { departmentId: true },
  });
  if (!program) return false;

  if (user.role === 'admin' || user.role === 'faculty') {
    const departmentId = await getDepartmentIdFromRequest(request);
    if (!departmentId) return false;
    return program.departmentId === departmentId;
  }

  if (user.role === 'student') {
    const userId = getUserId(user);
    if (!userId) return false;
    const student = await prisma.students.findFirst({
      where: { userId, programId },
      select: { id: true },
    });
    return student !== null;
  }

  return false;
}

/** Can this user read/modify the given batch? Resolved through its programme. */
export async function canAccessBatch(
  request: NextRequest,
  user: TokenPayload,
  batchId: string
): Promise<boolean> {
  if (user.role === 'super_admin') return true;

  const batch = await prisma.batches.findUnique({
    where: { id: batchId },
    select: { programId: true },
  });
  if (!batch) return false;

  return canAccessProgram(request, user, batch.programId);
}

/**
 * Can this user administer the given user account?
 *
 * super_admin  → always
 * admin        → the target belongs to their department, via whichever of the
 *                faculty or student rows the account owns
 * anyone else  → only themselves
 *
 * Without this, a department admin could disable or reset the password of any
 * account in the university.
 */
export async function canManageUser(
  request: NextRequest,
  user: TokenPayload,
  targetUserId: number
): Promise<boolean> {
  if (user.role === 'super_admin') return true;

  const selfId = getUserId(user);
  if (selfId === targetUserId) return true;

  if (user.role !== 'admin') return false;

  const departmentId = await getDepartmentIdFromRequest(request);
  if (!departmentId) return false;

  // A super admin is never a department admin's to touch, whatever department
  // their faculty row happens to name. Relying only on the department check
  // below would make that guarantee depend on how the account was set up: a
  // super admin who also holds a faculty row in this department would other-
  // wise be deletable and demotable by the admin of that department.
  const targetRole = await prisma.userroles.findFirst({
    where: { userId: targetUserId },
    select: { role: { select: { name: true } } },
  });
  if (targetRole?.role?.name === 'super_admin') return false;

  // An account is placed in a department by its faculty row or its student row.
  const [faculty, student] = await Promise.all([
    prisma.faculties.findFirst({
      where: { userId: targetUserId },
      select: { departmentId: true },
    }),
    prisma.students.findFirst({
      where: { userId: targetUserId },
      select: { departmentId: true },
    }),
  ]);

  const targetDepartmentId = faculty?.departmentId ?? student?.departmentId;

  // An account belonging to no department (another super admin, say) is not a
  // department admin's to touch.
  if (targetDepartmentId === undefined || targetDepartmentId === null) {
    return false;
  }

  return targetDepartmentId === departmentId;
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
 * Can this user read or administer the given survey?
 *
 * A survey hangs off either a course offering (course-exit surveys) or a
 * programme (alumni, employer, programme-exit), and both columns are nullable.
 * Ownership resolves through whichever one is set:
 *
 * course offering → `canManageCourseOffering`
 * programme       → `canAccessProgram`
 * neither         → super_admin only; nothing scopes it
 *
 * Survey responses feed *indirect* PLO attainment, which is an accreditation
 * figure — so reading another department's survey, editing its questions, or
 * minting its public link are all cross-tenant acts, not merely staff acts.
 * Every survey route checked `['super_admin','admin','faculty']` and stopped
 * there.
 */
export async function canAccessSurvey(
  request: NextRequest,
  user: TokenPayload,
  surveyId: number
): Promise<boolean> {
  if (user.role === 'super_admin') return true;

  const survey = await prisma.surveys.findUnique({
    where: { id: surveyId },
    select: { courseOfferingId: true, programId: true },
  });
  if (!survey) return false;

  if (survey.courseOfferingId !== null) {
    return canManageCourseOffering(request, user, survey.courseOfferingId);
  }
  if (survey.programId !== null) {
    return canAccessProgram(request, user, survey.programId);
  }

  return false;
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
 * A bare 403 response.
 *
 * `forbidden()` returns the `AuthzFail` wrapper, which is what `authorize()`
 * hands back — returning it straight out of a route handler type-checks only
 * because handlers are loosely typed, and ships an object where a Response
 * belongs. Ownership checks (`canManageUser`, `canAccessSection`, …) return a
 * plain boolean and need the response itself, so they get their own helper.
 */
export function forbiddenResponse(
  message = 'Insufficient permissions'
): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status: 403 });
}

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

/**
 * The programmes this user may read, as a Prisma `where` fragment.
 *
 * The OBE configuration endpoints (`/api/peos`, `/api/plos`, `/api/clos`,
 * the mapping tables, the criteria tables) all hang off a programme or a
 * course, and all of them used to answer any signed-in caller with every row
 * in the system. They share one rule:
 *
 *   - a programme id in the query  → check it with `canAccessProgram`
 *   - no id                        → scope the listing to the caller's
 *                                    department instead of returning the lot
 *
 * Returns the fragment to spread into `where`, or an error response.
 */
export async function programScopeFilter(
  request: NextRequest,
  user: TokenPayload,
  programId: number | null,
  /** Path from the queried model to `programs`, e.g. 'peo' for peoplomappings. */
  path?: string
): Promise<{ where: Record<string, unknown> } | { error: NextResponse }> {
  if (programId !== null) {
    if (!(await canAccessProgram(request, user, programId))) {
      return { error: forbiddenResponse() };
    }
    const key = path ? path : null;
    return {
      where: key ? { [key]: { programId } } : { programId },
    };
  }

  const scope = await resolveDepartmentScope(request, user);
  if (scope.error) return { error: scope.error };
  if (!scope.scoped) return { where: {} };

  const departmentFragment = { departmentId: scope.departmentId };
  return {
    where: path
      ? { [path]: { program: departmentFragment } }
      : { program: departmentFragment },
  };
}

/**
 * The same idea resolved through a course rather than a programme, for the
 * endpoints keyed on `courseId` (`/api/clos`, prerequisites, …).
 */
export async function courseScopeFilter(
  request: NextRequest,
  user: TokenPayload,
  courseId: number | null,
  path?: string
): Promise<{ where: Record<string, unknown> } | { error: NextResponse }> {
  if (courseId !== null) {
    if (!(await canAccessCourse(request, user, courseId))) {
      return { error: forbiddenResponse() };
    }
    return { where: path ? { [path]: { courseId } } : { courseId } };
  }

  const scope = await resolveDepartmentScope(request, user);
  if (scope.error) return { error: scope.error };
  if (!scope.scoped) return { where: {} };

  const departmentFragment = { departmentId: scope.departmentId };
  return {
    where: path
      ? { [path]: { course: departmentFragment } }
      : { course: departmentFragment },
  };
}
