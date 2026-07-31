import { test, expect, type Page } from '@playwright/test';
import { testDb } from '../support/fixtures';
import { statePath } from '../support/global-setup';

/**
 * Editing and removing records through the interface.
 *
 * `ui-crud.spec.ts` covers create. Update and delete were never driven from the
 * UI at all: the API side is only ever asserted as a 403 for the wrong role, so
 * the edit dialog and the delete confirmation — the two places an operator can
 * destroy data — had no coverage.
 *
 * Each test seeds its own row and removes whatever survives, so the listing
 * specs' row counts are untouched and a failure part-way through does not leave
 * the database dirty.
 */

test.use({ storageState: statePath('admin') });

/** The row in the listing table containing `text`. */
function rowFor(page: Page, text: string) {
  return page.getByRole('row').filter({ hasText: text }).first();
}

/**
 * Click a row action.
 *
 * The row actions are icon-only buttons with no accessible name, so they cannot
 * be found by role and name. They are positioned instead: the trailing buttons
 * of the row, in render order — view, edit, delete.
 */
async function clickRowAction(
  page: Page,
  row: ReturnType<typeof rowFor>,
  action: 'edit' | 'delete'
) {
  const buttons = row.getByRole('button');
  const count = await buttons.count();
  expect(count, 'the row exposes no action buttons').toBeGreaterThan(0);

  // Delete is last; edit is the one before it.
  const index = action === 'delete' ? count - 1 : count - 2;
  await buttons.nth(Math.max(index, 0)).click();
}

test.describe('Semesters', () => {
  test('an admin can rename a semester through the edit dialog', async ({ page }) => {
    const original = `E2E Edit ${Date.now()}`;
    const renamed = `${original} renamed`;

    const semester = await testDb.semesters.create({
      data: {
        name: original,
        startDate: new Date('2030-01-01'),
        endDate: new Date('2030-06-30'),
        status: 'inactive',
        updatedAt: new Date(),
      },
    });

    try {
      await page.goto('/admin/semesters?limit=1000');
      await page.waitForLoadState('networkidle').catch(() => {});

      const row = rowFor(page, original);
      await expect(row, `the seeded semester "${original}" is not listed`).toBeVisible({
        timeout: 20_000,
      });

      await clickRowAction(page, row, 'edit');

      const dialog = page.getByRole('dialog');
      await expect(dialog, 'the edit dialog did not open').toBeVisible({
        timeout: 10_000,
      });

      const nameField = dialog.getByLabel(/name/i).first();
      await expect(nameField).toBeVisible();
      await nameField.fill(renamed);

      await dialog
        .getByRole('button', { name: /^(save|update|edit)\b/i })
        .first()
        .click();

      await expect(dialog).toBeHidden({ timeout: 10_000 });

      await expect
        .poll(
          async () => {
            const after = await testDb.semesters.findUnique({
              where: { id: semester.id },
            });
            return after?.name;
          },
          { timeout: 10_000, message: 'the rename never reached the database' }
        )
        .toBe(renamed);
    } finally {
      await testDb.semesters.deleteMany({ where: { id: semester.id } });
    }
  });

  test('an admin can delete a semester and it leaves the listing', async ({ page }) => {
    const name = `E2E Delete ${Date.now()}`;

    const semester = await testDb.semesters.create({
      data: {
        name,
        startDate: new Date('2031-01-01'),
        endDate: new Date('2031-06-30'),
        status: 'inactive',
        updatedAt: new Date(),
      },
    });

    try {
      await page.goto('/admin/semesters?limit=1000');
      await page.waitForLoadState('networkidle').catch(() => {});

      const row = rowFor(page, name);
      await expect(row).toBeVisible({ timeout: 20_000 });

      await clickRowAction(page, row, 'delete');

      // Deleting is behind a confirmation, which is the point of the test:
      // a single click must not be enough to destroy a record.
      const dialog = page.getByRole('dialog');
      await expect(
        dialog,
        'delete happened with no confirmation step'
      ).toBeVisible({ timeout: 10_000 });

      await dialog.getByRole('button', { name: /^delete\b/i }).first().click();

      await expect
        .poll(
          async () =>
            testDb.semesters.count({ where: { id: semester.id } }),
          { timeout: 10_000, message: 'the row was never deleted' }
        )
        .toBe(0);

      await expect(rowFor(page, name)).toHaveCount(0);
    } finally {
      await testDb.semesters.deleteMany({ where: { id: semester.id } });
    }
  });

  test('dismissing the delete confirmation keeps the record', async ({ page }) => {
    const name = `E2E Keep ${Date.now()}`;

    const semester = await testDb.semesters.create({
      data: {
        name,
        startDate: new Date('2032-01-01'),
        endDate: new Date('2032-06-30'),
        status: 'inactive',
        updatedAt: new Date(),
      },
    });

    try {
      await page.goto('/admin/semesters?limit=1000');
      await page.waitForLoadState('networkidle').catch(() => {});

      const row = rowFor(page, name);
      await expect(row).toBeVisible({ timeout: 20_000 });

      await clickRowAction(page, row, 'delete');

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await dialog.getByRole('button', { name: /^cancel\b/i }).first().click();
      await expect(dialog).toBeHidden();

      const survivor = await testDb.semesters.findUnique({
        where: { id: semester.id },
      });
      expect(survivor, 'cancelling the dialog deleted the record anyway').not.toBeNull();
    } finally {
      await testDb.semesters.deleteMany({ where: { id: semester.id } });
    }
  });
});
