import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { verifyToken } from './lib/jwt';

// Dashboard routes based on user roles
const dashboardRoutes = {
  student: '/student/dashboard',
  teacher: '/faculty/dashboard',
  super_admin: '/admin/dashboard',
  sub_admin: '/admin/dashboard', // Sub Admin uses same dashboard as Super Admin
  department_admin: '/department/dashboard',
  child_admin: '/sub-admin/dashboard',
};

// Role hierarchy and permissions
const roleHierarchy = {
  super_admin: ['super_admin', 'sub_admin', 'department_admin', 'child_admin', 'teacher', 'student'],
  sub_admin: ['department_admin', 'child_admin', 'teacher', 'student'],
  department_admin: ['child_admin', 'teacher', 'student'],
  child_admin: ['teacher', 'student'],
  teacher: ['student'],
  student: [],
};

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/dashboard',
  '/features',
  '/about',
  '/forgot-password',
  '/contact',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/team') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/api/auth/login') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Allow access to public routes
  if (publicRoutes.some((route) => pathname === route)) {
    return NextResponse.next();
  }

  // Get token from cookies
  const token = request.cookies.get('token')?.value;

  // Handle login page access
  if (pathname === '/login') {
    if (!token) {
      return NextResponse.next();
    }

    try {
      const decoded = await verifyToken(token);
      if (decoded?.role) {
        const redirectTo =
          dashboardRoutes[decoded.role as keyof typeof dashboardRoutes];
        if (redirectTo) {
          return NextResponse.redirect(new URL(redirectTo, request.url));
        }
      }
    } catch {
      return NextResponse.next();
    }
  }

  // For all other routes, check if user is authenticated
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const decoded = await verifyToken(token);
    if (!decoded) {
      throw new Error('Invalid token');
    }

    const userRole = decoded.role;
    const userDashboard =
      dashboardRoutes[userRole as keyof typeof dashboardRoutes];

    // Check if trying to access dashboard routes
    if (
      Object.values(dashboardRoutes).some((route) => pathname.startsWith(route))
    ) {
      if (!pathname.startsWith(userDashboard)) {
        return NextResponse.redirect(new URL(userDashboard, request.url));
      }
    }

    // Check role-based access for admin routes
    if (pathname.startsWith('/admin')) {
      if (userRole === 'super_admin' || userRole === 'sub_admin') {
        // Special handling for Sub Admin restrictions
        if (userRole === 'sub_admin') {
          // Sub Admin cannot access these routes
          if (
            pathname.includes('/admin/super-admin') ||
            pathname.includes('/admin/system-settings')
          ) {
            return NextResponse.redirect(new URL('/admin/dashboard', request.url));
          }
        }
      } else {
        return NextResponse.redirect(new URL(userDashboard, request.url));
      }
    }

    // Check department admin access
    if (pathname.startsWith('/department')) {
      if (
        userRole !== 'department_admin' &&
        userRole !== 'super_admin' &&
        userRole !== 'sub_admin'
      ) {
        return NextResponse.redirect(new URL(userDashboard, request.url));
      }
    }

    // Check child admin access
    if (pathname.startsWith('/sub-admin')) {
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
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }
}

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
    '/((?!api|_next/static|_next/image|favicon.ico|public|about|features|contact).*)',
  ],
};
