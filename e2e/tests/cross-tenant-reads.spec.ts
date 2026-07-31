import { test, expect } from '@playwright/test';
import { statePath } from '../support/global-setup';
import { apiGet } from '../support/api-helper';
import { testDb } from '../support/fixtures';

/**
 * Read-only cross-tenant access.
 *
 * `tenant-isolation.spec.ts` covers the single-object routes that already
 * resolve ownership (`/api/students/[id]`, `/api/programs/[id]`, …). This file
 * covers the read endpoints that were never given an ownership check at all:
 * they call `requireAuth` and then trust whatever id arrives in the URL or the
 * query string.
 *
 * Two callers are exercised for each, because they fail differently:
 *
 *   - a *department admin* reaching into another department, which is the
 *     tenant boundary the rest of the suite defends
 *   - a *student*, who should not reach programme-level configuration or
 *     accreditation figures for anyone, their own programme included
 *
 * The foreign tenant is built here and torn down afterwards, matching
 * `tenant-isolation.spec.ts` — leaving one behind changes the row counts the
 * listing specs assert on.
 */

interface ForeignTenant {
  departmentId: number;
  programId: number;
  courseId: number;
  batchId: string;
  offeringId: number;
  sectionId: number;
  ploId: number;
  semesterId: number;
}

let foreign: ForeignTenant;

test.beforeAll(async () => {
  const semester = await testDb.semesters.findFirstOrThrow();

  const department = await testDb.departments.create({
    data: {
      name: 'Mechanical Engineering (foreign-read)',
      code: 'ME-XREAD',
      status: 'active',
      updatedAt: new Date(),
    },
  });

  const program = await testDb.programs.create({
    data: {
      name: 'BS Mechanical Engineering',
      code: 'BSME-XREAD',
      duration: 4,
      status: 'active',
      departmentId: department.id,
      totalCreditHours: 132,
      updatedAt: new Date(),
    },
  });

  const course = await testDb.courses.create({
    data: {
      code: 'ME101-XREAD',
      name: 'Thermodynamics',
      creditHours: 3,
      theoryHours: 3,
      labHours: 0,
      type: 'THEORY',
      status: 'active',
      departmentId: department.id,
      updatedAt: new Date(),
    },
  });

  const batch = await testDb.batches.create({
    data: {
      name: 'ME Batch 2026',
      code: 'MEB-XREAD',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2030-06-30'),
      maxStudents: 60,
      status: 'active',
      programId: program.id,
      updatedAt: new Date(),
    },
  });

  const offering = await testDb.courseofferings.create({
    data: {
      courseId: course.id,
      semesterId: semester.id,
      status: 'active',
      updatedAt: new Date(),
    },
  });

  const section = await testDb.sections.create({
    data: {
      name: 'ME-A',
      courseOfferingId: offering.id,
      batchId: batch.id,
      maxStudents: 40,
      status: 'active',
      updatedAt: new Date(),
    },
  });

  const plo = await testDb.plos.create({
    data: {
      code: 'PLO1-XREAD',
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
    offeringId: offering.id,
    sectionId: section.id,
    ploId: plo.id,
    semesterId: semester.id,
  };
});

test.afterAll(async () => {
  if (!foreign) return;
  // Children before parents
  await testDb.ploattainments.deleteMany({ where: { programId: foreign.programId } });
  await testDb.plos.deleteMany({ where: { programId: foreign.programId } });
  await testDb.sections.deleteMany({ where: { id: foreign.sectionId } });
  await testDb.courseofferings.deleteMany({ where: { id: foreign.offeringId } });
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

  test('cannot list the PLOs of another department programme', async ({ page }) => {
    const response = await apiGet(page, `/api/plos?programId=${foreign.programId}`);

    expect(response.status).toBe(403);
    expect(
      JSON.stringify(response.body),
      'the foreign PLO was returned in the body'
    ).not.toContain('XREAD');
  });

  test('cannot read the PLO attainment trend of another programme', async ({ page }) => {
    const response = await apiGet(
      page,
      `/api/ploattainments/trends?programId=${foreign.programId}`
    );
    expect(response.status).toBe(403);
  });

  test('cannot list the batches of another department programme', async ({ page }) => {
    const response = await apiGet(page, `/api/programs/${foreign.programId}/batches`);

    expect(response.status).toBe(403);
    expect(
      JSON.stringify(response.body),
      'the foreign batch was returned in the body'
    ).not.toContain('XREAD');
  });

  test('cannot list the sections of another department batch', async ({ page }) => {
    const response = await apiGet(page, `/api/batches/${foreign.batchId}/sections`);
    expect(response.status).toBe(403);
  });

  test('cannot read a course offering from another department', async ({ page }) => {
    const response = await apiGet(page, `/api/courses/offerings/${foreign.offeringId}`);
    expect(response.status).toBe(403);
  });
});

test.describe('A student reading programme configuration', () => {
  test.use({ storageState: statePath('student') });

  test.beforeEach(async ({ page }) => {
    await page.goto('/student');
  });

  /**
   * A student reads their *own* attainment through `/api/student/plo-attainments`,
   * which resolves the student from the session. The programme-wide endpoints
   * below are staff views: they describe the cohort, not the caller.
   */
  test('cannot enumerate every PLO in the system', async ({ page }) => {
    const response = await apiGet(page, '/api/plos');

    expect(
      response.status,
      'an unscoped PLO listing is readable by any signed-in student'
    ).toBe(403);
  });

  test('cannot read another programme PLOs by id', async ({ page }) => {
    const response = await apiGet(page, `/api/plos?programId=${foreign.programId}`);
    expect(response.status).toBe(403);
  });

  test('cannot read programme-wide PLO attainment trends', async ({ page }) => {
    const response = await apiGet(
      page,
      `/api/ploattainments/trends?programId=${foreign.programId}`
    );
    expect(response.status).toBe(403);
  });

  test('cannot list the batches of a programme', async ({ page }) => {
    const response = await apiGet(page, `/api/programs/${foreign.programId}/batches`);
    expect(response.status).toBe(403);
  });

  test('cannot list the sections of a batch they are not in', async ({ page }) => {
    const response = await apiGet(page, `/api/batches/${foreign.batchId}/sections`);
    expect(response.status).toBe(403);
  });

  test('cannot read a course offering they are not enrolled in', async ({ page }) => {
    const response = await apiGet(page, `/api/courses/offerings/${foreign.offeringId}`);
    expect(response.status).toBe(403);
  });
});
