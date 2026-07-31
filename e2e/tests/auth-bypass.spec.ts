import { test, expect } from '@playwright/test';
import { ACCOUNTS, TEST_PASSWORD, testDb } from '../support/fixtures';
import { fetchOtp, signIn } from '../support/auth-helper';
import { apiGet, apiPost } from '../support/api-helper';

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

  /**
   * A genuinely live code is used here, obtained through a *real* password
   * login in a throwaway context. The attacker then presents it from a context
   * that never did the password step. Asserting with a real code matters: a
   * test that guessed one would pass simply because the code was wrong.
   */
  test('verify-otp rejects a valid code presented without a password step', async ({
    browser,
    baseURL,
  }) => {
    // Victim's context: a legitimate password login, which mints a real OTP.
    const victim = await browser.newContext({ baseURL });
    const victimPage = await victim.newPage();
    await victimPage.goto('/login');
    await victimPage.getByRole('button', { name: 'Admin', exact: true }).click();
    await victimPage.getByLabel('Email').fill(ACCOUNTS.admin.email);
    await victimPage
      .getByLabel('Password', { exact: true })
      .fill(TEST_PASSWORD);
    await victimPage.getByRole('button', { name: /sign in|login/i }).click();
    await victimPage.waitForURL(/verify-otp/, { timeout: 30_000 });

    const code = await fetchOtp(victimPage, ACCOUNTS.admin.email, baseURL!);
    await victim.close();

    // Attacker's context: holds the code, never supplied the password.
    const attacker = await browser.newContext({ baseURL });
    const attackerPage = await attacker.newPage();
    await attackerPage.goto('/login');

    const response = await apiPost(attackerPage, '/api/auth/verify-otp', {
      email: ACCOUNTS.admin.email,
      userType: 'admin',
      otp: code,
    });

    expect(
      response.status,
      'a full admin session was issued to a caller who never supplied a password'
    ).toBe(401);

    const cookies = await attacker.cookies();
    expect(
      cookies.find((c) => c.name === 'token'),
      'a session cookie was set for a caller who never proved a password'
    ).toBeUndefined();

    await attacker.close();
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
    await signIn(page, {
      email: ACCOUNTS.student.email,
      password: TEST_PASSWORD,
      role: 'student',
      baseURL: baseURL!,
    });

    const before = await apiGet(page, '/api/student/overview');
    expect(before.status, 'precondition: the session works').toBe(200);

    await testDb.users.updateMany({
      where: { email: ACCOUNTS.student.email },
      data: { status: 'suspended' },
    });

    try {
      // Same cookie, same token — the only thing that changed is the account.
      const after = await apiGet(page, '/api/student/overview');

      expect(
        after.status,
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
