import { test, expect } from '@playwright/test';
import { statePath, readSeededIds } from '../support/global-setup';
import { apiGet, apiPost, apiPatch, apiDelete } from '../support/api-helper';
import { ACCOUNTS, testDb } from '../support/fixtures';

/**
 * Privilege escalation and unguarded write endpoints.
 *
 * `access-control.spec.ts` covers the routes that already resolve a role, and
 * `cross-tenant-reads.spec.ts` covers reads that trust the id in the URL. This
 * file covers the remaining gap: handlers that call `requireAuth` and then do
 * nothing else, so *any* signed-in account reaches the write.
 *
 * `proxy.ts` deliberately does not enforce roles on `/api/*` — it only checks
 * that a token is valid — so a route with no role check of its own is open to
 * every account in the system, students included. `src/lib/authz.ts` exists to
 * make that check uniform; these tests fail wherever it was not applied.
 */

const ids = readSeededIds();

test.describe('A student against unguarded write endpoints', () => {
  test.use({ storageState: statePath('student') });

  test.beforeEach(async ({ page }) => {
    await page.goto('/student');
  });

  /**
   * A 404 here means the request cleared authorization and reached the row
   * lookup. A correctly guarded route rejects on the role before it ever asks
   * the database whether the section exists, which is why the assertion is on
   * 403 specifically rather than "not 200".
   */
  test('cannot reach the section delete handler at all', async ({ page }) => {
    const response = await apiDelete(page, '/api/sections?id=999999');

    expect(
      response.status,
      'a student passed authorization and reached the section lookup'
    ).toBe(403);
  });

  test('cannot delete a real section', async ({ page }) => {
    const section = await testDb.sections.create({
      data: {
        name: 'PRIVESC-TARGET',
        courseOfferingId: ids.courseOfferingId,
        facultyId: ids.facultyId,
        batchId: ids.batchId,
        maxStudents: 30,
        sessionType: 'morning',
        status: 'active',
        updatedAt: new Date(),
      },
    });

    try {
      const response = await apiDelete(page, `/api/sections?id=${section.id}`);
      expect(response.status).toBe(403);

      const survivor = await testDb.sections.findUnique({
        where: { id: section.id },
      });
      expect(survivor, 'a student deleted a section').not.toBeNull();
    } finally {
      await testDb.sections.deleteMany({ where: { id: section.id } });
    }
  });

  test('cannot modify semesters', async ({ page }) => {
    const response = await apiPatch(page, '/api/semesters', {
      id: ids.semesterId,
      status: 'completed',
    });

    expect(response.status).toBe(403);
  });

  test('cannot create a PLO on a programme', async ({ page }) => {
    const response = await apiPost(page, `/api/programs/${ids.programId}/plos`, {
      code: 'PLO-PRIVESC',
      description: 'Created by a student',
      status: 'active',
    });

    expect(response.status).toBe(403);
  });

  /**
   * A roster names every classmate with their roll number and email address.
   * `canReadSectionRoster` treats that as a staff view for exactly that reason;
   * the batch equivalent has no such guard.
   */
  test('cannot read the roster of their own batch', async ({ page }) => {
    const response = await apiGet(page, `/api/batches/${ids.batchId}/students`);

    expect(response.status).toBe(403);
    expect(
      JSON.stringify(response.body),
      "another student's email address was returned"
    ).not.toContain(ACCOUNTS.otherStudent.email);
  });
});

test.describe('A faculty member against another department', () => {
  test.use({ storageState: statePath('faculty') });

  let foreign: { departmentId: number; courseId: number; offeringId: number };

  test.beforeAll(async () => {
    const department = await testDb.departments.create({
      data: {
        name: 'Civil Engineering (privesc)',
        code: 'CE-PRIVESC',
        status: 'active',
        updatedAt: new Date(),
      },
    });

    const course = await testDb.courses.create({
      data: {
        name: 'Foreign Structures',
        code: 'CE-PRIVESC-101',
        creditHours: 3,
        theoryHours: 3,
        labHours: 0,
        type: 'THEORY',
        departmentId: department.id,
        status: 'active',
        updatedAt: new Date(),
      },
    });

    const offering = await testDb.courseofferings.create({
      data: {
        courseId: course.id,
        semesterId: ids.semesterId,
        status: 'active',
        updatedAt: new Date(),
      },
    });

    foreign = {
      departmentId: department.id,
      courseId: course.id,
      offeringId: offering.id,
    };
  });

  test.afterAll(async () => {
    await testDb.assessments.deleteMany({
      where: { courseOfferingId: foreign.offeringId },
    });
    await testDb.courseofferings.deleteMany({ where: { id: foreign.offeringId } });
    await testDb.courses.deleteMany({ where: { id: foreign.courseId } });
    await testDb.departments.deleteMany({ where: { id: foreign.departmentId } });
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/faculty');
  });

  /**
   * `courseOfferingId` arrives in the body and is never compared against the
   * offerings this faculty member actually teaches, so a graded assessment can
   * be planted in another department's course.
   */
  test('cannot create an assessment on an offering they do not teach', async ({
    page,
  }) => {
    const response = await apiPost(page, '/api/assessments', {
      title: 'Planted by a foreign lecturer',
      type: 'quiz',
      totalMarks: 10,
      weightage: 5,
      dueDate: new Date(Date.now() + 86_400_000).toISOString(),
      courseOfferingId: foreign.offeringId,
    });

    expect(response.status).toBe(403);

    const planted = await testDb.assessments.count({
      where: { courseOfferingId: foreign.offeringId },
    });
    expect(planted, 'an assessment was created on a foreign offering').toBe(0);
  });
});

