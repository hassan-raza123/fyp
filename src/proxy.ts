import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { AUTH_TOKEN_COOKIE, COOKIE_OPTIONS } from '@/constants/auth';

// Use same secret resolution as auth.ts so sign and verify always match.
// No fallback: an unset JWT_SECRET must fail rather than silently fall back to
// a publicly known value that anyone could use to forge tokens.
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'JWT_SECRET environment variable is missing or shorter than 32 characters.'
    );
  }
  return new TextEncoder().encode(secret);
};

// Where a user with a temporary password is forced to go
const CHANGE_PASSWORD_PATH = '/change-password';

// Auth routes that should redirect to dashboard if user is logged in
const authRoutes = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/verify-otp',
];

// Public web routes that don't require authentication.
// `/surveys/<token>` is the external survey page used by employers and alumni,
// who have no account — the token in the URL is the credential.
const publicWebRoutes = [
  '/',
  '/surveys',
  // Terms and privacy: procurement reads these before anyone has an account.
  '/legal',
];

/**
 * Every top-level segment that has pages behind a session.
 *
 * Together with `publicWebRoutes` and `authRoutes` above, this covers every
 * page route in `src/app`: the only top-level segments that exist are the
 * three public ones, the four auth ones, and the five here. That is why a
 * path matching none of the three lists can be answered with a 404 rather
 * than a redirect — there is no page there to protect.
 *
 * Adding a new top-level protected segment means adding it here too.
 */
const protectedWebPrefixes = [
  '/super-admin',
  '/admin',
  '/faculty',
  '/student',
  CHANGE_PASSWORD_PATH,
];

// Public API routes that don't require authentication (exact match)
const publicApiRoutes = [
  '/api/auth/login',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-otp',
  '/api/auth/verify',
  '/api/auth/resend-otp',
  '/api/contact',
  // External (token-authenticated) survey submission — see note above
  '/api/surveys/respond-public',
  // Cron endpoint: authenticates itself with CRON_SECRET, not a session cookie
  '/api/cron/update-semester-statuses',
  // Test-only OTP readback; the route itself 404s unless E2E_TEST_MODE is on
  '/api/e2e/otp',
];

// Public API routes matched by pattern, for dynamic segments
const publicApiRoutePatterns = [
  // Answering an external survey. The `token` query parameter is the
  // credential and the handler verifies it.
  //
  // `/api/surveys/<id>/public` is deliberately *not* here: that route mints
  // the token, and handing out a credential is a staff action even though
  // using it is not.
  /^\/api\/surveys\/\d+\/external-respond$/,
];

function isPublicApiRoute(path: string): boolean {
  return (
    publicApiRoutes.includes(path) ||
    publicApiRoutePatterns.some((pattern) => pattern.test(path))
  );
}

// Function to get user's dashboard based on role
function getUserDashboard(role: string): string {
  switch (role) {
    case 'super_admin':
      return '/super-admin';
    case 'admin':
      return '/admin';
    case 'faculty':
      return '/faculty';
    case 'student':
      return '/student';
    default:
      return '/login';
  }
}

// Function to verify token and get user details
async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());

    // Ensure userId is converted to string for header
    const userId = payload.userId ? String(payload.userId) : '';
    const userData = payload.userData as
      | { mustChangePassword?: boolean }
      | undefined;

    return {
      isValid: true,
      userRole: payload.role as string,
      userId: userId,
      email: payload.email as string,
      userData: payload.userData,
      mustChangePassword: userData?.mustChangePassword === true,
    };
  } catch {
    // Invalid/expired or wrong-secret token – caller will clear cookie
    return {
      isValid: false,
      userRole: null,
      userId: '',
      email: '',
      userData: null,
      mustChangePassword: false,
    };
  }
}

// Function to check if route is allowed for user role
function isRouteAllowedForRole(path: string, userRole: string): boolean {
  // Super admin routes - only for super_admin
  if (path.startsWith('/super-admin')) {
    return userRole === 'super_admin';
  }

  // Department admin routes - only for admin
  if (path.startsWith('/admin')) {
    return userRole === 'admin';
  }

  // Faculty routes - only for faculty
  if (path.startsWith('/faculty')) {
    return userRole === 'faculty';
  }

  // Student routes - only for student
  if (path.startsWith('/student')) {
    return userRole === 'student';
  }

  return false;
}

// Clear auth cookie (must use same path as when set, else browser keeps it)
function clearAuthCookie(response: NextResponse) {
  response.cookies.set(AUTH_TOKEN_COOKIE, '', {
    path: COOKIE_OPTIONS.path,
    maxAge: 0,
    httpOnly: COOKIE_OPTIONS.httpOnly,
    sameSite: COOKIE_OPTIONS.sameSite,
    secure: COOKIE_OPTIONS.secure,
  });
}

