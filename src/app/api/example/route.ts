import { NextRequest, NextResponse } from 'next/server';
import { requireRole, getUserFromRequest } from '@/lib/api-utils';

// Example API route that requires authentication
export async function GET(request: NextRequest) {
  // Check if user is authenticated and has required role
  const { success, user, error } = requireRole(request, ['admin', 'teacher']);

  if (!success) {
    return NextResponse.json({ error }, { status: 401 });
  }

  // Access user data from request
  const userId = user?.userId;
  const userRole = user?.role;
  const userEmail = user?.email;

  // Your API logic here
  return NextResponse.json({
    message: 'Access granted',
    user: {
      id: userId,
      email: userEmail,
      role: userRole,
    },
  });
}

// Example API route that requires specific role
export async function POST(request: NextRequest) {
  // Check if user is authenticated and has admin role
  const { success, user, error } = requireRole(request, ['admin']);

  if (!success) {
    return NextResponse.json({ error }, { status: 401 });
  }

  // Get request body
  const body = await request.json();

  // Your API logic here
  return NextResponse.json({
    message: 'Admin action processed',
    data: body,
    user: {
      id: user?.userId,
      email: user?.email,
      role: user?.role,
    },
  });
}

// Example API route that requires any authenticated user
export async function PUT(request: NextRequest) {
  // Check if user is authenticated
  const { success, user, error } = requireAuth(request);

  if (!success) {
    return NextResponse.json({ error }, { status: 401 });
  }

  // Get request body
  const body = await request.json();

  // Your API logic here
  return NextResponse.json({
    message: 'Action processed',
    data: body,
    user: {
      id: user?.userId,
      email: user?.email,
      role: user?.role,
    },
  });
}
