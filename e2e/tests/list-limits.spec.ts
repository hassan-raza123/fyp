import { test, expect } from '@playwright/test';
import { statePath } from '../support/global-setup';
import { apiGet } from '../support/api-helper';
import { testDb } from '../support/fixtures';

/**
 * Selector lists past the first page.
 *
 * `/api/programs`, `/api/courses`, `/api/semesters`, `/api/sections` and
 * `/api/students` all default to `limit=10`. That is correct for a paged table,
 * but most callers are *selectors* — the programme dropdown on the PLOs screen,
 * the semester dropdown on Reports — which request the endpoint with no limit
 * and render whatever comes back. With more than ten records the eleventh
 * onwards is silently unreachable: no empty state, no "load more", just a
 * dropdown that quietly omits the record the operator is looking for.
 *
 * The rest of the suite seeds well under ten of everything, so it never sees
 * this. These tests push a listing past the boundary and then look for the last
 * record — through the API for the contract, and through the dropdown that the
 * operator actually uses.
 *
 * The extra rows are created here and removed afterwards so the listing specs'
 * row counts are unaffected.
 */

const OVERFLOW = 12; // comfortably past the default page size of 10
const MARKER = 'ZZ-OVERFLOW';

let programIds: number[] = [];

test.beforeAll(async () => {
  const department = await testDb.departments.findFirstOrThrow({
    where: { code: { not: { contains: 'ISO' } } },
  });

  for (let i = 0; i < OVERFLOW; i++) {
    const program = await testDb.programs.create({
      data: {
        // Padded so ordering by name keeps the marker last, whatever the
        // endpoint sorts by.
        name: `${MARKER} Program ${String(i).padStart(2, '0')}`,
        code: `${MARKER}-${String(i).padStart(2, '0')}`,
        duration: 4,
        status: 'active',
        departmentId: department.id,
        totalCreditHours: 130,
        updatedAt: new Date(),
      },
    });
    programIds.push(program.id);
  }
});

test.afterAll(async () => {
  if (programIds.length === 0) return;
  await testDb.programs.deleteMany({ where: { id: { in: programIds } } });
});

test.describe('Listings past the default page size', () => {
  test.use({ storageState: statePath('admin') });

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
  });

  test('the programmes endpoint reports a total larger than one page', async ({
    page,
  }) => {
    const response = await apiGet<{
      data?: unknown[];
      pagination?: { total?: number; totalPages?: number };
    }>(page, '/api/programs');

    expect(response.status).toBe(200);

    // The contract itself is fine — this asserts the caller has something to
    // page with, which is what the dropdowns ignore.
    expect(
      response.body.pagination?.total ?? 0,
      'no pagination total is reported, so a caller cannot know rows were withheld'
    ).toBeGreaterThan(10);
  });

  test('a selector that omits its limit is silently truncated', async ({ page }) => {
    // Exactly the request `/admin/plos`, `/admin/peos` and `/admin/reports`
    // issue to fill their programme dropdown.
    const truncated = await apiGet<{ data?: { code?: string }[] }>(
      page,
      '/api/programs'
    );
    const all = await apiGet<{ data?: { code?: string }[] }>(
      page,
      '/api/programs?limit=1000'
    );

    const truncatedCount = truncated.body.data?.length ?? 0;
    const totalCount = all.body.data?.length ?? 0;

    expect(totalCount, 'the fixture did not create enough rows').toBeGreaterThan(10);
    expect(
      truncatedCount,
      `a limitless request returned ${truncatedCount} of ${totalCount} programmes; ` +
        'every dropdown built from it is missing the remainder'
    ).toBe(totalCount);
  });

  test('the PLOs screen offers every programme in its dropdown', async ({ page }) => {
    await page.goto('/admin/plos');
    await page.waitForLoadState('networkidle').catch(() => {});

    const lastProgram = `${MARKER} Program ${String(OVERFLOW - 1).padStart(2, '0')}`;

    // The dropdown is a Radix combobox on this screen; opening it renders the
    // options into a portal.
    const trigger = page.getByRole('combobox').first();
    await expect(
      trigger,
      'no programme selector was found on /admin/plos'
    ).toBeVisible({ timeout: 20_000 });
    await trigger.click();

    await expect(
      page.getByRole('option', { name: lastProgram }),
      `"${lastProgram}" is not selectable — the dropdown stopped at the first page`
    ).toBeVisible({ timeout: 10_000 });
  });
});
