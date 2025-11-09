import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Validation schema for assigning department admin
const assignAdminSchema = z.object({
  userId: z.number(),
  isHead: z.boolean().optional().default(false),
});

// GET /api/departments/[id]/admins - Get department admins
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role
    const user = await prisma.users.findUnique({
      where: { id: Number(session.user.id) },
      include: { userrole: { include: { role: true } } },
    });

    const isAdmin = user?.userrole?.role.name === 'admin';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get department admins - users with admin role assigned to this department
    const admins = await prisma.users.findMany({
      where: {
        userrole: {
          role: {
            name: 'admin',
          },
        },
        departmentAdmin: {
          id: parseInt(params.id),
        },
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        departmentAdmin: {
          select: {
            id: true,
          },
        },
      },
    });

    // Format response
    const formattedAdmins = admins.map((admin) => ({
      id: admin.id,
      name: `${admin.first_name} ${admin.last_name}`,
      email: admin.email,
      isHead: admin.departmentAdmin?.id === parseInt(params.id),
    }));

    return NextResponse.json(formattedAdmins);
  } catch (error) {
    console.error('Error fetching department admins:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/departments/[id]/admins - Assign department admin
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role
    const user = await prisma.users.findUnique({
      where: { id: Number(session.user.id) },
      include: { userrole: { include: { role: true } } },
    });

    const isAdmin = user?.userrole?.role.name === 'admin';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = assignAdminSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { userId, isHead } = validationResult.data;

    // Check if department exists
    const department = await prisma.departments.findUnique({
      where: { id: parseInt(params.id) },
    });

    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }

    // Check if user exists and has admin role
    const userToAssign = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        userrole: {
          include: { role: true },
        },
      },
    });

    if (!userToAssign) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const hasAdminRole = userToAssign.userrole?.role.name === 'admin';

    if (!hasAdminRole) {
      return NextResponse.json(
        { error: 'User is not an admin' },
        { status: 400 }
      );
    }

    // Assign admin to department
    await prisma.departments.update({
      where: { id: parseInt(params.id) },
      data: {
        adminId: userId,
      },
    });

    return NextResponse.json({
      message: 'Department admin assigned successfully',
    });
  } catch (error) {
    console.error('Error assigning department admin:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
