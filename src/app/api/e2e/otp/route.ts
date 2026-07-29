import { NextRequest, NextResponse } from 'next/server';
import { isE2ETestMode, readCapturedOtp } from '@/lib/e2e-otp-store';

/**
 * Test-only endpoint: hand back the most recent OTP for an address.
 *
 * Exists so end-to-end tests can complete the OTP step. It is inert unless
 * E2E_TEST_MODE is on, and `isE2ETestMode()` throws outright if that flag is
 * ever combined with a production build.
 *
 * GET /api/e2e/otp?email=someone@example.com
 */
export async function GET(request: NextRequest) {
  if (!isE2ETestMode()) {
    // Indistinguishable from a route that does not exist
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const email = new URL(request.url).searchParams.get('email');
  if (!email) {
    return NextResponse.json(
      { error: 'email query parameter is required' },
      { status: 400 }
    );
  }

  const code = readCapturedOtp(email);
  if (!code) {
    return NextResponse.json(
      { error: 'No OTP captured for that address' },
      { status: 404 }
    );
  }

  return NextResponse.json({ email, code });
}
