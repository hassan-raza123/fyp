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

// Auth routes that should redirect to dashboard if user is logged in
const authRoutes = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/verify-otp',
];

// Public web routes that don't require authentication
const publicWebRoutes = ['/', '/features', '/about', '/contact'];

// Public API routes that don't require authentication
const publicApiRoutes = [
  '/api/auth/login',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-otp',
  '/api/auth/verify',
];

// Function to get user's dashboard based on role
const getUserDashboard = (userRole: string): string => {
  // Get dashboard based on role
  return (
    dashboardRoutes[userRole as keyof typeof dashboardRoutes] || '/dashboard'
  );
};

// Function to verify token and get user details
async function verifyToken(token: string) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return {
      isValid: true,
      userRoles: (payload.role as string).split(','),
      userId: payload.userId as string,
      email: payload.email as string,
      userData: payload.userData,
    };
  } catch (error) {
    return {
      isValid: false,
      userRoles: [],
      userId: '',
      email: '',
      userData: null,
    };
  }
}

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
      const { isValid, userRoles, userId, email, userData } = await verifyToken(
        token
      );

      if (!isValid || !userRoles.length) {
        return NextResponse.json(
          { error: 'Invalid or expired authentication token' },
          { status: 401 }
        );
      }

      // Add user info to request headers for API routes
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', userId as string);
      requestHeaders.set('x-user-email', email as string);
      requestHeaders.set('x-user-role', userRoles.join(','));
      requestHeaders.set('x-user-data', JSON.stringify(userData));

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

  // If user is trying to access auth routes
  if (authRoutes.some((route) => path.startsWith(route))) {
    if (token) {
      try {
        // Verify the token
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);

        // If token is valid, redirect to dashboard
        const userRole = payload.role as string;
        const dashboard = getUserDashboard(userRole);

        // Clear any existing cookies and redirect
        const response = NextResponse.redirect(new URL(dashboard, request.url));
        return response;
      } catch (error) {
        // If token is invalid, clear it
        const response = NextResponse.next();
        response.cookies.delete(AUTH_TOKEN_COOKIE);
        return response;
      }
    }
    // If no token, allow access to auth routes
    return NextResponse.next();
  }

  // For all other routes, require authentication
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Verify the token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    // Get user roles from token
    const userRole = payload.role as string;

    // If accessing another dashboard/route, make sure user has permission
    if (
      path.startsWith('/admin') &&
      !['super_admin', 'sub_admin'].includes(userRole)
    ) {
      return NextResponse.redirect(
        new URL(getUserDashboard(userRole), request.url)
      );
    }

    if (path.startsWith('/faculty') && userRole !== 'teacher') {
      return NextResponse.redirect(
        new URL(getUserDashboard(userRole), request.url)
      );
    }

    if (path.startsWith('/student') && userRole !== 'student') {
      return NextResponse.redirect(
        new URL(getUserDashboard(userRole), request.url)
      );
    }

    if (
      path.startsWith('/department') &&
      !['department_admin', 'child_admin'].includes(userRole)
    ) {
      return NextResponse.redirect(
        new URL(getUserDashboard(userRole), request.url)
      );
    }

    // Allow access
    return NextResponse.next();
  } catch (error) {
    // If token is invalid, redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete(AUTH_TOKEN_COOKIE);
    return response;
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
