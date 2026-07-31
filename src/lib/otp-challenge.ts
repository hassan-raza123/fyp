import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';

/**
 * Binds the OTP step to a verified password.
 *
 * Sign-in is two requests: `/api/auth/login` checks the password and writes an
 * OTP, then `/api/auth/verify-otp` exchanges the code for a session. Nothing
 * used to connect them — `verify-otp` never asked whether the password step had
 * happened, and `/api/auth/resend-otp` is public and takes only an email
 * address, so a fresh valid code could be minted with no credential at all.
 *
 * The effect was that the password stopped being a factor: resetting a
 * compromised account's password did not evict an attacker who could read that
 * mailbox, and the OTP became a standalone credential.
 *
 * `/api/auth/login` now issues this short-lived cookie once the password
 * verifies. `resend-otp` and `verify-otp` require it, so the OTP is only ever
 * the *second* of two factors. It is deliberately separate from the session
 * token: it carries no role and grants access to nothing but the OTP step.
 */

const CHALLENGE_COOKIE = 'otp_challenge';

// Long enough to read an email and type six digits, short enough that a stolen
// challenge is worthless. The OTP itself expires in 5 minutes.
const CHALLENGE_TTL_SECONDS = 10 * 60;

function secret(): Uint8Array {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) {
    throw new Error(
      'JWT_SECRET environment variable is missing or shorter than 32 characters.'
    );
  }
  return new TextEncoder().encode(value);
}

export interface OtpChallenge {
  userId: number;
  email: string;
  userType: string;
}

/** Mint a challenge token. Only ever called after a password has verified. */
export async function createOtpChallenge(
  challenge: OtpChallenge
): Promise<string> {
  return new SignJWT({
    userId: challenge.userId,
    email: challenge.email,
    userType: challenge.userType,
    purpose: 'otp',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${CHALLENGE_TTL_SECONDS}s`)
    .sign(secret());
}

/**
 * Read and validate the challenge on the current request.
 *
 * Returns null when it is absent, expired, forged, or issued for a different
 * address than the one the caller is now claiming — the last case matters
 * because otherwise a valid challenge for your own account would authorise an
 * OTP request for somebody else's.
 */
export async function readOtpChallenge(
  request: NextRequest,
  expectedEmail: string
): Promise<OtpChallenge | null> {
  const token = request.cookies.get(CHALLENGE_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.purpose !== 'otp') return null;

    const email = String(payload.email ?? '').toLowerCase();
    if (email !== expectedEmail.toLowerCase()) return null;

    return {
      userId: Number(payload.userId),
      email,
      userType: String(payload.userType ?? ''),
    };
  } catch {
    return null;
  }
}

export function setOtpChallengeCookie(
  response: NextResponse,
  token: string
): void {
  response.cookies.set(CHALLENGE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: CHALLENGE_TTL_SECONDS,
    path: '/',
  });
}

/** Clear it once a session has been issued, so it cannot be replayed. */
export function clearOtpChallengeCookie(response: NextResponse): void {
  response.cookies.set(CHALLENGE_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
}

export { CHALLENGE_COOKIE };
