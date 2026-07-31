import { test, expect } from '@playwright/test';
import { ACCOUNTS } from '../support/fixtures';
import { fetchOtp } from '../support/auth-helper';

/**
 * The OTP must be a *second* factor, not a standalone credential.
 *
 * Sign-in is two steps: `/api/auth/login` checks the password and writes an
 * OTP, then `/api/auth/verify-otp` exchanges the code for a session cookie.
 * Nothing links the two. `/api/auth/resend-otp` is public and asks only for an
 * email address, so it mints a valid code with no password at all — and
 * `verify-otp` never asks whether step one ever happened.
 *
 * The practical effect is that the password stops being a factor: resetting a
 * compromised account's password does not evict an attacker who can read that
 * mailbox. These tests pin the two ends of that chain.
 *
 * They run without stored state, because the whole point is what an anonymous
 * caller can do.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('OTP issuance requires a verified password', () => {
  test('resend-otp refuses to mint a code for an anonymous caller', async ({
    page,
  }) => {
    await page.goto('/login');

    const response = await page.request.post('/api/auth/resend-otp', {
      data: { email: ACCOUNTS.admin.email, userType: 'admin' },
    });

    expect(
      response.status(),
      'an anonymous caller minted a live admin OTP without a password'
    ).toBe(401);
  });

  /**
   * Whatever the answer, it must not differ between a real account and one that
   * does not exist — a 404 on the real address alone confirms which mailboxes
   * are worth attacking.
   */
  test('resend-otp does not reveal whether an account exists', async ({ page }) => {
    await page.goto('/login');

    const real = await page.request.post('/api/auth/resend-otp', {
      data: { email: ACCOUNTS.admin.email, userType: 'admin' },
    });
    const fake = await page.request.post('/api/auth/resend-otp', {
      data: { email: 'definitely.not.a.user@test.local', userType: 'admin' },
    });

    expect(
      real.status(),
      'a real address answers differently from an unknown one'
    ).toBe(fake.status());
  });

  test('verify-otp rejects a code that was never preceded by a password', async ({
    page,
    baseURL,
  }) => {
    await page.goto('/login');

    // Mint a code the way an attacker would: no password anywhere in the flow.
    await page.request.post('/api/auth/resend-otp', {
      data: { email: ACCOUNTS.admin.email, userType: 'admin' },
    });

    let code: string;
    try {
      code = await fetchOtp(page, ACCOUNTS.admin.email, baseURL!);
    } catch {
      // resend-otp already refuses anonymous callers — the chain is broken at
      // its first link, which is the outcome this file is asserting.
      return;
    }

    const response = await page.request.post('/api/auth/verify-otp', {
      data: { email: ACCOUNTS.admin.email, userType: 'admin', otp: code },
    });

    expect(
      response.status(),
      'a full admin session was issued without any password being supplied'
    ).not.toBe(200);

    const cookies = await page.context().cookies();
    expect(
      cookies.find((c) => c.name === 'token'),
      'a session cookie was set for a caller who never proved a password'
    ).toBeUndefined();
  });
});

/**
 * `users.status` is read at login and never again. `requireAuth` only verifies
 * the JWT signature and expiry, tokens live 24 hours, and logout just clears
 * the client cookie — so suspending an account currently does nothing to a
 * session already in flight.
 */
test.describe('Suspending an account revokes its session', () => {
  test('a suspended user cannot keep using an existing token', async ({
    page,
    baseURL,
  }) => {
    const { signIn } = await import('../support/auth-helper');
    const { testDb, TEST_PASSWORD } = await import('../support/fixtures');

    await signIn(page, {
      email: ACCOUNTS.student.email,
      password: TEST_PASSWORD,
      role: 'student',
      baseURL: baseURL!,
    });

    const before = await page.request.get('/api/student/overview');
    expect(before.status(), 'precondition: the session works').toBe(200);

    await testDb.users.updateMany({
      where: { email: ACCOUNTS.student.email },
      data: { status: 'suspended' },
    });

    try {
      const after = await page.evaluate(async () => {
        const r = await fetch('/api/student/overview', { credentials: 'include' });
        return r.status;
      });

      expect(
        after,
        'a suspended account kept full access on its existing token'
      ).toBe(401);
    } finally {
      await testDb.users.updateMany({
        where: { email: ACCOUNTS.student.email },
        data: { status: 'active' },
      });
    }
  });
});
