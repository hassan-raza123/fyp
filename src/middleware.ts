import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { AUTH_TOKEN_COOKIE } from '@/constants/auth';

// Dashboard routes based on user roles
const dashboardRoutes = {
  student: '/student/dashboard',
  teacher: '/faculty/dashboard',
  super_admin: '/admin/dashboard',
  sub_admin: '/admin/dashboard',
  department_admin: '/department/dashboard',
  child_admin: '/department/dashboard',
};

// Public web routes that don't require authentication
const publicWebRoutes = [
  '/',
  '/login',
  '/forgot-password',
  '/reset-password',
  '/features',
  '/about',
  '/contact',
  '/verify-otp',
];

// Public API routes that don't require authentication
const publicApiRoutes = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-otp',
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Handle API routes
  if (path.startsWith('/api/')) {
    // Check if it's a public API route
    if (publicApiRoutes.includes(path)) {
      return NextResponse.next();
    }

    try {
      // Get the token from cookies
      const token = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;

      if (!token) {
        return NextResponse.json(
          { error: 'Authentication token is required' },
          { status: 401 }
        );
      }

      // Verify the token
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);

      // Add user info to request headers for API routes
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', payload.userId as string);
      requestHeaders.set('x-user-email', payload.email as string);
      requestHeaders.set('x-user-role', payload.role as string);
      requestHeaders.set('x-user-data', JSON.stringify(payload.userData));

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired authentication token' },
        { status: 401 }
      );
    }
  }

  // Handle web routes
  // Check if the route is public
  if (publicWebRoutes.some((route) => path.startsWith(route))) {
    return NextResponse.next();
  }

  // Get the token from cookies
  const token = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Verify the token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    const userRole = payload.role as string;
    const userRoles = userRole.split(',');
    const userDashboard = userRoles.reduce((dashboard, role) => {
      const roleDashboard =
        dashboardRoutes[role as keyof typeof dashboardRoutes];
      return roleDashboard || dashboard;
    }, '/dashboard');

    // Check if trying to access dashboard routes
    if (
      Object.values(dashboardRoutes).some((route) => path.startsWith(route))
    ) {
      if (!path.startsWith(userDashboard)) {
        return NextResponse.redirect(new URL(userDashboard, request.url));
      }
    }

    // Check admin routes access
    if (path.startsWith('/admin')) {
      if (
        userRoles.includes('super_admin') ||
        userRoles.includes('sub_admin')
      ) {
        // Special handling for Sub Admin restrictions
        if (
          userRoles.includes('sub_admin') &&
          !userRoles.includes('super_admin')
        ) {
          if (
            path.startsWith('/admin/system-settings') ||
            path.startsWith('/admin/manage-roles')
          ) {
            return NextResponse.redirect(
              new URL('/admin/dashboard', request.url)
            );
          }
        }
      } else {
        return NextResponse.redirect(new URL(userDashboard, request.url));
      }
    }

    // Check department admin routes
    if (path.startsWith('/department')) {
      if (
        !userRoles.includes('department_admin') &&
        !userRoles.includes('super_admin') &&
        !userRoles.includes('sub_admin')
      ) {
        return NextResponse.redirect(new URL(userDashboard, request.url));
      }
    }

    // Check child admin routes
    if (path.startsWith('/sub-admin')) {
      if (
        !userRoles.includes('child_admin') &&
        !userRoles.includes('department_admin') &&
        !userRoles.includes('super_admin') &&
        !userRoles.includes('sub_admin')
      ) {
        return NextResponse.redirect(new URL(userDashboard, request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// Configure which routes to run middleware on
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
