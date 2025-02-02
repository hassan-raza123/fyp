import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { verifyToken } from './lib/jwt';

// Dashboard routes based on user roles
const dashboardRoutes = {
  student: '/student/dashboard',
  teacher: '/faculty/dashboard',
  super_admin: '/admin/dashboard',
  department_admin: '/department/dashboard',
  child_admin: '/sub-admin/dashboard',
};

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/dashboard',
  '/features',
  '/about',
  '/forgot-password',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
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

    return NextResponse.next();
  } catch (error) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
