import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { authorize, canManageUser, forbiddenResponse, getUserId } from '@/lib/authz';
import { writeAuditLog } from '@/lib/audit-log';

// GET /api/users/[id] - Get a specific user
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const userId = parseInt(id, 10);
    if (isNaN(userId) || userId <= 0) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const auth = await authorize(request, ['super_admin', 'admin']);
    if (!auth.ok) return auth.response;

    // Holding the admin role is not enough: a department admin administers
    // their own department, not the whole university.
    if (!(await canManageUser(request, auth.user, userId))) {
      return forbiddenResponse();
    }

    // Get the target user with only the required fields
    const targetUser = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone_number: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        userrole: {
          include: {
            role: true,
          },
        },
        faculty: {
          include: {
            department: true,
          },
        },
        student: {
          include: {
            department: true,
            program: true,
          },
        },
      },
    });

    // If user not found, return not found
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return the user data with role and department information
    return NextResponse.json(targetUser);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update a user
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorize(request, ['super_admin', 'admin']);
    if (!auth.ok) return auth.response;

    const { id } = await context.params;
    const targetId = parseInt(id, 10);
    if (Number.isNaN(targetId) || targetId <= 0) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    if (!(await canManageUser(request, auth.user, targetId))) {
      return forbiddenResponse();
    }

    const body = await request.json();
    const { email, first_name, last_name, phone_number, status } = body;

    // Validate required fields
    if (!email || !first_name || !last_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { id: Number(id) },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if email is already taken by another user
    if (email !== existingUser.email) {
      const emailExists = await prisma.users.findUnique({
        where: { email },
      });
      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already taken' },
          { status: 400 }
        );
      }
    }

    // Update user data
    const updatedUser = await prisma.users.update({
      where: { id: Number(id) },
      data: {
        email,
        first_name,
        last_name,
        phone_number,
        status,
        updatedAt: new Date(),
      },
      include: {
        userrole: {
          include: {
            role: true,
          },
        },
      },
    });

    // Get the role name if it exists
    const userRole = updatedUser.userrole?.role?.name || null;

    await writeAuditLog(request, auth.user, 'user.update', {
      targetUserId: targetId,
      email,
      status,
    });

    return NextResponse.json({
      id: updatedUser.id,
      email: updatedUser.email,
      first_name: updatedUser.first_name,
      last_name: updatedUser.last_name,
      phone_number: updatedUser.phone_number,
      status: updatedUser.status,
      role: userRole,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete a user
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // First validate the user ID
    const { id } = await context.params;
    const userId = parseInt(id, 10);
    if (isNaN(userId) || userId <= 0) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const auth = await authorize(request, ['super_admin', 'admin']);
    if (!auth.ok) return auth.response;

    if (!(await canManageUser(request, auth.user, userId))) {
      return forbiddenResponse();
    }

    // Deleting yourself leaves nobody holding the keys and immediately
    // invalidates the session making the request.
    const selfId = getUserId(auth.user);
    if (selfId === userId) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    const target = await prisma.users.findUnique({
      where: { id: userId },
      select: { email: true, userrole: { select: { role: { select: { name: true } } } } },
    });

    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Removing the last super admin locks everyone out of the system-wide
    // screens permanently, and nothing else can recreate the role.
    if (target.userrole?.role?.name === 'super_admin') {
      const remaining = await prisma.userroles.count({
        where: { role: { name: 'super_admin' } },
      });
      if (remaining <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last super admin account' },
          { status: 400 }
        );
      }
    }

    // One transaction, not four sequential writes. Most relations declare no
    // `onDelete`, so Prisma defaults to `Restrict` and a user carrying grades
    // or enrolments makes a later delete throw — which, unwrapped, left the
    // role row already deleted and the user stranded with no role at all:
    // login answers "User has no roles assigned" and the account is
    // unreachable from the role-filtered admin listings.
    try {
      await prisma.$transaction(async (tx) => {
        await tx.userroles.deleteMany({ where: { userId } });
        await tx.faculties.deleteMany({ where: { userId } });
        await tx.students.deleteMany({ where: { userId } });
        await tx.users.delete({ where: { id: userId } });
      });
    } catch (txError) {
      console.error('User delete rolled back:', txError);
      return NextResponse.json(
        {
          error:
            'This account still has records attached (grades, enrolments or attendance) and cannot be deleted. Deactivate it instead.',
        },
        { status: 409 }
      );
    }

    await writeAuditLog(request, auth.user, 'user.delete', {
      targetUserId: userId,
      targetEmail: target.email,
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
