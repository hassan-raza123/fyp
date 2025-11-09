import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// DELETE /api/departments/[id]/admins/[adminId] - Remove department admin
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; adminId: string } }
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

    // Check if admin exists and is assigned to department
    const admin = await prisma.users.findUnique({
      where: { id: parseInt(params.adminId) },
      include: {
        departmentAdmin: true,
      },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    if (
      !admin.departmentAdmin ||
      admin.departmentAdmin.id !== parseInt(params.id)
    ) {
      return NextResponse.json(
        { error: 'Admin is not assigned to this department' },
        { status: 400 }
      );
    }

    // Remove admin from department
    await prisma.departments.update({
      where: { id: parseInt(params.id) },
      data: {
        adminId: null,
      },
    });

    return NextResponse.json({
      message: 'Department admin removed successfully',
    });
  } catch (error) {
    console.error('Error removing department admin:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
