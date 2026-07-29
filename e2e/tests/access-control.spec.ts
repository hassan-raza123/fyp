import { test, expect } from '@playwright/test';
import { statePath, readSeededIds } from '../support/global-setup';
import { apiGet, apiDelete, apiPut } from '../support/api-helper';

/**
 * Role boundaries.
 *
 * `proxy.ts` only checks that a request carries a valid token — it does not
 * enforce roles or ownership on /api/*. Every route has to do that itself, and
 * several once did not: a student could read any student's marks, delete a CLO,
 * or rewrite an assessment item. These are the guards against that returning.
 */

const ids = readSeededIds();

test.describe('A student', () => {
  test.use({ storageState: statePath('student') });

  test.beforeEach(async ({ page }) => {
    await page.goto('/student');
  });

  test('cannot read another student results', async ({ page }) => {
    const own = await apiGet(page, `/api/students/${ids.studentId}/results?sectionId=${ids.sectionId}`);
    expect(own.status, 'their own record is fine').toBe(200);

    const other = await apiGet(
      page,
      `/api/students/${ids.otherStudentId}/results?sectionId=${ids.sectionId}`
    );
    expect(other.status, "another student's is not").toBe(403);
  });

  test('cannot read the whole section marks table', async ({ page }) => {
    const response = await apiGet(
      page,
      `/api/sections/${ids.sectionId}/assessment-results`
    );
    expect(response.status).toBe(403);
  });

  test('cannot read staff marks listings', async ({ page }) => {
    const response = await apiGet(
      page,
      `/api/assessment-results?sectionId=${ids.sectionId}`
    );
    expect(response.status).toBe(403);
  });

  test('cannot delete a CLO', async ({ page }) => {
    const response = await apiDelete(page, `/api/clos/${ids.cloIds[0]}`);
    expect(response.status).toBe(403);
  });

  test('cannot rewrite an assessment item', async ({ page }) => {
    const response = await apiPut(
      page,
      `/api/assessments/${ids.assessmentId}/items/${ids.assessmentItemIds[0]}`,
      { questionNo: 'Q1', marks: 999, cloId: ids.cloIds[0] }
    );
    expect(response.status).toBe(403);
  });

  test('cannot delete an assessment', async ({ page }) => {
    const response = await apiDelete(page, `/api/assessments/${ids.assessmentId}`);
    expect(response.status).toBe(403);
  });

  test('cannot reach an admin page', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).not.toHaveURL(/\/admin(\/|$)/);
  });

  test('can reach their own dashboard', async ({ page }) => {
    await page.goto('/student');
    await expect(page).toHaveURL(/\/student/);
  });
});

test.describe('A faculty member', () => {
  test.use({ storageState: statePath('faculty') });

  test.beforeEach(async ({ page }) => {
    await page.goto('/faculty');
  });

  test('can read a section they teach', async ({ page }) => {
    const response = await apiGet(page, `/api/sections/${ids.sectionId}/assessments`);
    expect(response.status).toBe(200);
  });

  test('cannot reach an admin page', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).not.toHaveURL(/\/admin(\/|$)/);
  });

  test('cannot reach a super admin page', async ({ page }) => {
    await page.goto('/super-admin');
    await expect(page).not.toHaveURL(/\/super-admin(\/|$)/);
  });
});

test.describe('A department admin', () => {
  test.use({ storageState: statePath('admin') });

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
  });

  test('can read their own department data', async ({ page }) => {
    const programs = await apiGet<{ data?: unknown[] }>(page, '/api/programs');
    expect(programs.status).toBe(200);
  });

  test('cannot reach a super admin page', async ({ page }) => {
    await page.goto('/super-admin');
    await expect(page).not.toHaveURL(/\/super-admin(\/|$)/);
  });
});

test.describe('A super admin', () => {
  test.use({ storageState: statePath('superAdmin') });

  test.beforeEach(async ({ page }) => {
    await page.goto('/super-admin');
  });

  // Regression guard: super_admin was missing from several role lists and was
  // rejected by department scoping, which locked the highest-privilege role out
  // of most of the system.
  const endpoints = [
    '/api/programs',
    '/api/departments',
    '/api/courses',
    '/api/faculties',
    '/api/students',
    '/api/course-offerings',
    '/api/llos',
    '/api/transcripts',
    '/api/obe-reports',
    '/api/action-plans',
  ];

  for (const endpoint of endpoints) {
    test(`can read ${endpoint}`, async ({ page }) => {
      const response = await apiGet(page, endpoint);
      expect(response.status, `${endpoint} returned ${response.status}`).toBe(200);
    });
  }

  test('is not blocked by department scoping', async ({ page }) => {
    // A super admin belongs to no department; that must not read as "no access"
    const response = await apiGet<{ error?: string }>(page, '/api/programs');
    expect(response.status).toBe(200);
    expect(JSON.stringify(response.body)).not.toMatch(/department not assigned/i);
  });
});

test.describe('Anonymous visitors', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  const protectedApis = [
    '/api/programs',
    '/api/students',
    '/api/courses',
    `/api/sections/${ids.sectionId}/assessment-results`,
  ];

  for (const endpoint of protectedApis) {
    test(`are rejected from ${endpoint}`, async ({ request, baseURL }) => {
      const response = await request.get(`${baseURL}${endpoint}`);
      expect(response.status()).toBe(401);
    });
  }

  test('the test-only OTP endpoint needs an email', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/api/e2e/otp`);
    expect(response.status()).toBe(400);
  });
});
