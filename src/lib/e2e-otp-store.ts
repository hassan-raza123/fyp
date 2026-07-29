/**
 * Test-only OTP capture.
 *
 * OTPs are bcrypt-hashed before they are stored, so an automated test cannot
 * recover one from the database, and with no SMTP configured it cannot read one
 * from an inbox either. That makes every admin and faculty sign-in unreachable
 * from an end-to-end test.
 *
 * When — and only when — E2E test mode is on, the plaintext code is kept in
 * memory so the test-only endpoint can hand it back.
 *
 * Two independent conditions must hold:
 *   1. `E2E_TEST_MODE` must be exactly 'true'
 *   2. the app must be serving a local host
 *
 * Tests run against a production *build* — that is the point, it is what
 * actually ships — so NODE_ENV alone cannot be the discriminator. What must
 * never happen is a real deployment exposing codes, and a real deployment is
 * not on localhost. If the flag is ever set on a non-local production host the
 * call throws instead of quietly handing out OTPs.
 */

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];

function isLocalDeployment(): boolean {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    // No URL configured at all — only trust this outside production
    return process.env.NODE_ENV !== 'production';
  }

  try {
    return LOCAL_HOSTS.includes(new URL(appUrl).hostname);
  } catch {
    return false;
  }
}

export function isE2ETestMode(): boolean {
  const enabled = process.env.E2E_TEST_MODE === 'true';
  if (!enabled) return false;

  if (!isLocalDeployment()) {
    throw new Error(
      'E2E_TEST_MODE is enabled on a non-local host. This would expose OTP ' +
        'codes to anyone. Unset E2E_TEST_MODE.'
    );
  }

  return true;
}

interface CapturedOtp {
  code: string;
  capturedAt: number;
}

// Deliberately module-scoped and in-memory: nothing is persisted, and the map
// dies with the process.
const store = new Map<string, CapturedOtp>();

/** Retain the most recent OTP for an address. No-op outside test mode. */
export function captureOtp(email: string, code: string): void {
  if (!isE2ETestMode()) return;
  store.set(email.toLowerCase(), { code, capturedAt: Date.now() });
}

/**
 * Read back the most recent OTP for an address.
 * Returns null outside test mode, when nothing was captured, or when the
 * captured code is older than the OTP's own 5-minute lifetime.
 */
export function readCapturedOtp(email: string): string | null {
  if (!isE2ETestMode()) return null;

  const entry = store.get(email.toLowerCase());
  if (!entry) return null;

  const FIVE_MINUTES = 5 * 60 * 1000;
  if (Date.now() - entry.capturedAt > FIVE_MINUTES) {
    store.delete(email.toLowerCase());
    return null;
  }

  return entry.code;
}

/** Drop everything — used between test runs. */
export function clearCapturedOtps(): void {
  store.clear();
}
