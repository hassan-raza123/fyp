import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Dashboard routes based on user roles
const dashboardRoutes = {
  student: '/student/dashboard',
  teacher: '/faculty/dashboard',
  super_admin: '/admin/dashboard',
  sub_admin: '/admin/dashboard',
  department_admin: '/department/dashboard',
  child_admin: '/sub-admin/dashboard',
};

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/forgot-password',
  '/reset-password',
  '/features',
  '/about',
  '/contact',
  '/verify-otp',
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Handle API routes
  if (path.startsWith('/api/')) {
    try {
      // Get the token from cookies
      const token = request.cookies.get('auth-token')?.value;

      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Verify the token
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);

      // Add user info to request headers for API routes
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', payload.userId as string);
      requestHeaders.set('x-user-email', payload.email as string);
      requestHeaders.set('x-user-role', payload.role as string);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  }

  // Handle page routes
  // Check if the route is public
  if (publicRoutes.some((route) => path.startsWith(route))) {
    return NextResponse.next();
  }

  // Get the token from cookies
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Verify the token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    const userRole = payload.role as string;
    const userDashboard =
      dashboardRoutes[userRole as keyof typeof dashboardRoutes];

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
      if (userRole === 'super_admin' || userRole === 'sub_admin') {
        // Special handling for Sub Admin restrictions
        if (userRole === 'sub_admin') {
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
        userRole !== 'department_admin' &&
        userRole !== 'super_admin' &&
        userRole !== 'sub_admin'
      ) {
        return NextResponse.redirect(new URL(userDashboard, request.url));
      }
    }

    // Check child admin routes
    if (path.startsWith('/sub-admin')) {
      if (
        userRole !== 'child_admin' &&
        userRole !== 'department_admin' &&
        userRole !== 'super_admin' &&
        userRole !== 'sub_admin'
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
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
