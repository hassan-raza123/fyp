import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authorize, getUserId } from '@/lib/authz';

/**
 * The signed-in user's own profile.
 *
 * Role-agnostic on purpose. There were already `/api/faculty/profile`,
 * `/api/student/profile` and `/api/super-admin/profile` doing the same three
 * things against the same `users` row, and no equivalent at all for a
 * department admin — which is why `/admin/profile` was a dead link. One route
 * that resolves the account from the session covers every role and cannot
 * drift out of step with the others.
 *
 * There is no id in the path: a profile is always the caller's own, so there is
 * nothing here to authorise beyond being signed in.
 */

const updateSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  lastName: z.string().trim().min(1, 'Last name is required').max(100),
  phoneNumber: z
    .string()
    .trim()
    .max(30, 'Phone number is too long')
    .optional()
    .or(z.literal('')),
});

const ROLES = ['super_admin', 'admin', 'faculty', 'student'] as const;

export async function GET(request: NextRequest) {
  try {
    const auth = await authorize(request, [...ROLES]);
    if (!auth.ok) return auth.response;

    const userId = getUserId(auth.user);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone_number: true,
        status: true,
        createdAt: true,
        last_login: true,
        userrole: { select: { role: { select: { name: true } } } },
        faculty: {
          select: {
            designation: true,
            department: { select: { id: true, name: true, code: true } },
          },
        },
        student: {
          select: {
            rollNumber: true,
            department: { select: { id: true, name: true, code: true } },
            program: { select: { id: true, name: true, code: true } },
            batch: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phoneNumber: user.phone_number ?? '',
        status: user.status,
        role: user.userrole?.role?.name ?? auth.user.role,
        createdAt: user.createdAt,
        lastLogin: user.last_login,
        designation: user.faculty?.designation ?? null,
        rollNumber: user.student?.rollNumber ?? null,
        department: user.faculty?.department ?? user.student?.department ?? null,
        program: user.student?.program ?? null,
        batch: user.student?.batch ?? null,
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

/**
 * Update the caller's own name and phone number.
 *
 * Email is deliberately not editable here: it is the login identifier and the
 * address password resets and OTPs are sent to, so changing it is an
 * administrative action that belongs behind `/api/users/[id]`.
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await authorize(request, [...ROLES]);
    if (!auth.ok) return auth.response;

    const userId = getUserId(auth.user);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { firstName, lastName, phoneNumber } = parsed.data;

    const updated = await prisma.users.update({
      where: { id: userId },
      data: {
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber ? phoneNumber : null,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone_number: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updated.id,
        firstName: updated.first_name,
        lastName: updated.last_name,
        email: updated.email,
        phoneNumber: updated.phone_number ?? '',
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
