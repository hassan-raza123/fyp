import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';

// GET /api/admin/check-department - Check if admin has a department assigned
export async function GET(request: NextRequest) {
  try {
    const { success, user, error } = requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins can check their department
    if (user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const userId = user.userId;

    // Check if admin has a faculty record with department
    const faculty = await prisma.faculties.findFirst({
      where: { userId },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (faculty && faculty.department) {
      return NextResponse.json({
        success: true,
        hasDepartment: true,
        department: faculty.department,
      });
    }

    return NextResponse.json({
      success: true,
      hasDepartment: false,
      department: null,
    });
  } catch (error) {
    console.error('Error checking admin department:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to check department',
      },
      { status: 500 }
    );
  }
}

