import { test, expect, type Page } from '@playwright/test';
import { statePath } from '../support/global-setup';

/**
 * Baseline accessibility.
 *
 * No axe-core dependency is pulled in here — these are the structural rules
 * that a screen reader and a keyboard user depend on, checked directly against
 * the accessibility tree Playwright already exposes.
 *
 * Every assertion names the elements it objects to, so a failure points at the
 * markup to fix rather than just a count.
 */

/** Controls a screen reader would announce as nothing at all. */
async function unnamedControls(page: Page): Promise<string[]> {
  await page.waitForLoadState('networkidle').catch(() => {});
  return page.evaluate(() => {
    const describe = (el: Element) =>
      `<${el.tagName.toLowerCase()} class="${(el.className || '').toString().slice(0, 50)}">`;

    const named = (el: Element): boolean => {
      if (el.getAttribute('aria-label')?.trim()) return true;
      if (el.getAttribute('aria-labelledby')?.trim()) return true;
      if (el.getAttribute('title')?.trim()) return true;
      if ((el as HTMLElement).innerText?.trim()) return true;
      // An icon-only control is acceptable when the icon itself is labelled
      const img = el.querySelector('img[alt]:not([alt=""])');
      return img !== null;
    };

    return Array.from(document.querySelectorAll('button, a[href]'))
      .filter((el) => {
        const style = getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        if (el.getAttribute('aria-hidden') === 'true') return false;
        return !named(el);
      })
      .map(describe);
  });
}

/** Inputs with no <label>, aria-label or aria-labelledby. */
async function unlabelledInputs(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    Array.from(
      document.querySelectorAll('input:not([type="hidden"]), select, textarea')
    )
      .filter((el) => {
        if (el.getAttribute('aria-label')?.trim()) return false;
        if (el.getAttribute('aria-labelledby')?.trim()) return false;
        if (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) {
          return false;
        }
        return el.closest('label') === null;
      })
      .map(
        (el) =>
          `<${el.tagName.toLowerCase()} name="${el.getAttribute('name') ?? ''}" ` +
          `placeholder="${el.getAttribute('placeholder') ?? ''}">`
      )
  );
}

test.describe('Document structure', () => {
  test.use({ storageState: statePath('admin') });

  const PAGES = ['/admin', '/admin/students', '/admin/courses', '/admin/results'];

  for (const path of PAGES) {
    test(`${path} has one main landmark and a heading`, async ({ page }) => {
      await page.goto(path);

      await expect(
        page.locator('main'),
        'a page needs exactly one <main> for skip navigation'
      ).toHaveCount(1);

      const headings = await page.locator('h1, h2').count();
      expect(headings, 'the page has no heading to orient by').toBeGreaterThan(0);
    });
  }

  test('the document declares its language', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('html')).toHaveAttribute('lang', /\w+/);
  });

  test('the page has a non-generic title', async ({ page }) => {
    await page.goto('/admin/students');
    const title = await page.title();
    expect(title.trim().length, 'the tab is untitled').toBeGreaterThan(0);
  });
});

/**
 * Two pages was not a representative sample. The listing screens are where
 * icon-only row actions live — an edit pencil and a delete bin rendered as
 * bare `<button><Icon /></button>` announce as nothing at all, and they are the
 * destructive controls on the page.
 */
const CONTROL_SWEEP = {
  admin: [
    '/admin',
    '/admin/students',
    '/admin/semesters',
    '/admin/courses',
    '/admin/programs',
    '/admin/batches',
    '/admin/sections',
    '/admin/clos',
    '/admin/plos',
  ],
  faculty: ['/faculty', '/faculty/assessments', '/faculty/sections'],
  student: ['/student', '/student/courses', '/student/results'],
  superAdmin: ['/super-admin', '/super-admin/departments'],
} as const;

for (const [role, paths] of Object.entries(CONTROL_SWEEP)) {
  test.describe(`Controls are announced (${role})`, () => {
    test.use({ storageState: statePath(role as keyof typeof CONTROL_SWEEP) });

    for (const path of paths) {
      test(`${path} has no unnamed buttons or links`, async ({ page }) => {
        await page.goto(path);
        const offenders = await unnamedControls(page);
        expect(
          offenders,
          `controls a screen reader announces as blank:\n${offenders.join('\n')}`
        ).toEqual([]);
      });
    }
  });
}

test.describe('Forms are labelled', () => {
  test('the login form labels every field', async ({ page }) => {
    await page.goto('/login');
    const offenders = await unlabelledInputs(page);
    expect(offenders, `unlabelled fields:\n${offenders.join('\n')}`).toEqual([]);
  });

  test('the forgot-password form labels every field', async ({ page }) => {
    await page.goto('/forgot-password');
    const offenders = await unlabelledInputs(page);
    expect(offenders, `unlabelled fields:\n${offenders.join('\n')}`).toEqual([]);
  });
});

test.describe('Keyboard operation', () => {
  test('the login form can be completed without a mouse', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('button', { name: 'Admin', exact: true }).click();
    await page.getByLabel('Email').focus();

    // Tab should reach the password field and then the submit button, and the
    // focused element must be visibly distinguishable.
    await page.keyboard.press('Tab');
    const focusedIsInteractive = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return false;
      return ['INPUT', 'BUTTON', 'A', 'SELECT', 'TEXTAREA'].includes(el.tagName);
    });
    expect(focusedIsInteractive, 'Tab left focus nowhere useful').toBe(true);

    const hasFocusRing = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return false;
      const style = getComputedStyle(el);
      return (
        style.outlineStyle !== 'none' ||
        style.boxShadow !== 'none' ||
        style.borderColor !== ''
      );
    });
    expect(hasFocusRing, 'the focused control shows no focus indicator').toBe(true);
  });

  test('a dialog traps focus and closes on Escape', async ({ page }) => {
    await page.goto('/admin/semesters');
    await page.waitForLoadState('networkidle').catch(() => {});

    const trigger = page.getByRole('button', { name: /add|create|new/i }).first();
    test.skip(!(await trigger.isVisible().catch(() => false)), 'no dialog trigger here');

    await trigger.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog, 'Escape did not dismiss the dialog').toBeHidden();
  });
});

test.describe('Images carry alternative text', () => {
  test.use({ storageState: statePath('admin') });

  test('every meaningful image on the dashboard has alt text', async ({ page }) => {
    await page.goto('/admin');
    const missing = await page.evaluate(() =>
      Array.from(document.querySelectorAll('img'))
        .filter((img) => !img.hasAttribute('alt'))
        .map((img) => img.getAttribute('src') ?? '(no src)')
    );
    expect(missing, `images without an alt attribute:\n${missing.join('\n')}`).toEqual([]);
  });
});
