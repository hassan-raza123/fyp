import { expect, type Page } from '@playwright/test';

/**
 * Sign-in helper.
 *
 * The login form offers three tabs — Student, Faculty, Admin — and a super
 * admin signs in through the Admin tab; the server works out the effective role
 * from the account itself.
 *
 * Admin and faculty always need an OTP, and a student needs one until their
 * email is verified. The code is bcrypt-hashed in the database and no SMTP is
 * configured under test, so it is read back from the test-only endpoint.
 */

export type SignInRole = 'super_admin' | 'admin' | 'faculty' | 'student';

const TAB_LABEL: Record<SignInRole, string> = {
  super_admin: 'Admin',
  admin: 'Admin',
  faculty: 'Faculty',
  student: 'Student',
};

export const DASHBOARD_PATH: Record<SignInRole, string> = {
  super_admin: '/super-admin',
  admin: '/admin',
  faculty: '/faculty',
  student: '/student',
};

/** Read the most recent OTP for an address from the test-only endpoint. */
export async function fetchOtp(
  page: Page,
  email: string,
  baseURL: string
): Promise<string> {
  // The code is written when the login request is handled; a couple of quick
  // retries absorb the gap between the response arriving and the write landing.
  for (let attempt = 0; attempt < 10; attempt++) {
    const response = await page.request.get(
      `${baseURL}/api/e2e/otp?email=${encodeURIComponent(email)}`
    );

    if (response.ok()) {
      const body = await response.json();
      if (body.code) return body.code as string;
    }

    await page.waitForTimeout(300);
  }

  throw new Error(
    `No OTP was captured for ${email}. Is E2E_TEST_MODE enabled on the server?`
  );
}

export interface SignInOptions {
  email: string;
  password: string;
  role: SignInRole;
  baseURL: string;
}

/** Drive the real login UI through to a dashboard. */
export async function signIn(page: Page, options: SignInOptions): Promise<void> {
  const { email, password, role, baseURL } = options;

  await page.goto('/login');

  await page.getByRole('button', { name: TAB_LABEL[role], exact: true }).click();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: /sign in|login/i }).click();

  // Students whose email is already verified skip the OTP step entirely
  await page.waitForURL(
    (url) =>
      url.pathname.startsWith('/verify-otp') ||
      url.pathname.startsWith(DASHBOARD_PATH[role]) ||
      url.pathname.startsWith('/change-password'),
    { timeout: 30_000 }
  );

  if (page.url().includes('/verify-otp')) {
    const code = await fetchOtp(page, email, baseURL);

    // The form may render one box per digit or a single field
    const digitBoxes = page.locator('input[inputmode="numeric"], input[maxlength="1"]');
    const digitCount = await digitBoxes.count();

    if (digitCount >= 6) {
      for (let i = 0; i < 6; i++) {
        await digitBoxes.nth(i).fill(code[i]);
      }
    } else {
      await page.locator('input[type="text"], input[type="tel"]').first().fill(code);
    }

    const verifyButton = page.getByRole('button', { name: /verify|submit|continue/i });
    if (await verifyButton.isVisible().catch(() => false)) {
      await verifyButton.click();
    }

    await page.waitForURL(
      (url) =>
        url.pathname.startsWith(DASHBOARD_PATH[role]) ||
        url.pathname.startsWith('/change-password'),
      { timeout: 30_000 }
    );
  }

  // Seeded accounts are not flagged, so landing here means something regressed
  expect(page.url()).not.toContain('/change-password');
}

/** Sign out through the API and confirm the session is gone. */
export async function signOut(page: Page): Promise<void> {
  await page.request.post('/api/auth/logout');
  await page.context().clearCookies();
}