test.describe('A department admin creating records elsewhere', () => {
  test.use({ storageState: statePath('admin') });

  let foreignDepartmentId: number;

  test.beforeAll(async () => {
    const department = await testDb.departments.create({
      data: {
        name: 'Physics (privesc)',
        code: 'PHY-PRIVESC',
        status: 'active',
        updatedAt: new Date(),
      },
    });
    foreignDepartmentId = department.id;
  });

  test.afterAll(async () => {
    await testDb.departments.deleteMany({ where: { id: foreignDepartmentId } });
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
  });

  /**
   * `departmentId` is taken from the request body and only checked for
   * existence. The caller's own department is consulted solely as a fallback
   * when the field is absent, so supplying one is enough to write across the
   * tenant boundary.
   */
  test('cannot create a student in another department', async ({ page }) => {
    const email = 'privesc.foreign.student@test.local';

    try {
      // Every other field is valid on purpose: the request must fail on the
      // department it names, not on a schema error that would mask it.
      const response = await apiPost(page, '/api/students', {
        firstName: 'Foreign',
        lastName: 'Student',
        email,
        rollNumber: 'PHY-PRIVESC-001',
        departmentId: foreignDepartmentId,
        programId: ids.programId,
        batchId: ids.batchId,
        status: 'active',
      });

      expect(response.status).toBe(403);

      const created = await testDb.users.count({ where: { email } });
      expect(created, 'a student was created in a foreign department').toBe(0);
    } finally {
      const user = await testDb.users.findUnique({ where: { email } });
      if (user) {
        await testDb.students.deleteMany({ where: { userId: user.id } });
        await testDb.userroles.deleteMany({ where: { userId: user.id } });
        await testDb.users.deleteMany({ where: { id: user.id } });
      }
    }
  });
});

/**
 * Account deletion touches four tables in sequence. Most relations declare no
 * `onDelete`, so Prisma defaults to `Restrict` and a student carrying grades
 * makes the third delete throw — after the first has already committed. Without
 * a transaction that leaves a user row with no role, which `/api/auth/login`
 * reports as "User has no roles assigned": the account is locked out and
 * invisible to role-filtered listings, recoverable only by hand.
 */
test.describe('Account deletion is atomic', () => {
  test.use({ storageState: statePath('superAdmin') });

  test.beforeEach(async ({ page }) => {
    await page.goto('/super-admin');
  });

  /**
   * Built here rather than reused from the fixture: the assertion is about what
   * a *failed* delete leaves behind, so the account has to be disposable. The
   * seeded student is shared with every later spec and a half-deleted one would
   * silently change their results.
   */
  test('a failed delete leaves the account intact, not half-removed', async ({
    page,
  }) => {
    const email = 'privesc.atomic.delete@test.local';
    const studentRole = await testDb.roles.findFirstOrThrow({
      where: { name: 'student' },
    });

    const victim = await testDb.users.create({
      data: {
        email,
        first_name: 'Atomic',
        last_name: 'Victim',
        password_hash: 'x'.repeat(60),
        status: 'active',
        email_verified: true,
        updatedAt: new Date(),
      },
    });

    await testDb.userroles.create({
      data: { userId: victim.id, roleId: studentRole.id },
    });

    // A dependent row whose relation declares no `onDelete`, so the delete
    // sequence throws part-way through — which is the condition under test.
    const student = await testDb.students.create({
      data: {
        userId: victim.id,
        rollNumber: 'ATOMIC-001',
        departmentId: ids.departmentId,
        programId: ids.programId,
        batchId: ids.batchId,
        status: 'active',
        updatedAt: new Date(),
      },
    });

    await testDb.studentsections.create({
      data: {
        studentId: student.id,
        sectionId: ids.sectionId,
        status: 'active',
        updatedAt: new Date(),
      },
    });

    try {
      const response = await apiDelete(page, `/api/users/${victim.id}`);

      const userStillThere = await testDb.users.count({
        where: { id: victim.id },
      });
      const rolesAfter = await testDb.userroles.count({
        where: { userId: victim.id },
      });

      // Either the delete succeeds entirely or it fails entirely. A surviving
      // user row whose role assignment has been stripped is the corrupt state:
      // login answers "User has no roles assigned" and the account is
      // unreachable through the admin UI, which filters by role.
      if (userStillThere > 0) {
        expect(
          rolesAfter,
          `the delete returned ${response.status} but had already stripped the role, locking the account out`
        ).toBe(1);
      } else {
        expect(rolesAfter, 'the user is gone but its role row survived').toBe(0);
      }
    } finally {
      await testDb.studentsections.deleteMany({ where: { studentId: student.id } });
      await testDb.students.deleteMany({ where: { userId: victim.id } });
      await testDb.userroles.deleteMany({ where: { userId: victim.id } });
      await testDb.users.deleteMany({ where: { id: victim.id } });
    }
  });
});
