import { test, expect } from '@playwright/test';
import { statePath, readSeededIds } from '../support/global-setup';
import { apiGet } from '../support/api-helper';

/**
 * Personal data on read paths.
 *
 * `access-control.spec.ts` covers whether a role may perform an *action*.
 * These cover what a role can *see*: a signed-in student holds a valid token,
 * so every route under `/api` is reachable to them and only the route's own
 * checks decide whether another person's record comes back.
 *
 * Student names, roll numbers and email addresses are the records at stake, so
 * each assertion checks the payload rather than just the status code — a 200
 * carrying somebody else's email is the failure being guarded against.
 */

const ids = readSeededIds();

const OTHER_STUDENT_EMAIL = 'e2e.student2@test.local';
const FACULTY_EMAIL = 'e2e.faculty@test.local';

test.describe('A student reading other people', () => {
  test.use({ storageState: statePath('student') });

  test.beforeEach(async ({ page }) => {
    await page.goto('/student');
  });

  test('cannot read another student record', async ({ page }) => {
    const response = await apiGet(page, `/api/students/${ids.otherStudentId}`);

    expect(response.status).toBe(403);
    expect(JSON.stringify(response.body)).not.toContain(OTHER_STUDENT_EMAIL);
  });

  test('cannot list the student directory', async ({ page }) => {
    const response = await apiGet(page, '/api/students');

    expect(response.status).toBe(403);
    expect(
      JSON.stringify(response.body),
      'the directory returned other students'
    ).not.toContain(OTHER_STUDENT_EMAIL);
  });

  test('cannot read a section roster', async ({ page }) => {
    const response = await apiGet(page, `/api/sections/${ids.sectionId}`);

    expect(response.status).toBe(403);
    const body = JSON.stringify(response.body);
    expect(body, 'the roster exposed a classmate').not.toContain('Other Student');
    expect(body, "the roster exposed the faculty member's email").not.toContain(
      FACULTY_EMAIL
    );
  });

  test('cannot read the student list of a section', async ({ page }) => {
    const response = await apiGet(page, `/api/sections/${ids.sectionId}/students`);

    expect(response.status).toBe(403);
    expect(JSON.stringify(response.body)).not.toContain('CS-2026-002');
  });

  test('their own record is still readable', async ({ page }) => {
    // The fix for the above must not lock a student out of themselves.
    const response = await apiGet(page, '/api/student/profile');
    expect(response.status).toBe(200);
  });
});

test.describe('A student reading system configuration', () => {
  test.use({ storageState: statePath('student') });

  test.beforeEach(async ({ page }) => {
    await page.goto('/student');
  });

  test('cannot read system settings', async ({ page }) => {
    // The settings blob carries the SMTP host, username and password used for
    // outbound mail. It is empty under test and populated in production.
    const response = await apiGet(page, '/api/settings');

    expect(response.status).toBe(403);
    expect(
      JSON.stringify(response.body ?? {}),
      'settings exposed the mail credentials'
    ).not.toContain('smtpPassword');
  });

  test('cannot read the faculty directory', async ({ page }) => {
    const response = await apiGet(page, '/api/faculties');
    expect(response.status).toBe(403);
  });
});

test.describe('Denials use the right status', () => {
  test.use({ storageState: statePath('student') });

  test.beforeEach(async ({ page }) => {
    await page.goto('/student');
  });

  // A signed-in user refused for lack of privilege is 403, not 401. Returning
  // 401 tells the client the session expired, and the app's fetch handlers
  // treat that as a reason to bounce the user to /login.
  for (const path of ['/api/transcripts', '/api/obe-reports']) {
    test(`${path} refuses a student with 403 rather than 401`, async ({ page }) => {
      const response = await apiGet(page, path);
      expect(response.status).toBe(403);
    });
  }
});
