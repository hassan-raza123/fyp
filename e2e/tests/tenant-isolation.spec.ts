import { test, expect } from '@playwright/test';
import { statePath } from '../support/global-setup';
import { apiGet, apiPut, apiPatch, apiDelete } from '../support/api-helper';
import { testDb } from '../support/fixtures';
import { hash } from 'bcryptjs';
import { TEST_PASSWORD } from '../support/fixtures';

/**
 * Department isolation.
 *
 * An `admin` is a *department* admin, not a system admin — the seeded one runs
 * Computer Science. Nothing belonging to another department should be readable
 * or writable by them.
 *
 * The shared fixture seeds a single department, so a second one is built here
 * and torn down afterwards. That is deliberate: these are the only tests that
 * need a foreign tenant, and leaving one behind would change the row counts the
 * listing specs assert on.
 *
 * List endpoints already filter by department. The single-object routes
 * (`/api/<thing>/[id]`) resolve the row straight from the URL id and never
 * compare its department to the caller's, which is what these cover.
 */

interface ForeignTenant {
  departmentId: number;
  programId: number;
  courseId: number;
  batchId: string;
  studentId: number;
  userId: number;
  ploId: number;
  semesterId: number;
}

let foreign: ForeignTenant;

test.beforeAll(async () => {
  const passwordHash = await hash(TEST_PASSWORD, 10);
  const studentRole = await testDb.roles.findFirstOrThrow({
    where: { name: 'student' },
  });

  const department = await testDb.departments.create({
    data: {
      name: 'Electrical Engineering (foreign)',
      code: 'EE-ISO',
      status: 'active',
      updatedAt: new Date(),
    },
  });

  const program = await testDb.programs.create({
    data: {
      name: 'BS Electrical Engineering',
      code: 'BSEE-ISO',
      duration: 4,
      status: 'active',
      departmentId: department.id,
      totalCreditHours: 130,
      updatedAt: new Date(),
    },
  });

  const course = await testDb.courses.create({
    data: {
      code: 'EE101-ISO',
      name: 'Circuit Analysis',
      creditHours: 3,
      theoryHours: 3,
      labHours: 0,
      type: 'THEORY',
      status: 'active',
      departmentId: department.id,
      updatedAt: new Date(),
    },
  });

  const semester = await testDb.semesters.findFirstOrThrow();

  const batch = await testDb.batches.create({
    data: {
      name: 'EE Batch 2026',
      code: 'EEB-ISO',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2030-06-30'),
      maxStudents: 60,
      status: 'active',
      programId: program.id,
      updatedAt: new Date(),
    },
  });

  const user = await testDb.users.create({
    data: {
      email: 'iso.ee.student@test.local',
      username: 'iso.ee.student',
      password_hash: passwordHash,
      first_name: 'Foreign',
      last_name: 'Student',
      status: 'active',
      email_verified: true,
      must_change_password: false,
    },
  });
  await testDb.userroles.create({
    data: { userId: user.id, roleId: studentRole.id, updatedAt: new Date() },
  });

  const student = await testDb.students.create({
    data: {
      userId: user.id,
      rollNumber: 'EE-ISO-001',
      departmentId: department.id,
      programId: program.id,
      batchId: batch.id,
      status: 'active',
      updatedAt: new Date(),
    },
  });

  const plo = await testDb.plos.create({
    data: {
      code: 'PLO1-ISO',
      description: 'Foreign programme outcome',
      programId: program.id,
      bloomLevel: 'Apply',
      bloomDomain: 'Cognitive',
      status: 'active',
      updatedAt: new Date(),
    },
  });

  foreign = {
    departmentId: department.id,
    programId: program.id,
    courseId: course.id,
    batchId: batch.id,
    studentId: student.id,
    userId: user.id,
    ploId: plo.id,
    semesterId: semester.id,
  };
});

