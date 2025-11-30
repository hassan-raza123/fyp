import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import { compare } from 'bcryptjs';
import { NextRequest } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';
import { TokenPayload } from '@/types/auth';
import { randomBytes } from 'crypto';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name: string;
    status: string;
    role: string;
  }

  interface Session {
    user: User;
  }
}

// ============================================================================
// JWT Token Functions
// ============================================================================

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-strong-secret-key-for-development-12345'
);

/**
 * Create JWT token from payload
 */
export async function createToken(payload: TokenPayload): Promise<string> {
  try {
    return await new SignJWT({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      userData: payload.userData,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(JWT_SECRET);
  } catch (error) {
    console.error('Token creation error:', error);
    throw new Error('Failed to create token');
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Sign in',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'example@example.com',
        },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await prisma.users.findUnique({
          where: {
            email: credentials.email,
          },
          include: {
            userrole: {
              include: {
                role: true,
              },
            },
          },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.password_hash
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.first_name + ' ' + user.last_name,
          status: user.status,
          role: user.userrole?.role?.name || '',
        };
      },
    }),
  ],
  callbacks: {
    session: ({ session, token }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          status: token.status,
          role: token.role,
        },
      };
    },
    jwt: ({ token, user }) => {
      if (user) {
        return {
          ...token,
          id: user.id,
          status: user.status,
          role: user.role,
        };
      }
      return token;
    },
  },
};

function parseJwtPayload(payload: any): TokenPayload {
  return {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    userData: payload.userData,
  };
}

export function checkUserRole(
  user: TokenPayload,
  allowedRoles: string[]
): boolean {
  return allowedRoles.includes(user.role);
}

// ============================================================================
// Legacy Header Functions (Deprecated - use requireAuth instead)
// ============================================================================
// These functions read from headers (x-user-data, x-user-id, etc.)
// Only kept for backward compatibility with old code
// New code should use requireAuth() which reads from cookies

export function getUserFromRequest(request: NextRequest): TokenPayload | null {
  try {
    const userData = request.headers.get('x-user-data');
    if (!userData) return null;
    return JSON.parse(userData) as TokenPayload;
  } catch {
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

export async function generatePasswordResetToken(userId: number) {
  // Generate a random token
  const token = randomBytes(32).toString('hex');

  // Set expiration to 1 hour from now
  const expiresAt = new Date(Date.now() + 3600000);

  // Create or update the password reset token
  const resetToken = await prisma.passwordresets.create({
    data: {
      userId,
      token,
      expiresAt,
      updatedAt: new Date(),
    },
  });

  return resetToken;
}

/**
 * Verify JWT token from request cookies
 * Main authentication function - use this for all protected routes
 */
export async function requireAuth(request: NextRequest): Promise<{
  success: boolean;
  user?: TokenPayload;
  error?: string;
}> {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return {
        success: false,
        error: 'No token provided',
      };
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);

    return {
      success: true,
      user: parseJwtPayload(payload),
    };
  } catch (error) {
    return {
      success: false,
      error: 'Invalid token',
    };
  }
}

