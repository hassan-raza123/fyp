import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

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
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { userrole: { include: { role: true } } },
    });

    const isAdmin = user?.userrole.some(
      (ur) => ur.role.name === 'super_admin' || ur.role.name === 'sub_admin'
    );

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get department admins
    const admins = await prisma.user.findMany({
      where: {
        userrole: {
          some: {
            role: {
              name: 'department_admin',
            },
          },
        },
        department: {
          some: {
            id: parseInt(params.id),
          },
        },
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        department: {
          where: {
            id: parseInt(params.id),
          },
          select: {
            isHead: true,
          },
        },
      },
    });

    // Format response
    const formattedAdmins = admins.map((admin) => ({
      id: admin.id,
      name: `${admin.first_name} ${admin.last_name}`,
      email: admin.email,
      isHead: admin.department[0]?.isHead || false,
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
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { userrole: { include: { role: true } } },
    });

    const isAdmin = user?.userrole.some(
      (ur) => ur.role.name === 'super_admin' || ur.role.name === 'sub_admin'
    );

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
    const department = await prisma.department.findUnique({
      where: { id: parseInt(params.id) },
    });

    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }

    // Check if user exists and has department admin role
    const userToAssign = await prisma.user.findUnique({
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

    const isDepartmentAdmin = userToAssign.userrole.some(
      (ur) => ur.role.name === 'department_admin'
    );

    if (!isDepartmentAdmin) {
      return NextResponse.json(
        { error: 'User is not a department admin' },
        { status: 400 }
      );
    }

    // If setting as head, unset current head
    if (isHead) {
      await prisma.department.update({
        where: { id: parseInt(params.id) },
        data: {
          user: {
            disconnect: true,
          },
        },
      });
    }

    // Assign admin to department
    await prisma.department.update({
      where: { id: parseInt(params.id) },
      data: {
        user: {
          connect: { id: userId },
        },
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
