import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { verifyToken } from './lib/jwt';

// Dashboard routes based on user roles
const dashboardRoutes = {
  student: '/student/dashboard',
  teacher: '/faculty/dashboard',
  super_admin: '/admin/dashboard',
  sub_admin: '/admin/dashboard',
  department_admin: '/department/dashboard',
  child_admin: '/sub-admin/dashboard',
};

// Role hierarchy and permissions
// const roleHierarchy = {
//   super_admin: ['super_admin', 'sub_admin', 'department_admin', 'child_admin', 'teacher', 'student'],
//   sub_admin: ['department_admin', 'child_admin', 'teacher', 'student'],
//   department_admin: ['child_admin', 'teacher', 'student'],
//   child_admin: ['teacher', 'student'],
//   teacher: ['student'],
//   student: [],
// };

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

// Admin routes that require specific admin roles
// const adminRoutes = {
//   super_admin: [
//     '/admin/dashboard',
//     '/admin/system-settings',
//     '/admin/manage-users',
//     '/admin/manage-roles',
//   ],
//   sub_admin: [
//     '/admin/dashboard',
//     '/admin/manage-users',
//     '/admin/manage-departments',
//   ],
//   department_admin: [
//     '/department/dashboard',
//     '/department/manage-faculty',
//     '/department/manage-students',
//     '/department/manage-courses',
//   ],
//   child_admin: [
//     '/sub-admin/dashboard',
//     '/sub-admin/manage-attendance',
//     '/sub-admin/manage-schedules',
//   ],
// };

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Check for authentication
  const token = request.cookies.get('token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const decoded = await verifyToken(token);
    if (!decoded || !decoded.role) {
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

    // Check admin routes access
    if (pathname.startsWith('/admin')) {
      if (userRole === 'super_admin' || userRole === 'sub_admin') {
        // Special handling for Sub Admin restrictions
        if (userRole === 'sub_admin') {
          // Sub Admin cannot access these routes
          if (
            pathname.startsWith('/admin/system-settings') ||
            pathname.startsWith('/admin/manage-roles')
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
    if (pathname.startsWith('/department')) {
      if (
        userRole !== 'department_admin' &&
        userRole !== 'super_admin' &&
        userRole !== 'sub_admin'
      ) {
        return NextResponse.redirect(new URL(userDashboard, request.url));
      }
    }

    // Check child admin routes
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
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
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
     * - images folder
     * - team folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public|images|team|about|features|contact).*)',
  ],
};
