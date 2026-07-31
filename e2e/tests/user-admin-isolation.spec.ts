import { test, expect } from '@playwright/test';
import { statePath } from '../support/global-setup';
import { apiGet, apiPost, apiPut, apiDelete } from '../support/api-helper';
import { testDb, TEST_PASSWORD } from '../support/fixtures';
import { hash } from 'bcryptjs';

/**
 * Administering an account that belongs to someone else.
 *
 * `lib/authz.ts` provides `canManageUser` for exactly this: it resolves the
 * target account's department through its faculty or student row and refuses a
 * department admin who does not own it. It is wired into
 * `/api/users/[id]/status` — and nothing else.
 *
 * `tenant-isolation.spec.ts` covers that one route, which is why the gap has
 * stayed invisible. The sibling routes administer the same accounts with the
 * same privileges and check only that the *caller* is an admin, never that the
 * *target* is theirs.
 *
 * Two targets are used:
 *
 *   - a faculty account in a foreign department, which is the tenant boundary
 *   - the seeded super admin, who belongs to no department and is nobody's to
 *     touch
 *
 * The foreign tenant is built and torn down here. Cleanup is tolerant of rows
 * a failing test may already have destroyed.
 */

interface Fixture {
  departmentId: number;
  foreignUserId: number;
  foreignFacultyId: number;
  superAdminUserId: number;
}

let fx: Fixture;

/**
 * Remove the fixture, tolerating rows that are already gone.
 *
 * Playwright re-runs `beforeAll` when a worker restarts, so this also runs up
 * front: a previous run that died mid-way would otherwise leave the department
 * behind and every later run would fail on its unique code rather than on the
 * thing under test.
 */
async function clearFixture() {
  const department = await testDb.departments.findUnique({
    where: { code: 'CE-UADM' },
  });
  const user = await testDb.users.findUnique({
    where: { email: 'uadm.ce.faculty@test.local' },
  });

  if (user) {
    // A test that *fails* leaves side effects behind, because failing here
    // means the request went through: `/reset-password` writes a token row and
    // `/department-admin` points a department at the account. Both are foreign
    // keys onto `users`, so they have to go first or the delete is refused.
    await testDb.passwordresets.deleteMany({ where: { userId: user.id } });
    await testDb.departments.updateMany({
      where: { adminId: user.id },
      data: { adminId: null },
    });
    await testDb.studentsections.deleteMany({
      where: { student: { userId: user.id } },
    });
    await testDb.faculties.deleteMany({ where: { userId: user.id } });
    await testDb.students.deleteMany({ where: { userId: user.id } });
    await testDb.userroles.deleteMany({ where: { userId: user.id } });
    await testDb.users.deleteMany({ where: { id: user.id } });
  }
  if (department) {
    await testDb.faculties.deleteMany({ where: { departmentId: department.id } });
    await testDb.departments.deleteMany({ where: { id: department.id } });
  }
}

test.beforeAll(async () => {
  await clearFixture();

  const passwordHash = await hash(TEST_PASSWORD, 10);
  const facultyRole = await testDb.roles.findFirstOrThrow({
    where: { name: 'faculty' },
  });

  const department = await testDb.departments.create({
    data: {
      name: 'Civil Engineering (foreign-admin)',
      code: 'CE-UADM',
      status: 'active',
      updatedAt: new Date(),
    },
  });

  const user = await testDb.users.create({
    data: {
      email: 'uadm.ce.faculty@test.local',
      username: 'uadm.ce.faculty',
      password_hash: passwordHash,
      first_name: 'Foreign',
      last_name: 'Lecturer',
      status: 'active',
      email_verified: true,
      must_change_password: false,
    },
  });

  await testDb.userroles.create({
    data: { userId: user.id, roleId: facultyRole.id, updatedAt: new Date() },
  });

  const faculty = await testDb.faculties.create({
    data: {
      userId: user.id,
      departmentId: department.id,
      designation: 'Lecturer',
      status: 'active',
      updatedAt: new Date(),
    },
  });

  const superAdmin = await testDb.users.findFirstOrThrow({
    where: { email: 'e2e.superadmin@test.local' },
  });

  fx = {
    departmentId: department.id,
    foreignUserId: user.id,
    foreignFacultyId: faculty.id,
    superAdminUserId: superAdmin.id,
  };
});

