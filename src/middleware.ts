import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/jwt';

export async function middleware(request: NextRequest) {
  // Exclude login and public routes
  if (
    request.nextUrl.pathname.startsWith('/api/auth/login') ||
    request.nextUrl.pathname === '/login'
  ) {
    return NextResponse.next();
  }

  // Check for token in cookies or Authorization header
  const token =
    request.cookies.get('token')?.value ||
    request.headers.get('Authorization')?.split('Bearer ')[1];

  if (!token) {
    if (request.nextUrl.pathname.startsWith('/api')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication required',
        },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const decoded = verifyToken(token);
    if (!decoded) {
      throw new Error('Invalid token');
    }

    // Add user info to request headers for use in API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', decoded.userId);
    requestHeaders.set('x-user-role', decoded.role);

    return NextResponse.next({
      headers: requestHeaders,
    });
  } catch (error) {
    if (request.nextUrl.pathname.startsWith('/api')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid token',
        },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/api/:path*', '/((?!_next/static|favicon.ico|login).*)'],
};
