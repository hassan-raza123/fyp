import { test, expect, type ConsoleMessage, type Request } from '@playwright/test';
import { statePath } from '../support/global-setup';

/**
 * Runtime health of every dashboard page.
 *
 * `smoke.spec.ts` proves each page *renders*. That is a weaker claim than it
 * looks: a page whose data call 404s still renders — it just renders empty, and
 * the two are indistinguishable from the outside. That is exactly how
 * `/api/courses/[id]/llos/plo-mappings` stayed missing for as long as it did.
 *
 * This asserts the stronger property: opening the page produces no console
 * error and no failed same-origin request. It is the check that would have
 * caught that missing endpoint on the day it was written.
 */

type Role = 'admin' | 'faculty' | 'student' | 'superAdmin';

const PAGES: Record<Role, string[]> = {
  admin: [
    '/admin',
    '/admin/programs',
    '/admin/courses',
    '/admin/students',
    '/admin/faculty',
    '/admin/batches',
    '/admin/sections',
    '/admin/semesters',
    '/admin/peos',
    '/admin/plos',
    '/admin/clos',
    '/admin/llos',
    '/admin/clo-plo-mappings',
    '/admin/llo-plo-mappings',
    '/admin/peo-plo-mappings',
    '/admin/curriculum',
    '/admin/course-offerings',
    '/admin/assessments',
    '/admin/attendance',
    '/admin/surveys',
    '/admin/reports',
    '/admin/transcripts',
    '/admin/action-plans',
    '/admin/pass-fail-criteria',
    '/admin/notifications',
    '/admin/settings',
    '/admin/profile',
    '/admin/results',
    '/admin/results/clo-attainments',
    '/admin/results/llo-attainments',
    '/admin/results/plo-attainments',
    '/admin/results/peo-attainments',
    '/admin/results/graduation',
    '/admin/results/graduation-criteria',
    '/admin/results/academic-records',
    '/admin/results/analytics',
    '/admin/results/bloom-analysis',
    '/admin/results/plo-coverage-matrix',
    '/admin/results/marks-entry',
    '/admin/results/result-evaluation',
  ],
  faculty: [
    '/faculty',
    '/faculty/courses',
    '/faculty/sections',
    '/faculty/students',
    '/faculty/assessments',
    '/faculty/attendance',
    '/faculty/analytics',
    '/faculty/surveys',
    '/faculty/notifications',
    '/faculty/settings',
    '/faculty/profile',
    '/faculty/results',
    '/faculty/results/clo-attainments',
    '/faculty/results/llo-attainments',
    '/faculty/results/plo-attainments',
    '/faculty/results/marks-entry',
    '/faculty/results/grade-management',
    '/faculty/results/result-evaluation',
    '/faculty/results/result-sheet',
    '/faculty/results/academic-records',
    '/faculty/results/analytics',
  ],
  student: [
    '/student',
    '/student/courses',
    '/student/assessments',
    '/student/attendance',
    '/student/analytics',
    '/student/calendar',
    '/student/messages',
    '/student/notifications',
    '/student/transcript',
    '/student/surveys',
    '/student/settings',
    '/student/profile',
    '/student/results',
    '/student/results/clo-attainments',
    '/student/results/llo-attainments',
    '/student/results/plo-attainments',
  ],
  superAdmin: [
    '/super-admin',
    '/super-admin/departments',
    '/super-admin/admins',
    '/super-admin/super-admins',
    '/super-admin/profile',
  ],
};

/**
 * Noise that is not the application's fault, so matching it would only teach
 * the suite to ignore real failures.
 */
function isIgnorable(text: string): boolean {
  return (
    // React DevTools nag, favicon, and third-party font warnings
    /Download the React DevTools|favicon|Failed to load resource: net::ERR_/i.test(
      text
    ) ||
    // Next's dev-only hydration hints do not appear in a production build, but
    // guard anyway so a local run does not produce a different verdict.
    /Warning: Extra attributes from the server/i.test(text)
  );
}

for (const [role, paths] of Object.entries(PAGES) as [Role, string[]][]) {
  test.describe(`${role} pages are runtime-clean`, () => {
    test.use({ storageState: statePath(role) });

    for (const path of paths) {
      test(`${path} loads without console errors or failed requests`, async ({
        page,
        baseURL,
      }) => {
        const consoleErrors: string[] = [];
        const failedRequests: string[] = [];

        page.on('console', (message: ConsoleMessage) => {
          if (message.type() !== 'error') return;
          const text = message.text();
          if (!isIgnorable(text)) consoleErrors.push(text);
        });

        page.on('requestfailed', (request: Request) => {
          const url = request.url();
          if (!url.startsWith(baseURL!)) return;

          // Next prefetches the React payload for links in view (`?_rsc=`) and
          // aborts those requests as soon as the page navigates away. An
          // aborted prefetch is the router working, not a failure.
          if (url.includes('_rsc=')) return;

          failedRequests.push(`${request.method()} ${url}`);
        });

        // A same-origin API call answering 4xx/5xx is the signal that matters:
        // the page will still render, just without its data.
        const badResponses: string[] = [];
        page.on('response', (response) => {
          const url = response.url();
          if (!url.startsWith(`${baseURL}/api/`)) return;
          if (response.status() >= 400) {
            badResponses.push(`${response.status()} ${url.replace(baseURL!, '')}`);
          }
        });

        await page.goto(path);
        await page.waitForLoadState('networkidle').catch(() => {});

        expect(
          badResponses,
          `${path} made API calls that failed:\n  ${badResponses.join('\n  ')}`
        ).toEqual([]);

        expect(
          consoleErrors,
          `${path} logged console errors:\n  ${consoleErrors.join('\n  ')}`
        ).toEqual([]);

        expect(
          failedRequests,
          `${path} had requests that never completed:\n  ${failedRequests.join('\n  ')}`
        ).toEqual([]);
      });
    }
  });
}