test.afterAll(async () => {
  await clearFixture();
});

test.describe('A department admin administering a foreign account', () => {
  test.use({ storageState: statePath('admin') });

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
  });

  test('cannot read a user record from another department', async ({ page }) => {
    const response = await apiGet(page, `/api/users/${fx.foreignUserId}`);
    expect(response.status).toBe(403);
  });

  test('cannot edit a user record from another department', async ({ page }) => {
    const response = await apiPut(page, `/api/users/${fx.foreignUserId}`, {
      first_name: 'Hijacked',
      last_name: 'Lecturer',
      email: 'uadm.ce.faculty@test.local',
      status: 'active',
    });
    expect(response.status).toBe(403);

    const after = await testDb.users.findUnique({
      where: { id: fx.foreignUserId },
    });
    expect(after?.first_name, 'the account was renamed anyway').toBe('Foreign');
  });

  test('cannot delete a user account from another department', async ({ page }) => {
    const response = await apiDelete(page, `/api/users/${fx.foreignUserId}`);
    expect(response.status).toBe(403);

    const survivor = await testDb.users.findUnique({
      where: { id: fx.foreignUserId },
    });
    expect(survivor, 'the account was deleted anyway').not.toBeNull();
  });

  test('cannot reassign the role of a foreign account', async ({ page }) => {
    const response = await apiPost(page, `/api/users/${fx.foreignUserId}/roles`, {
      roles: ['faculty'],
      facultyDetails: { designation: 'Lecturer' },
    });
    expect(response.status).toBe(403);

    // A successful call deletes the faculty row and rebuilds it in the caller's
    // department, which is the damage worth asserting on.
    const faculty = await testDb.faculties.findFirst({
      where: { userId: fx.foreignUserId },
      select: { departmentId: true },
    });
    expect(
      faculty?.departmentId,
      'the account was moved into the calling admin department'
    ).toBe(fx.departmentId);
  });

  test('cannot trigger a password reset for a foreign account', async ({ page }) => {
    const response = await apiPost(
      page,
      `/api/users/${fx.foreignUserId}/reset-password`
    );
    expect(response.status).toBe(403);
  });

  test('cannot make a foreign account an admin of their own department', async ({
    page,
  }) => {
    const response = await apiPost(
      page,
      `/api/users/${fx.foreignUserId}/department-admin`,
      { departmentId: fx.departmentId }
    );
    expect(response.status).toBe(403);
  });
});

test.describe('A department admin administering the super admin', () => {
  test.use({ storageState: statePath('admin') });

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
  });

  /**
   * A super admin has neither a faculty nor a student row, so they belong to no
   * department. `canManageUser` refuses them explicitly for that reason — an
   * account in no department is not a department admin's to touch.
   */
  test('cannot demote the super admin to a student', async ({ page }) => {
    const response = await apiPost(
      page,
      `/api/users/${fx.superAdminUserId}/roles`,
      {
        roles: ['student'],
        studentDetails: {
          rollNumber: 'HIJACK-001',
          departmentId: fx.departmentId,
          programId: 1,
          batchId: 'x',
        },
      }
    );
    expect(response.status).toBe(403);

    const role = await testDb.userroles.findFirst({
      where: { userId: fx.superAdminUserId },
      include: { role: true },
    });
    expect(role?.role?.name, 'the super admin lost their role').toBe('super_admin');
  });

  test('cannot delete the super admin account', async ({ page }) => {
    const response = await apiDelete(page, `/api/users/${fx.superAdminUserId}`);
    expect(response.status).toBe(403);

    const survivor = await testDb.users.findUnique({
      where: { id: fx.superAdminUserId },
    });
    expect(survivor, 'the super admin account was deleted').not.toBeNull();
  });
});
