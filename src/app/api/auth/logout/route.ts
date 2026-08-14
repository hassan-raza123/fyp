import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getUserId } from '@/lib/authz';
import { writeAuthAuditLog } from '@/lib/audit-log';
import { AUTH_TOKEN_COOKIE, COOKIE_OPTIONS } from '@/constants/auth';
import { clearOtpChallengeCookie } from '@/lib/otp-challenge';

export async function POST(request: NextRequest) {
  // Best effort: read who is signing out so the event can be attributed. A
  // token that no longer verifies still gets its cookie cleared below — logout
  // must always succeed, whatever state the session is in.
  const { success, user } = await requireAuth(request);

  const response = NextResponse.json(
    { success: true, message: 'Logged out successfully' },
    { status: 200 }
  );

  // Clear the authentication cookie. The options must match the ones it was
  // set with, or the browser keeps the original.
  response.cookies.set(AUTH_TOKEN_COOKIE, '', {
    httpOnly: COOKIE_OPTIONS.httpOnly,
    secure: COOKIE_OPTIONS.secure,
    sameSite: COOKIE_OPTIONS.sameSite,
    path: COOKIE_OPTIONS.path,
    maxAge: 0, // Expire immediately
  });

  // A half-finished sign-in should not survive a logout either.
  clearOtpChallengeCookie(response);

  if (success && user) {
    const userId = getUserId(user);
    if (userId) {
      await writeAuthAuditLog(request, userId, 'auth.logout', {
        email: user.email,
        role: user.role,
      });
    }
  }

  return response;
}
