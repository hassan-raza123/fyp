import { test, expect, type Page } from '@playwright/test';
import { statePath, readSeededIds } from '../support/global-setup';

/**
 * Page smoke tests.
 *
 * Every page in the app, loaded as the role that owns it, checked for the
 * things that indicate a broken render: a Next.js error overlay, an unhandled
 * client exception, or a server 500. This is deliberately shallow — it is a net
 * for crashes, not a check of behaviour.
 */

/** Fail the test on a page error or a 5xx from the app's own routes. */
function watchForFailures(page: Page, failures: string[]) {
  page.on('pageerror', (error) => {
    failures.push(`Uncaught exception: ${error.message}`);
  });

  page.on('response', (response) => {
    const url = new URL(response.url());
    if (
      response.status() >= 500 &&
      url.origin === new URL(page.url() || 'http://127.0.0.1').origin
    ) {
      failures.push(`${response.status()} from ${url.pathname}`);
    }
  });
}

async function visit(page: Page, path: string) {
  const failures: string[] = [];
  watchForFailures(page, failures);

  const response = await page.goto(path, { waitUntil: 'domcontentloaded' });

  expect(response?.status(), `${path} responded ${response?.status()}`).toBeLessThan(500);

  // The dev overlay does not exist in a production build, but a rendered error
  // boundary does — catch the standard Next.js error text.
  const crashed = page.getByText(/application error|something went wrong|unhandled runtime/i);
  await expect(crashed, `${path} rendered an error boundary`).toHaveCount(0);

  // Give client-side data fetching a moment to fail loudly if it is going to
  await page.waitForTimeout(700);

  expect(failures, `${path}:\n  ${failures.join('\n  ')}`).toHaveLength(0);
}

const ids = readSeededIds();

type SmokeRole = 'student' | 'faculty' | 'admin' | 'superAdmin';

const PAGES: Record<SmokeRole, string[]> = {
  student: [
    '/student',
    '/student/courses',
    '/student/assessments',
    '/student/results',
    '/student/results/clo-attainments',
    '/student/results/llo-attainments',
    '/student/results/plo-attainments',
    '/student/analytics',
    '/student/transcript',
    '/student/calendar',
    '/student/notifications',
    '/student/messages',
    '/student/surveys',
    '/student/settings',
    // Detail pages, using seeded records
    `/student/courses/${ids.theoryCourseId}`,
    `/student/courses/${ids.theoryCourseId}/clos`,
    `/student/courses/${ids.theoryCourseId}/analytics`,
    `/student/courses/${ids.theoryCourseId}/offerings`,
    `/student/assessments/${ids.assessmentId}`,
    `/student/assessments/${ids.assessmentId}/items`,
  ],
  faculty: [
    '/faculty',
    '/faculty/courses',
    '/faculty/sections',
    '/faculty/students',
    '/faculty/assessments',
    '/faculty/analytics',
    '/faculty/results',
    '/faculty/results/marks-entry',
    '/faculty/results/clo-attainments',
    '/faculty/results/llo-attainments',
    '/faculty/results/plo-attainments',
    '/faculty/results/grade-management',
    '/faculty/results/result-evaluation',
    '/faculty/results/result-sheet',
    '/faculty/results/academic-records',
    '/faculty/results/analytics',
    '/faculty/surveys',
    '/faculty/notifications',
    '/faculty/settings',
    `/faculty/courses/${ids.theoryCourseId}`,
    `/faculty/courses/${ids.theoryCourseId}/clos`,
    `/faculty/courses/${ids.theoryCourseId}/analytics`,
    `/faculty/courses/${ids.theoryCourseId}/offerings`,
    `/faculty/sections/${ids.sectionId}`,
    `/faculty/students/${ids.studentId}`,
    `/faculty/assessments/${ids.assessmentId}`,
    `/faculty/assessments/${ids.assessmentId}/items`,
    `/faculty/assessments/${ids.assessmentId}/analytics`,
  ],
  admin: [
    '/admin',
    '/admin/programs',
    '/admin/courses',
    '/admin/curriculum',
    '/admin/course-offerings',
    '/admin/semesters',
    '/admin/batches',
    '/admin/sections',
    '/admin/students',
    '/admin/faculty',
    '/admin/admins',
    '/admin/clos',
    '/admin/llos',
    '/admin/plos',
    '/admin/peos',
    '/admin/clo-plo-mappings',
    '/admin/llo-plo-mappings',
    '/admin/peo-plo-mappings',
    '/admin/assessments',
    '/admin/pass-fail-criteria',
    '/admin/action-plans',
    '/admin/surveys',
    '/admin/reports',
    '/admin/transcripts',
    '/admin/notifications',
    '/admin/settings',
    '/admin/results',
    '/admin/results/marks-entry',
    '/admin/results/clo-attainments',
    '/admin/results/llo-attainments',
    '/admin/results/plo-attainments',
    '/admin/results/peo-attainments',
    '/admin/results/plo-coverage-matrix',
    '/admin/results/bloom-analysis',
    '/admin/results/graduation',
    '/admin/results/graduation-criteria',
    '/admin/results/academic-records',
    '/admin/results/analytics',
    '/admin/results/result-evaluation',
    '/admin/students/bulk-import',
    `/admin/courses/${ids.theoryCourseId}/clos`,
    `/admin/programs/${ids.programId}/plos`,
    `/admin/batches/${ids.batchId}/students`,
    `/admin/assessments/${ids.assessmentId}`,
    `/admin/assessments/${ids.assessmentId}/edit`,
    `/admin/assessments/${ids.assessmentId}/items`,
  ],
  superAdmin: [
    '/super-admin',
    '/super-admin/departments',
    '/super-admin/admins',
    '/super-admin/super-admins',
    '/super-admin/profile',
  ],
};

for (const [role, paths] of Object.entries(PAGES) as [SmokeRole, string[]][]) {
  test.describe(`${role} pages`, () => {
    test.use({ storageState: statePath(role) });

    for (const path of paths) {
      test(`${path} renders`, async ({ page }) => {
        await visit(page, path);
      });
    }
  });
}

test.describe('public pages', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const path of ['/', '/login', '/forgot-password', '/reset-password', '/verify-otp']) {
    test(`${path} renders`, async ({ page }) => {
      await visit(page, path);
    });
  }
});
