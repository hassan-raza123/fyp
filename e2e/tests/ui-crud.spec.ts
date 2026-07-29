import { test, expect, type Page } from '@playwright/test';
import { testDb } from '../support/fixtures';
import { statePath, readSeededIds } from '../support/global-setup';

/**
 * Creating records through the interface.
 *
 * Every other spec starts from seeded data, which means the forms an operator
 * actually uses are never exercised. These drive the real dialogs: open, fill,
 * submit, and confirm the row reached the database.
 *
 * Kept resilient on purpose — a page whose dialog cannot be found reports that
 * clearly rather than failing on a mystery timeout, because these forms are the
 * most likely part of the app to be restyled.
 */

test.use({ storageState: statePath('admin') });

const ids = readSeededIds();

/**
 * Open the create dialog on a listing page.
 *
 * The trigger is named explicitly rather than matched loosely: a page-wide
 * "first button starting with Add" also matches things in the sidebar, which
 * silently opens the wrong thing (or nothing).
 */
async function openCreateDialog(page: Page, name: RegExp): Promise<void> {
  const trigger = page.getByRole('button', { name }).first();

  await expect(trigger, `the "${name}" button should be on the page`).toBeVisible({
    timeout: 20_000,
  });
  await trigger.click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
}

/** Fill a field by its label, tolerating fields a form may not have. */
async function fillByLabel(page: Page, label: RegExp | string, value: string) {
  const field = page.getByLabel(label).first();
  if (await field.isVisible().catch(() => false)) {
    await field.fill(value);
    return true;
  }
  return false;
}

/**
 * Choose an option from a select.
 *
 * The app mixes native `<select>` elements with Radix comboboxes, so both are
 * handled: a native select is set directly, a Radix trigger is opened and its
 * option clicked.
 */
async function chooseOption(
  page: Page,
  label: RegExp,
  optionName: RegExp
): Promise<boolean> {
  const dialog = page.getByRole('dialog');

  // Native <select> — exposed with the combobox role but settable directly
  const native = dialog.locator('select').filter({ hasText: optionName }).first();
  if (await native.isVisible().catch(() => false)) {
    const values = await native.locator('option').allTextContents();
    const match = values.find((v) => optionName.test(v));
    if (match) {
      await native.selectOption({ label: match });
      return true;
    }
  }

  // Labelled native select
  const byLabel = dialog.getByLabel(label).first();
  if (await byLabel.isVisible().catch(() => false)) {
    const tag = await byLabel.evaluate((el) => el.tagName.toLowerCase());
    if (tag === 'select') {
      const values = await byLabel.locator('option').allTextContents();
      const match = values.find((v) => optionName.test(v));
      if (match) {
        await byLabel.selectOption({ label: match });
        return true;
      }
    }
  }

  // Radix combobox
  const trigger = dialog.getByRole('combobox', { name: label }).first();
  if (await trigger.isVisible().catch(() => false)) {
    await trigger.click();
    const option = page.getByRole('option', { name: optionName }).first();
    if (await option.isVisible().catch(() => false)) {
      await option.click();
      return true;
    }
    await page.keyboard.press('Escape');
  }

  return false;
}

/** Submit the open dialog. */
async function submitDialog(page: Page) {
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /^(create|save|add|submit)\b/i })
    .first()
    .click();
}

test.describe('Semesters', () => {
  test('an admin can create a semester through the form', async ({ page }) => {
    const name = `E2E Semester ${Date.now()}`;

    await page.goto('/admin/semesters');
    await openCreateDialog(page, /add semester|create semester|new semester/i);

    await fillByLabel(page, /name/i, name);
    await fillByLabel(page, /start date/i, '2027-02-01');
    await fillByLabel(page, /end date/i, '2027-06-30');

    await submitDialog(page);

    // The row must actually exist, not just disappear from the dialog
    await expect
      .poll(
        async () => testDb.semesters.count({ where: { name } }),
        { message: 'the semester should be stored', timeout: 15_000 }
      )
      .toBe(1);

    await testDb.semesters.deleteMany({ where: { name } });
  });
});

