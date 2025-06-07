import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { AUTH_TOKEN_COOKIE } from '@/constants/auth';

// Dashboard routes based on user roles
const dashboardRoutes = {
  student: '/student',
  teacher: '/faculty',
  super_admin: '/admin',
  sub_admin: '/admin',
  department_admin: '/department',
  child_admin: '/department',
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
  '/api/auth/resend-otp',
];

// Function to get user's dashboard based on role
const getUserDashboard = (userRole: string): string => {
  return dashboardRoutes[userRole as keyof typeof dashboardRoutes] || '/login';
};

// Function to verify token and get user details
async function verifyToken(token: string) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    return {
      isValid: true,
      userRole: payload.role as string,
      userId: payload.userId as string,
      email: payload.email as string,
      userData: payload.userData,
    };
  } catch (error) {
    return {
      isValid: false,
      userRole: '',
      userId: '',
      email: '',
      userData: null,
    };
  }
}

// Function to check if route is allowed for user role
function isRouteAllowedForRole(path: string, userRole: string): boolean {
  // Admin routes - only for super_admin and sub_admin
  if (path.startsWith('/admin')) {
    return ['super_admin', 'sub_admin'].includes(userRole);
  }

  // Faculty routes - only for teacher
  if (path.startsWith('/faculty')) {
    return userRole === 'teacher';
  }

  // Student routes - only for student
  if (path.startsWith('/student')) {
    return userRole === 'student';
  }

  // Department routes - only for department_admin and child_admin
  if (path.startsWith('/department')) {
    return ['department_admin', 'child_admin'].includes(userRole);
  }

  return false;
}

// Function to create redirect response with token cleanup
function createLoginRedirect(request: NextRequest, reason: string) {
  const response = NextResponse.redirect(new URL('/login', request.url));
  response.cookies.delete(AUTH_TOKEN_COOKIE);
  return response;
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Allow public web routes
  if (
    publicWebRoutes.some(
      (route) => path === route || (route !== '/' && path.startsWith(route))
    )
  ) {
    return NextResponse.next();
  }

  // Get token from cookies
  const token = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;

  // Handle API routes
  if (path.startsWith('/api/')) {
    // Allow public API routes
    if (publicApiRoutes.includes(path)) {
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
    const { isValid, userRole, userId, email, userData } = await verifyToken(
      token
    );

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired authentication token' },
        { status: 401 }
      );
    }

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
    console.log('token', token);
    if (token) {
      // If user has token and trying to access auth routes, verify and redirect to dashboard
      const { isValid, userRole } = await verifyToken(token);

      console.log('role', userRole);

      if (isValid && userRole) {
        const dashboard = getUserDashboard(userRole);

        return NextResponse.redirect(new URL(dashboard, request.url));
      } else {
        // Invalid token, clear it and allow access to auth route
        const response = NextResponse.next();
        response.cookies.delete(AUTH_TOKEN_COOKIE);
        return response;
      }
    }

    // No token, allow access to auth routes
    return NextResponse.next();
  }

  // For all other routes (protected routes), authentication is required
  if (!token) {
    return createLoginRedirect(
      request,
      `No token found for protected route: ${path}`
    );
  }

  // Verify token
  const { isValid, userRole } = await verifyToken(token);
  console.log('isValid', userRole);

  if (!isValid || !userRole) {
    return createLoginRedirect(request, `Invalid token for route: ${path}`);
  }

  // Check if the route is a role-specific protected route
  const isProtectedRoute =
    path.startsWith('/admin') ||
    path.startsWith('/faculty') ||
    path.startsWith('/student') ||
    path.startsWith('/department');

  if (isProtectedRoute) {
    // Check if user has permission for this route
    if (!isRouteAllowedForRole(path, userRole)) {
      return createLoginRedirect(
        request,
        `Role ${userRole} not allowed for route: ${path}`
      );
    }
  }

  // All checks passed, allow access
  return NextResponse.next();
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