// Function to create redirect response with token cleanup
function createLoginRedirect(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/login', request.url));
  clearAuthCookie(response);
  return response;
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Allow static files and images
  if (
    path.startsWith('/_next/') ||
    path.startsWith('/favicon.ico') ||
    path.startsWith('/logo.png') ||
    path.match(
      /\.(jpg|jpeg|png|gif|svg|ico|webp|avif|css|js|woff|woff2|ttf|eot)$/i
    )
  ) {
    return NextResponse.next();
  }

  // Allow public web routes.
  //
  // Matched on path *segments*, not a bare prefix: `startsWith('/surveys')`
  // also matched `/surveysanything`, so any route whose name merely began with
  // a public one was reachable without a session.
  if (
    publicWebRoutes.some(
      (route) =>
        path === route || (route !== '/' && path.startsWith(`${route}/`))
    )
  ) {
    return NextResponse.next();
  }

  // Get token from cookies
  const token = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;

  // Handle API routes
  if (path.startsWith('/api/')) {
    // Allow public API routes
    if (isPublicApiRoute(path)) {
      return NextResponse.next();
    }

    // For protected API routes, token is required
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication token is required' },
        { status: 401 }
      );
    }

    // Verify token for API routes
    const {
      isValid,
      userRole,
      userId,
      email,
      userData,
      mustChangePassword: mustChangePasswordApi,
    } = await verifyToken(token);

    if (!isValid || !userRole) {
      return NextResponse.json(
        { error: 'Invalid or expired authentication token' },
        { status: 401 }
      );
    }

    // While a temporary password is in force, only the auth endpoints are
    // reachable. The forced flow must go through /api/auth/change-password
    // specifically, because that is the one route that re-issues the token —
    // the role-specific routes clear the database flag but leave the caller
    // holding a stale token that would keep redirecting them here.
    if (mustChangePasswordApi && !path.startsWith('/api/auth/')) {
      return NextResponse.json(
        {
          error: 'You must change your password before using the system.',
          code: 'PASSWORD_CHANGE_REQUIRED',
        },
        { status: 403 }
      );
    }

    // At this point, userRole is guaranteed to be a string (not null)
    // Add user info to request headers for API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', userId);
    requestHeaders.set('x-user-email', email);
    requestHeaders.set('x-user-role', userRole);
    requestHeaders.set('x-user-data', JSON.stringify(userData));

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Handle auth routes (login, forgot-password, etc.)
  if (authRoutes.some((route) => path.startsWith(route))) {
    if (token) {
      // If user has token and trying to access auth routes, verify and redirect to dashboard
      const { isValid, userRole } = await verifyToken(token);

      if (isValid && userRole) {
        const dashboard = getUserDashboard(userRole);

        return NextResponse.redirect(new URL(dashboard, request.url));
      } else {
        // Invalid/expired token (e.g. wrong secret or old cookie) – clear it and show login
        const response = NextResponse.next();
        clearAuthCookie(response);
        return response;
      }
    }

    // No token, allow access to auth routes
    return NextResponse.next();
  }

  // For all other routes (protected routes), authentication is required.
  //
  // Unless the path matches nothing the app serves. Every page route lives
  // under `publicWebRoutes`, `authRoutes` or `protectedWebPrefixes`, so a
  // path outside all three is a URL that does not exist — and answering it
  // with a redirect to /login meant `not-found.tsx` could never render for a
  // signed-out visitor. A mistyped address or a stale inbound link on the
  // marketing site landed on a sign-in form, which reads as "you need an
  // account to see this" rather than "there is nothing here", and let a
  // crawler follow any dead link to a 200. Signed-in users already saw the
  // 404, because their token carried them past this branch.
  const isProtectedWebRoute = protectedWebPrefixes.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );

  if (!token) {
    if (isProtectedWebRoute) {
      return createLoginRedirect(request);
    }
    // Hand it to the router, which matches nothing and renders
    // `not-found.tsx` with a 404 of its own.
    return NextResponse.next();
  }

  // Verify token — once. The result is reused below for the headers rather
  // than verifying the same token a second time.
  const { isValid, userRole, mustChangePassword, userId, email, userData } =
    await verifyToken(token);

  if (!isValid || !userRole) {
    return createLoginRedirect(request);
  }

  // An account still holding an admin-issued temporary password may go nowhere
  // except the change-password screen.
  if (mustChangePassword && path !== CHANGE_PASSWORD_PATH) {
    return NextResponse.redirect(new URL(CHANGE_PASSWORD_PATH, request.url));
  }

  // At this point, userRole is guaranteed to be a string (not null)
  // Store it in a const to help TypeScript understand the type narrowing
  const verifiedUserRole: string = userRole;

  // Role-specific protected routes. `/change-password` is in
  // `protectedWebPrefixes` but is not role-specific — every role reaches it —
  // so it is excluded here.
  const isRoleScopedRoute =
    isProtectedWebRoute && path !== CHANGE_PASSWORD_PATH;

  if (isRoleScopedRoute) {
    // Check if user has permission for this route
    if (!isRouteAllowedForRole(path, verifiedUserRole)) {
      return createLoginRedirect(request);
    }
  }

  // Add user info to request headers for protected routes
  // At this point, we know userRole is valid (checked above)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', userId);
  requestHeaders.set('x-user-email', email);
  requestHeaders.set('x-user-role', verifiedUserRole);
  requestHeaders.set('x-user-data', JSON.stringify(userData));

  // All checks passed, allow access
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Configure which routes to run proxy on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};