test.afterAll(async () => {
  if (!foreign) return;
  // Children before parents
  await testDb.plos.deleteMany({ where: { programId: foreign.programId } });
  await testDb.students.deleteMany({ where: { departmentId: foreign.departmentId } });
  await testDb.userroles.deleteMany({ where: { userId: foreign.userId } });
  await testDb.users.deleteMany({ where: { id: foreign.userId } });
  await testDb.batches.deleteMany({ where: { programId: foreign.programId } });
  await testDb.courses.deleteMany({ where: { departmentId: foreign.departmentId } });
  await testDb.programs.deleteMany({ where: { id: foreign.programId } });
  await testDb.departments.deleteMany({ where: { id: foreign.departmentId } });
});

test.describe('A department admin reading another department', () => {
  test.use({ storageState: statePath('admin') });

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
  });

  test('cannot read a student from another department', async ({ page }) => {
    const response = await apiGet(page, `/api/students/${foreign.studentId}`);
    expect(response.status).toBe(403);
  });

  test('cannot read a program from another department', async ({ page }) => {
    const response = await apiGet(page, `/api/programs/${foreign.programId}`);
    expect(response.status).toBe(403);
  });

  test('cannot read a course from another department', async ({ page }) => {
    const response = await apiGet(page, `/api/courses/${foreign.courseId}`);
    expect(response.status).toBe(403);
  });

  test('cannot read a batch from another department', async ({ page }) => {
    const response = await apiGet(page, `/api/batches/${foreign.batchId}`);
    expect(response.status).toBe(403);
  });

  test('cannot read another department statistics', async ({ page }) => {
    const response = await apiGet(
      page,
      `/api/programs/${foreign.programId}/statistics`
    );
    expect(response.status).toBe(403);
  });

  test('listing endpoints stay scoped to their own department', async ({ page }) => {
    // These already filter correctly — the guard is that they keep doing so.
    for (const path of ['/api/students', '/api/courses', '/api/programs']) {
      const response = await apiGet(page, path);
      expect(response.status, path).toBe(200);
      expect(JSON.stringify(response.body), `${path} leaked foreign rows`).not.toContain('ISO');
    }
  });
});

test.describe('A department admin writing to another department', () => {
  test.use({ storageState: statePath('admin') });

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
  });

  test('cannot rename another department program', async ({ page }) => {
    const response = await apiPut(page, `/api/programs/${foreign.programId}`, {
      name: 'Renamed by a foreign admin',
      code: 'BSEE-ISO',
      duration: 4,
      departmentId: foreign.departmentId,
      totalCreditHours: 130,
    });
    expect(response.status).toBe(403);

    const after = await testDb.programs.findUnique({
      where: { id: foreign.programId },
    });
    expect(after?.name, 'the programme was renamed anyway').toBe(
      'BS Electrical Engineering'
    );
  });

  test('cannot delete a PLO belonging to another department', async ({ page }) => {
    const response = await apiDelete(
      page,
      `/api/programs/${foreign.programId}/plos/${foreign.ploId}`
    );
    expect(response.status).toBe(403);

    const survivor = await testDb.plos.findUnique({ where: { id: foreign.ploId } });
    expect(survivor, 'the PLO was deleted anyway').not.toBeNull();
  });

  test('cannot disable a user account in another department', async ({ page }) => {
    const response = await apiPatch(page, `/api/users/${foreign.userId}/status`, {
      status: 'inactive',
    });
    expect(response.status).toBe(403);

    const after = await testDb.users.findUnique({ where: { id: foreign.userId } });
    expect(after?.status, 'the account was disabled anyway').toBe('active');
  });

  test('cannot edit a student in another department', async ({ page }) => {
    // A complete, schema-valid payload, so the request is turned away by the
    // department check rather than by field validation.
    const response = await apiPut(page, `/api/students/${foreign.studentId}`, {
      firstName: 'Foreign',
      lastName: 'Student',
      email: 'iso.ee.student@test.local',
      rollNumber: 'HIJACKED-001',
      batchId: foreign.batchId,
      departmentId: foreign.departmentId,
      programId: foreign.programId,
      status: 'inactive',
    });
    expect(response.status).toBe(403);

    const after = await testDb.students.findUnique({
      where: { id: foreign.studentId },
    });
    expect(after?.rollNumber, 'the record was edited anyway').toBe('EE-ISO-001');
  });
});