test.describe('Courses', () => {
  test('an admin can create a course through the form', async ({ page }) => {
    const code = `E2E${Date.now().toString().slice(-6)}`;

    await page.goto('/admin/courses');
    await openCreateDialog(page, /add course|create course|new course/i);

    await fillByLabel(page, /course code|^code$/i, code);
    await fillByLabel(page, /course name|^name$/i, 'E2E Created Course');
    await fillByLabel(page, /credit hours/i, '3');
    await fillByLabel(page, /theory hours/i, '3');
    await fillByLabel(page, /lab hours/i, '0');
    await chooseOption(page, /type/i, /theory/i);

    await submitDialog(page);

    await expect
      .poll(async () => testDb.courses.count({ where: { code } }), {
        message: 'the course should be stored',
        timeout: 15_000,
      })
      .toBe(1);

    const created = await testDb.courses.findFirst({ where: { code } });
    expect(
      created?.departmentId,
      "a course created by a department admin belongs to their department"
    ).toBe(ids.departmentId);

    await testDb.courses.deleteMany({ where: { code } });
  });

  test('the form refuses a duplicate course code', async ({ page }) => {
    await page.goto('/admin/courses');
    await openCreateDialog(page, /add course|create course|new course/i);

    // CS101 is seeded
    await fillByLabel(page, /course code|^code$/i, 'CS101');
    await fillByLabel(page, /course name|^name$/i, 'Duplicate Attempt');
    await fillByLabel(page, /credit hours/i, '3');
    await fillByLabel(page, /theory hours/i, '3');
    await fillByLabel(page, /lab hours/i, '0');
    await chooseOption(page, /type/i, /theory/i);

    await submitDialog(page);

    // Exactly one CS101 must still exist
    await page.waitForTimeout(1500);
    expect(await testDb.courses.count({ where: { code: 'CS101' } })).toBe(1);
  });
});

test.describe('CLOs', () => {
  test('an admin can add a CLO to a course', async ({ page }) => {
    const code = `CLO${Date.now().toString().slice(-4)}`;

    await page.goto(`/admin/courses/${ids.theoryCourseId}/clos`);
    await openCreateDialog(page, /add clo|create clo|new clo/i);

    await fillByLabel(page, /clo code|^code$/i, code);
    await fillByLabel(page, /description/i, 'Added by the end-to-end suite');

    const chose = await chooseOption(page, /bloom/i, /^Apply$/);
    expect(chose, "the Bloom's level should be selectable").toBeTruthy();

    await submitDialog(page);

    await expect
      .poll(
        async () =>
          testDb.clos.count({ where: { code, courseId: ids.theoryCourseId } }),
        { message: 'the CLO should be stored', timeout: 15_000 }
      )
      .toBe(1);

    await testDb.clos.deleteMany({ where: { code } });
  });
});

test.describe('PLOs', () => {
  test('an admin can add a PLO to a program', async ({ page }) => {
    const code = `PLO${Date.now().toString().slice(-4)}`;

    await page.goto(`/admin/programs/${ids.programId}/plos`);
    await openCreateDialog(page, /add plo|create plo|new plo/i);

    await fillByLabel(page, /plo code|^code$/i, code);
    await fillByLabel(page, /description/i, 'Added by the end-to-end suite');

    const chose = await chooseOption(page, /bloom/i, /^Apply$/);
    expect(chose, "the Bloom's level should be selectable").toBeTruthy();

    await submitDialog(page);

    await expect
      .poll(
        async () =>
          testDb.plos.count({ where: { code, programId: ids.programId } }),
        { message: 'the PLO should be stored', timeout: 15_000 }
      )
      .toBe(1);

    await testDb.plos.deleteMany({ where: { code, programId: ids.programId } });
  });
});

test.describe('Listings show seeded data', () => {
  // A listing that renders but shows nothing is a common silent failure: the
  // page works, the query does not.
  const listings: Array<{ path: string; expected: RegExp }> = [
    { path: '/admin/courses', expected: /CS101/ },
    { path: '/admin/programs', expected: /BSCS|BS Computer Science/ },
    { path: '/admin/semesters', expected: /Fall 2026/ },
    { path: '/admin/students', expected: /CS-2026-001/ },
    { path: '/admin/batches', expected: /Batch 2026|B2026/ },
    { path: '/admin/plos', expected: /PLO1/ },
    { path: '/admin/peos', expected: /PEO1/ },
  ];

  for (const { path, expected } of listings) {
    test(`${path} lists its records`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByText(expected).first()).toBeVisible({
        timeout: 20_000,
      });
    });
  }
});
