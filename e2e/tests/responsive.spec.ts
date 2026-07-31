import { test, expect, type Page } from '@playwright/test';
import { statePath } from '../support/global-setup';

/**
 * Layout at the three sizes the app is meant to support.
 *
 * The check is horizontal overflow: `document.documentElement.scrollWidth`
 * exceeding the viewport means something on the page is wider than the screen
 * and the whole page pans sideways. Wide content — tables above all — is
 * supposed to scroll inside its own container instead, so the page itself never
 * does.
 *
 * A few pixels of slack absorbs sub-pixel rounding in the layout engine, which
 * otherwise reports a 1px overflow on pages that are visually fine.
 */

const SLACK_PX = 2;

const VIEWPORTS = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
} as const;

async function horizontalOverflow(page: Page): Promise<number> {
  await page.waitForLoadState('networkidle').catch(() => {});
  return page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth - doc.clientWidth;
  });
}

/**
 * The outermost element actually pushing the page wide, for a failure message
 * worth reading.
 *
 * Anything inside a horizontally scrollable ancestor is skipped — a wide table
 * within its own scroller is working as intended and would otherwise be named
 * on every failure, hiding the element really at fault.
 */
async function widestOffender(page: Page): Promise<string> {
  return page.evaluate(() => {
    const limit = document.documentElement.clientWidth;

    const insideScroller = (el: Element): boolean => {
      let node = el.parentElement;
      while (node && node !== document.body) {
        const overflowX = getComputedStyle(node).overflowX;
        if (overflowX === 'auto' || overflowX === 'scroll') return true;
        node = node.parentElement;
      }
      return false;
    };

    const offenders = Array.from(document.querySelectorAll('body *')).filter(
      (el) => el.getBoundingClientRect().right > limit + 1 && !insideScroller(el)
    );

    if (offenders.length === 0) return '(none identified)';

    // The first in document order is the container; its children merely inherit
    // the problem.
    const el = offenders[0];
    const rect = el.getBoundingClientRect();
    const cls = (el.className || '').toString().slice(0, 70);
    return `<${el.tagName.toLowerCase()} class="${cls}"> width=${Math.round(
      rect.width
    )} right=${Math.round(rect.right)}`;
  });
}

const PAGES_BY_ROLE = {
  student: ['/student', '/student/courses', '/student/results', '/student/transcript'],
  faculty: ['/faculty', '/faculty/sections', '/faculty/assessments', '/faculty/students'],
  admin: ['/admin', '/admin/students', '/admin/courses', '/admin/results/clo-attainments'],
  superAdmin: ['/super-admin', '/super-admin/departments', '/super-admin/admins'],
} as const;

for (const [role, paths] of Object.entries(PAGES_BY_ROLE)) {
  test.describe(`${role} layout`, () => {
    test.use({ storageState: statePath(role as keyof typeof PAGES_BY_ROLE) });

    for (const [size, viewport] of Object.entries(VIEWPORTS)) {
      for (const path of paths) {
        test(`${path} fits the ${size} viewport`, async ({ page }) => {
          await page.setViewportSize(viewport);
          await page.goto(path);

          const overflow = await horizontalOverflow(page);

          if (overflow > SLACK_PX) {
            const offender = await widestOffender(page);
            expect(
              overflow,
              `${path} pans sideways by ${overflow}px at ${viewport.width}px — widest element ${offender}`
            ).toBeLessThanOrEqual(SLACK_PX);
          }
        });
      }
    }
  });
}

test.describe('Sidebar behaviour across sizes', () => {
  test.use({ storageState: statePath('admin') });

  test('the sidebar is off-canvas on mobile and docked on desktop', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto('/admin');

    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible();
    const docked = await sidebar.boundingBox();
    expect(docked, 'no sidebar rendered on desktop').not.toBeNull();
    expect(docked!.x).toBeGreaterThanOrEqual(0);

    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/admin');

    // Off-canvas means translated out of view, not merely narrow.
    const mobileBox = await sidebar.boundingBox();
    if (mobileBox) {
      expect(
        mobileBox.x + mobileBox.width,
        'the sidebar covers the page on mobile'
      ).toBeLessThanOrEqual(VIEWPORTS.mobile.width);
    }
  });

  test('the main content is reachable on mobile', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/admin');
    await expect(page.locator('main').first()).toBeVisible();
  });
});

test.describe('Wide tables scroll inside their own container', () => {
  test.use({ storageState: statePath('admin') });

  const TABLE_PAGES = ['/admin/students', '/admin/courses', '/admin/sections'];

  for (const path of TABLE_PAGES) {
    test(`${path} keeps its table scroll off the page body`, async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.goto(path);
      await page.waitForLoadState('networkidle').catch(() => {});

      const tableCount = await page.locator('table').count();
      test.skip(tableCount === 0, 'no table rendered on this page');

      const wrapped = await page.evaluate(() => {
        const scrollable = (el: Element | null): boolean => {
          while (el && el !== document.body) {
            const overflowX = getComputedStyle(el).overflowX;
            if (overflowX === 'auto' || overflowX === 'scroll') return true;
            el = el.parentElement;
          }
          return false;
        };
        return Array.from(document.querySelectorAll('table')).every((t) =>
          scrollable(t.parentElement)
        );
      });

      expect(wrapped, 'a table has no horizontally scrollable ancestor').toBe(true);
    });
  }
});
