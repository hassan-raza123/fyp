import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { canManageUser } from '@/lib/authz';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Await the params
  const { id } = await context.params;

  // Validate the ID
  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
  }

  const userId = Number(id);

  try {
    // Check authentication and get user data
    const { success, user, error } = await requireAuth(request);
    if (!success) {
      return NextResponse.json({ error }, { status: 401 });
    }

    if (user?.role !== 'admin' && user?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Being an admin is not enough: a department admin may only enable or
    // disable accounts inside their own department. Otherwise any department
    // admin could lock any user in the university out of the system.
    if (!(await canManageUser(request, user, userId))) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status } = body;

    // Validate status
    if (
      !status ||
      !['active', 'inactive', 'suspended', 'deleted'].includes(status)
    ) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Update user status
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        status,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        status: true,
        userrole: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
