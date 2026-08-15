import { test, expect } from '@playwright/test';
import { statePath, readSeededIds } from '../support/global-setup';
import { apiGet } from '../support/api-helper';

/**
 * Endpoints the UI calls that did not exist.
 *
 * Both of these were called by a page from the day it was written, and both
 * 404ed silently:
 *
 *   - `/api/courses/[id]/llos/plo-mappings` — the LLO-PLO panel on
 *     `faculty/results/llo-attainments` catches the failure and only writes to
 *     the console, so it rendered "No LLO-PLO mappings found" for ever,
 *     whatever the mappings actually were.
 *   - `/api/departments/[id]/programs` — the programme dropdown on
 *     `faculty/students/[id]` showed a "Failed to fetch programs" toast, so the
 *     field could never be filled and the form could not be submitted.
 *
 * A page that swallows a 404 looks exactly like a page with no data. These
 * assert the endpoints answer, so the next one cannot rot unnoticed.
 */

const ids = readSeededIds();

/**
 * Read as the department admin rather than the faculty member: LLOs belong to
 * the seeded *lab* course, and the fixture's only section is on the theory
 * offering, so the faculty account legitimately has no access to it. A 403
 * there is the authorization working, not the endpoint failing.
 */
test.describe('Endpoints the UI depends on', () => {
  test.use({ storageState: statePath('admin') });

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
  });

  test('the LLO-PLO mapping endpoint answers', async ({ page }) => {
    const response = await apiGet<{ success: boolean; data: unknown[] }>(
      page,
      `/api/courses/${ids.labCourseId}/llos/plo-mappings`
    );

    expect(
      response.status,
      'the LLO-PLO panel has been calling a route that does not exist'
    ).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('the LLO-PLO mapping endpoint returns one entry per LLO', async ({
    page,
  }) => {
    const response = await apiGet<{
      data: Array<{ llo: { id: number; code: string }; plos: unknown[] }>;
    }>(page, `/api/courses/${ids.labCourseId}/llos/plo-mappings`);

    expect(response.status).toBe(200);
    expect(
      response.body.data.length,
      'the seeded lab course has LLOs, so the panel should have rows'
    ).toBeGreaterThan(0);

    for (const row of response.body.data) {
      expect(row.llo.code, 'each row names its LLO').toBeTruthy();
      expect(Array.isArray(row.plos)).toBe(true);
    }
  });
});

test.describe('Department programmes', () => {
  test.use({ storageState: statePath('admin') });

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
  });

  test('the department programmes endpoint answers', async ({ page }) => {
    const response = await apiGet<{ success: boolean; data: unknown[] }>(
      page,
      `/api/departments/${ids.departmentId}/programs`
    );

    expect(
      response.status,
      'the programme dropdown has been calling a route that does not exist'
    ).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  test('another department is refused', async ({ page }) => {
    // A department admin is scoped to their own department, the same rule the
    // rest of the system applies.
    const response = await apiGet(page, `/api/departments/999999/programs`);
    expect(response.status).toBe(403);
  });
});
