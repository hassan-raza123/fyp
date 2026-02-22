import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-strong-secret-key-for-development-12345'
);

// Public routes that never require authentication
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/verify-otp',
  '/forgot-password',
  '/reset-password',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/verify',
  '/api/auth/verify-otp',
  '/api/auth/resend-otp',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/check-reset-token',
  '/api/contact',
  '/api/cron/update-semester-statuses',
];

// Role-to-path prefix mapping for page-level access control
const ROLE_PAGE_PREFIXES: Record<string, string> = {
  super_admin: '/super-admin',
  admin: '/admin',
  faculty: '/faculty',
  student: '/student',
};

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public routes and Next.js internals
  if (isPublic(pathname)) return NextResponse.next();

  // Verify the JWT stored in the 'token' cookie
  const token = request.cookies.get('token')?.value;

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;

    // For page routes, enforce that the user's role matches the path prefix
    if (!pathname.startsWith('/api/')) {
      for (const [routeRole, prefix] of Object.entries(ROLE_PAGE_PREFIXES)) {
        if (pathname.startsWith(prefix)) {
          if (role !== routeRole) {
            // Redirect to the user's own dashboard
            const ownPrefix = ROLE_PAGE_PREFIXES[role] ?? '/login';
            return NextResponse.redirect(new URL(ownPrefix, request.url));
          }
          break;
        }
      }
    }

    return NextResponse.next();
  } catch {
    // Invalid or expired token
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }
}

export const config = {
  matcher: [
    // Match all routes except Next.js static assets and image optimisation
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
