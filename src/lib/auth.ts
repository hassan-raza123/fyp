import jwt from 'jsonwebtoken';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import { compare } from 'bcryptjs';
import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
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

export async function verifyAuth(token: string) {
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET!);
    return verified;
  } catch {
    throw new Error('Invalid token');
  }
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
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

        const user = await prisma.user.findUnique({
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
          role: user.userrole.map((ur) => ur.role.name).join(','),
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

export async function verifyToken(request: NextRequest): Promise<{
  success: boolean;
  user?: TokenPayload;
  error?: string;
}> {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return {
        success: false,
        error: 'No token provided',
      };
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

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

export function getUserIdFromToken(request: NextRequest): number | null {
  const userId = request.headers.get('x-user-id');
  return userId ? parseInt(userId, 10) : null;
}

export function getUserRoleFromToken(request: NextRequest): string | null {
  return request.headers.get('x-user-role');
}

export function getUserEmailFromToken(request: NextRequest): string | null {
  return request.headers.get('x-user-email');
}

export async function generatePasswordResetToken(userId: number) {
  // Generate a random token
  const token = randomBytes(32).toString('hex');

  // Set expiration to 1 hour from now
  const expiresAt = new Date(Date.now() + 3600000);

  // Create or update the password reset token
  const resetToken = await prisma.passwordreset.create({
    data: {
      userId,
      token,
      expiresAt,
      updatedAt: new Date(),
    },
  });

  return resetToken.token;
}
