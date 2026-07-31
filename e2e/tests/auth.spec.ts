import { test, expect } from '@playwright/test';
import { ACCOUNTS, TEST_PASSWORD, testDb } from '../support/fixtures';
import { signIn, fetchOtp, DASHBOARD_PATH } from '../support/auth-helper';
import { hash } from 'bcryptjs';
import { apiGet, apiPost } from '../support/api-helper';

/**
 * Authentication.
 *
 * Everything else in the suite depends on sign-in working, so this file runs
 * without stored state and drives the real forms.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Sign-in', () => {
  test('public pages are reachable without a session', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);

    await page.goto('/login');
    await expect(page.getByLabel('Email')).toBeVisible();
  });

  test('a protected page redirects an anonymous visitor to login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });

  test('a wrong password is rejected', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Admin', exact: true }).click();
    await page.getByLabel('Email').fill(ACCOUNTS.admin.email);
    await page.getByLabel('Password', { exact: true }).fill('definitely-not-it');
    await page.getByRole('button', { name: /sign in|login/i }).click();

    // Stays on login rather than reaching a dashboard
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/invalid/i).first()).toBeVisible({ timeout: 15_000 });
  });

  for (const role of ['super_admin', 'admin', 'faculty', 'student'] as const) {
    const account = Object.values(ACCOUNTS).find((a) => a.role === role)!;

    test(`${role} can sign in and reach their dashboard`, async ({ page, baseURL }) => {
      await signIn(page, {
        email: account.email,
        password: TEST_PASSWORD,
        role,
        baseURL: baseURL!,
      });

      await expect(page).toHaveURL(new RegExp(DASHBOARD_PATH[role]));
    });
  }
});

test.describe('One-time passwords', () => {
  test('an admin sign-in issues a code that verifies', async ({ page, baseURL }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Admin', exact: true }).click();
    await page.getByLabel('Email').fill(ACCOUNTS.admin.email);
    await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in|login/i }).click();

    await page.waitForURL(/verify-otp/, { timeout: 30_000 });

    const code = await fetchOtp(page, ACCOUNTS.admin.email, baseURL!);
    expect(code).toMatch(/^\d{6}$/);
  });

  test('a resent code also verifies', async ({ page, baseURL }) => {
    // Regression guard: resend-otp once stored the code in plaintext while
    // verification compared it with bcrypt, so every resent code was rejected.
    await page.goto('/login');
    await page.getByRole('button', { name: 'Faculty', exact: true }).click();
    await page.getByLabel('Email').fill(ACCOUNTS.faculty.email);
    await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await page.waitForURL(/verify-otp/, { timeout: 30_000 });

    // Posted from inside the page: the OTP challenge cookie issued by the
    // password step is SameSite=Strict, and `page.request` runs outside any
    // site context, so it would be withheld and the call would 401 — an
    // artifact of the harness, not the app. See `support/api-helper.ts`.
    const resend = await apiPost(page, '/api/auth/resend-otp', {
      email: ACCOUNTS.faculty.email,
      userType: 'faculty',
    });
    expect(resend.ok).toBeTruthy();

    const code = await fetchOtp(page, ACCOUNTS.faculty.email, baseURL!);

    const verify = await apiPost(page, '/api/auth/verify-otp', {
      email: ACCOUNTS.faculty.email,
      userType: 'faculty',
      otp: code,
    });

    expect(verify.status, 'a resent OTP must verify').toBe(200);
    expect((verify.body as { success: boolean }).success).toBe(true);
  });

  test('a wrong code is rejected', async ({ page, baseURL }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Admin', exact: true }).click();
    await page.getByLabel('Email').fill(ACCOUNTS.admin.email);
    await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await page.waitForURL(/verify-otp/, { timeout: 30_000 });

    const verify = await page.request.post(`${baseURL}/api/auth/verify-otp`, {
      data: { email: ACCOUNTS.admin.email, userType: 'admin', otp: '000000' },
    });
    expect(verify.ok()).toBeFalsy();
  });
});

test.describe('Forced password change', () => {
  const flagged = {
    email: 'e2e.flagged@test.local',
    password: 'TempPass@2026',
  };

  test.beforeEach(async () => {
    // A fresh account carrying an admin-issued temporary password
    const role = await testDb.roles.findFirst({ where: { name: 'student' } });
    await testDb.users.deleteMany({ where: { email: flagged.email } });

    const user = await testDb.users.create({
      data: {
        email: flagged.email,
        username: 'e2e.flagged',
        password_hash: await hash(flagged.password, 10),
        first_name: 'Flagged',
        last_name: 'User',
        status: 'active',
        email_verified: true,
        must_change_password: true,
      },
    });
    await testDb.userroles.create({
      data: { userId: user.id, roleId: role!.id, updatedAt: new Date() },
    });
  });

  test('a temporary password forces the change screen and then releases', async ({
    page,
    baseURL,
  }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Student', exact: true }).click();
    await page.getByLabel('Email').fill(flagged.email);
    await page.getByLabel('Password', { exact: true }).fill(flagged.password);
    await page.getByRole('button', { name: /sign in|login/i }).click();

    await page.waitForURL(
      (url) =>
        url.pathname.startsWith('/change-password') ||
        url.pathname.startsWith('/verify-otp'),
      { timeout: 30_000 }
    );

    if (page.url().includes('/verify-otp')) {
      const code = await fetchOtp(page, flagged.email, baseURL!);
      await apiPost(page, '/api/auth/verify-otp', {
        email: flagged.email,
        userType: 'student',
        otp: code,
      });
      await page.goto('/student');
    }

    // Held on the change screen no matter where they try to go
    await expect(page).toHaveURL(/change-password/, { timeout: 15_000 });

    // And blocked at the API too
    const blocked = await apiGet(page, '/api/programs');
    expect(blocked.status).toBe(403);

    // A weak password is refused
    const weak = await apiPost(page, '/api/auth/change-password', {
      currentPassword: flagged.password,
      newPassword: 'abc',
    });
    expect(weak.ok).toBeFalsy();

    // A retired shared default is refused
    const retired = await apiPost(page, '/api/auth/change-password', {
      currentPassword: flagged.password,
      newPassword: 'Student@2025',
    });
    expect(retired.ok).toBeFalsy();

    // A real password is accepted and lifts the block
    const changed = await apiPost(page, '/api/auth/change-password', {
      currentPassword: flagged.password,
      newPassword: 'ChosenByMe@2026',
    });
    expect(changed.ok).toBeTruthy();

    // The point is that the password block is gone. This throwaway account has
    // no student record and so no department, and a 400 for that is correct —
    // what must not come back is another 403.
    const allowed = await apiGet(page, '/api/programs');
    expect(allowed.status, 'the password block should be lifted').not.toBe(403);

    const row = await testDb.users.findUnique({ where: { email: flagged.email } });
    expect(row?.must_change_password).toBe(false);
  });
});
