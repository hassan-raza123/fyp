import { test } from '@playwright/test';
import { statePath } from '../support/global-setup';

test.describe('diag', () => {
  test.use({ storageState: statePath('superAdmin') });

  test('find true overflow source', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/super-admin/admins');
    await page.waitForLoadState('networkidle').catch(() => {});

    const report = await page.evaluate(() => {
      const limit = document.documentElement.clientWidth;
      const inScroller = (el: Element | null): boolean => {
        let n = el?.parentElement ?? null;
        while (n && n !== document.body) {
          const ox = getComputedStyle(n).overflowX;
          if (ox === 'auto' || ox === 'scroll') return true;
          n = n.parentElement;
        }
        return false;
      };
      const out: string[] = [];
      for (const el of Array.from(document.querySelectorAll('body *'))) {
        const r = el.getBoundingClientRect();
        if (r.right > limit + 1 && !inScroller(el)) {
          out.push(
            `${el.tagName.toLowerCase()}.${(el.className || '').toString().slice(0, 70)} right=${Math.round(r.right)} w=${Math.round(r.width)}`
          );
        }
      }
      return { limit, scrollWidth: document.documentElement.scrollWidth, out: out.slice(0, 12) };
    });
    console.log('\n===DIAG===\n' + JSON.stringify(report, null, 2) + '\n===END===');
  });
});
