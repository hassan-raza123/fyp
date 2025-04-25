import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';

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
    const { success, user, error } = requireAuth(request);
    if (!success) {
      return NextResponse.json({ error }, { status: 401 });
    }

    // Check if user has admin role
    if (user?.role !== 'super_admin' && user?.role !== 'sub_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
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
    const updatedUser = await prisma.user.update({
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
