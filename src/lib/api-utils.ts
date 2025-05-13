import { NextRequest } from 'next/server';
import { TokenPayload } from '@/types/auth';

export function getUserFromRequest(request: NextRequest): TokenPayload | null {
  try {
    const userData = request.headers.get('x-user-data');
    if (!userData) return null;
    return JSON.parse(userData) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export function getUserIdFromRequest(request: NextRequest): number | null {
  const userId = request.headers.get('x-user-id');
  return userId ? parseInt(userId, 10) : null;
}

export function getUserRoleFromRequest(request: NextRequest): string | null {
  return request.headers.get('x-user-role');
}

export function getUserEmailFromRequest(request: NextRequest): string | null {
  return request.headers.get('x-user-email');
}

export function checkUserRole(
  request: NextRequest,
  allowedRoles: string[]
): boolean {
  const user = getUserFromRequest(request);
  if (!user) return false;

  return allowedRoles.includes(user.role);
}

export function requireAuth(request: NextRequest): {
  success: boolean;
  user?: TokenPayload;
  error?: string;
} {
  const user = getUserFromRequest(request);

  if (!user) {
    return {
      success: false,
      error: 'Authentication required',
    };
  }

  return {
    success: true,
    user,
  };
}

export function requireRole(
  request: NextRequest,
  allowedRoles: string[]
): {
  success: boolean;
  user?: TokenPayload;
  error?: string;
} {
  const authResult = requireAuth(request);

  if (!authResult.success) {
    return authResult;
  }

  if (!checkUserRole(request, allowedRoles)) {
    return {
      success: false,
      error: 'Insufficient permissions',
    };
  }

  return {
    success: true,
    user: authResult.user,
  };
}