export async function requireRole(
  request: NextRequest,
  allowedRoles: string[]
): Promise<{
  success: boolean;
  user?: TokenPayload;
  error?: string;
}> {
  const authResult = await requireAuth(request);

  if (!authResult.success) {
    return authResult;
  }

  if (!authResult.user || !checkUserRole(authResult.user, allowedRoles)) {
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

// ============================================================================
// Faculty Utilities
// ============================================================================

/**
 * Get the faculty ID for the logged-in user
 * @param request - NextRequest object
 * @returns Faculty ID or null if not found or not a faculty member
 */
export async function getFacultyIdFromRequest(
  request: NextRequest
): Promise<number | null> {
  try {
    const { success, user } = await requireAuth(request);
    if (!success || !user) {
      return null;
    }

    // Check if user is a faculty member
    if (user.role !== 'faculty') {
      return null;
    }

    // Get faculty record
    const faculty = await prisma.faculties.findFirst({
      where: {
        userId: user.userId,
      },
      select: {
        id: true,
      },
    });

    return faculty?.id || null;
  } catch (error) {
    console.error('Error getting faculty ID:', error);
    return null;
  }
}

/**
 * Get the full faculty record for the logged-in user
 * @param request - NextRequest object
 * @returns Faculty record or null
 */
export async function getFacultyFromRequest(request: NextRequest) {
  try {
    const { success, user } = await requireAuth(request);
    if (!success || !user) {
      return null;
    }

    // Check if user is a faculty member
    if (user.role !== 'faculty') {
      return null;
    }

    // Get faculty record with relations
    const faculty = await prisma.faculties.findFirst({
      where: {
        userId: user.userId,
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            status: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return faculty;
  } catch (error) {
    console.error('Error getting faculty:', error);
    return null;
  }
}

// ============================================================================
// Student Utilities
// ============================================================================

/**
 * Get the student ID for the logged-in user
 * @param request - NextRequest object
 * @returns Student ID or null if not found or not a student
 */
export async function getStudentIdFromRequest(
  request: NextRequest
): Promise<number | null> {
  try {
    const { success, user } = await requireAuth(request);
    if (!success || !user) {
      return null;
    }

    // Check if user is a student
    if (user.role !== 'student') {
      return null;
    }

    // Get student record
    const student = await prisma.students.findFirst({
      where: {
        userId: user.userId,
      },
      select: {
        id: true,
      },
    });

    return student?.id || null;
  } catch (error) {
    console.error('Error getting student ID:', error);
    return null;
  }
}

/**
 * Get the full student record for the logged-in user
 * @param request - NextRequest object
 * @returns Student record or null
 */
export async function getStudentFromRequest(request: NextRequest) {
  try {
    const { success, user } = await requireAuth(request);
    if (!success || !user) {
      return null;
    }

    // Check if user is a student
    if (user.role !== 'student') {
      return null;
    }

    // Get student record with relations
    const student = await prisma.students.findFirst({
      where: {
        userId: user.userId,
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            status: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        program: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        batch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return student;
  } catch (error) {
    console.error('Error getting student:', error);
    return null;
  }
}

// ============================================================================
// Department Utilities
// ============================================================================

/**
 * Get current department ID from settings
 * Returns the department ID based on department code in settings
 */
export async function getCurrentDepartmentId(request?: NextRequest): Promise<number | null> {
  try {
    // If request is provided, get department from admin's faculty record
    if (request) {
      const { success, user } = await requireAuth(request);
      if (success && user && user.role === 'admin') {
        const faculty = await prisma.faculties.findFirst({
          where: { userId: user.userId },
          select: { departmentId: true },
        });
        if (faculty && faculty.departmentId) {
          return faculty.departmentId;
        }
      }
    }
    
    // Fallback: Try to get from settings (for backward compatibility)
    const settings = await prisma.settings.findFirst();
    if (!settings) {
      return null;
    }

    // Parse system settings
    const systemSettings =
      typeof settings.system === 'string'
        ? JSON.parse(settings.system)
        : settings.system;

    const departmentCode = systemSettings?.departmentCode;
    if (!departmentCode) {
      return null;
    }

    // Find department by code
    const department = await prisma.departments.findUnique({
      where: { code: departmentCode },
      select: { id: true },
    });

    return department?.id || null;
  } catch (error) {
    console.error('Error getting current department ID:', error);
    return null;
  }
}

/**
 * Get current department info from settings
 */
export async function getCurrentDepartment() {
  try {
    const settings = await prisma.settings.findFirst();
    if (!settings) {
      return null;
    }

    const systemSettings =
      typeof settings.system === 'string'
        ? JSON.parse(settings.system)
        : settings.system;

    const departmentCode = systemSettings?.departmentCode;
    const departmentName = systemSettings?.departmentName;

    if (!departmentCode) {
      return null;
    }

    const department = await prisma.departments.findUnique({
      where: { code: departmentCode },
      include: {
        _count: {
          select: {
            programs: true,
            faculties: true,
            students: true,
            courses: true,
          },
        },
      },
    });

    return department;
  } catch (error) {
    console.error('Error getting current department:', error);
    return null;
  }
}

/**
 * Create or update department based on settings
 * This is called when settings are saved
 */
export async function syncDepartmentFromSettings() {
  try {
    const settings = await prisma.settings.findFirst();
    if (!settings) {
      return null;
    }

    const systemSettings =
      typeof settings.system === 'string'
        ? JSON.parse(settings.system)
        : settings.system;

    const departmentCode = systemSettings?.departmentCode;
    const departmentName = systemSettings?.departmentName;

    if (!departmentCode || !departmentName) {
      return null;
    }

    // Create or update department
    const department = await prisma.departments.upsert({
      where: { code: departmentCode },
      update: {
        name: departmentName,
        code: departmentCode,
        status: 'active',
        updatedAt: new Date(),
      },
      create: {
        name: departmentName,
        code: departmentCode,
        status: 'active',
      },
    });

    return department;
  } catch (error) {
    console.error('Error syncing department from settings:', error);
    return null;
  }
}
