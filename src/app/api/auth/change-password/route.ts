import { NextRequest, NextResponse } from 'next/server';
import { compare, hash } from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, createToken } from '@/lib/auth';
import { getUserId } from '@/lib/authz';
import { validatePasswordStrength } from '@/lib/password-utils';
import { AUTH_TOKEN_COOKIE, COOKIE_OPTIONS } from '@/constants/auth';
import { consumeRateLimit, getClientIp } from '@/lib/rate-limit';

const schema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(1, 'New password is required'),
});

const WINDOW = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

/**
 * Change the signed-in user's own password.
 *
 * This is the single endpoint that clears `must_change_password`, so it stays
 * reachable while the proxy is otherwise blocking the account. A fresh token is
 * issued on success — the old one still carries `mustChangePassword: true` and
 * would keep the user trapped on the change-password screen.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = getUserId(auth.user);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Could not resolve the signed-in user' },
        { status: 400 }
      );
    }

    // Guessing the current password must not be cheap
    const limit = await consumeRateLimit({
      key: `change-password:${userId}:${getClientIp(request)}`,
      limit: MAX_ATTEMPTS,
      windowMs: WINDOW,
    });
    if (!limit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minute(s).`,
        },
        { status: 429 }
      );
    }

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          errors: parsed.error.errors.map((e) => e.message),
        },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: { userrole: { include: { role: true } }, student: true, faculty: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (!(await compare(currentPassword, user.password_hash))) {
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { success: false, error: 'The new password must be different from the current one' },
        { status: 400 }
      );
    }

    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      return NextResponse.json(
        { success: false, error: strength.errors.join('. '), errors: strength.errors },
        { status: 400 }
      );
    }

    await prisma.users.update({
      where: { id: userId },
      data: {
        password_hash: await hash(newPassword, 12),
        must_change_password: false,
        password_changed_at: new Date(),
      },
    });

    // Re-issue the token without the mustChangePassword flag
    const role = user.userrole?.role?.name ?? auth.user.role;
    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: role as never,
      userData: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: role as never,
        mustChangePassword: false,
        ...(user.student
          ? {
              rollNumber: user.student.rollNumber,
              departmentId: user.student.departmentId,
              programId: user.student.programId,
            }
          : {}),
        ...(user.faculty
          ? {
              departmentId: user.faculty.departmentId,
              designation: user.faculty.designation,
            }
          : {}),
      },
    });

    const response = NextResponse.json({
      success: true,
      message: 'Password changed successfully',
      data: { redirectTo: `/${role === 'super_admin' ? 'super-admin' : role}` },
    });
    response.cookies.set(AUTH_TOKEN_COOKIE, token, COOKIE_OPTIONS);
    return response;
  } catch (error) {
    console.error('[CHANGE_PASSWORD]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to change password' },
      { status: 500 }
    );
  }
}
