import { test, expect, type Page } from '@playwright/test';
import { statePath } from '../support/global-setup';

/**
 * The chrome every signed-in page carries.
 *
 * `smoke.spec.ts` loads each page by URL, so anything reachable only by
 * *clicking* is never exercised — including the account menu in the header,
 * which is the one control present on every screen of every dashboard.
 *
 * Also covered here: signing out, and what an unmatched URL does. Both are
 * ordinary user journeys with no test behind them.
 */

/**
 * Open the header account menu.
 *
 * Scoped to the banner: the sidebar carries its own "Profile" entry for some
 * roles, and an unscoped lookup matches both.
 */
async function openAccountMenu(page: Page) {
  const header = page.getByRole('banner');
  const trigger = header.getByRole('button', { name: /account menu/i });
  await expect(trigger, 'no account menu in the header').toBeVisible({
    timeout: 20_000,
  });
  await trigger.click();
  return header;
}

const DASHBOARDS = {
  admin: '/admin',
  faculty: '/faculty',
  student: '/student',
  superAdmin: '/super-admin',
} as const;

for (const [role, dashboard] of Object.entries(DASHBOARDS)) {
  test.describe(`${role} account menu`, () => {
    test.use({ storageState: statePath(role as keyof typeof DASHBOARDS) });

    test('the Profile entry leads to a real page', async ({ page }) => {
      await page.goto(dashboard);
      const header = await openAccountMenu(page);

      const profile = header.getByRole('button', { name: /^profile$/i });
      await expect(profile, 'no Profile entry in the account menu').toBeVisible();
      await profile.click();

      // The menu navigates with the client router, so waiting on a load state
      // returns immediately and would assert against the page we just left.
      await expect(page, 'Profile did not navigate anywhere').not.toHaveURL(
        new RegExp(`${dashboard}$`),
        { timeout: 10_000 }
      );

      await expect(
        page.getByText(/page not found/i),
        `Profile navigates to ${page.url()}, which has no page behind it`
      ).toHaveCount(0);
    });

    test('signing out returns to the login screen', async ({ page }) => {
      await page.goto(dashboard);
      const header = await openAccountMenu(page);

      await header.getByRole('button', { name: /log out/i }).click();

      // A confirmation dialog stands between the menu entry and the action.
      const confirm = page.getByRole('dialog');
      await expect(confirm).toBeVisible({ timeout: 10_000 });
      await confirm.getByRole('button', { name: /^logout$/i }).click();

      await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });

      // The session must actually be gone, not merely navigated away from.
      await page.goto(dashboard);
      await expect(
        page,
        'the dashboard is still reachable after signing out'
      ).toHaveURL(/\/login/);
    });
  });
}

test.describe('Unmatched routes', () => {
  test.use({ storageState: statePath('admin') });

  test('an unknown path under a dashboard renders the 404 page', async ({ page }) => {
    const response = await page.goto('/admin/this-route-does-not-exist');

    expect(response?.status(), 'an unknown path should 404').toBe(404);
    await expect(page.getByText(/page not found/i)).toBeVisible();
  });

  test('the 404 page offers a way back', async ({ page }) => {
    await page.goto('/admin/this-route-does-not-exist');

    const home = page.getByRole('link', { name: /go home/i });
    await expect(home).toBeVisible();
    await home.click();

    await expect(page).not.toHaveURL(/this-route-does-not-exist/);
  });
});

test.describe('Header controls', () => {
  test.use({ storageState: statePath('admin') });

  test('the notifications button opens something', async ({ page }) => {
    await page.goto('/admin');

    const bell = page.getByRole('button', { name: /notifications/i });
    await expect(bell).toBeVisible({ timeout: 20_000 });
    await bell.click();

    // aria-expanded goes true on click, so a screen reader announces a panel.
    // Something has to actually appear, or the control is decorative.
    const panel = page.locator('[role="menu"], [role="dialog"], [role="listbox"]');
    await expect(
      panel,
      'the bell reports itself expanded but renders no panel'
    ).not.toHaveCount(0);
  });

  test('the header search does something with what is typed', async ({ page }) => {
    await page.goto('/admin/students');
    await page.waitForLoadState('networkidle').catch(() => {});

    const search = page.getByPlaceholder('Search...').first();
    await expect(search).toBeVisible({ timeout: 20_000 });

    const before = page.url();
    await search.fill('a-term-that-matches-nothing-at-all');
    await search.press('Enter');
    await page.waitForTimeout(1000);

    const navigated = page.url() !== before;
    const results = await page
      .getByText(/no results|nothing found|no matches/i)
      .count();

    expect(
      navigated || results > 0,
      'typing in the header search and submitting changes nothing on the page'
    ).toBe(true);
  });
});
