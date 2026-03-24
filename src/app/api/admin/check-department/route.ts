import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getUserIdFromRequest } from '@/lib/auth';

// GET /api/admin/check-department - Check if admin has a department assigned
export async function GET(request: NextRequest) {
  try {
    const { success, user, error } = await requireAuth(request);
    if (!success || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins (not super_admin) can check their department
    // Super admin doesn't need a department
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get userId from multiple possible sources
    let userId: number | null = null;
    
    // Try from user object first
    if (user.userId) {
      if (typeof user.userId === 'number') {
        userId = user.userId;
      } else {
        const parsed = parseInt(String(user.userId), 10);
        if (!isNaN(parsed)) userId = parsed;
      }
    }
    
    // Try from userData if available
    if (!userId && user.userData?.id) {
      if (typeof user.userData.id === 'number') {
        userId = user.userData.id;
      } else {
        const parsed = parseInt(String(user.userData.id), 10);
        if (!isNaN(parsed)) userId = parsed;
      }
    }
    
    // Try from request headers as fallback
    if (!userId) {
      userId = getUserIdFromRequest(request);
    }
    
    // Ensure userId is a valid number
    if (!userId || isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: 'User ID not found or invalid' },
        { status: 400 }
      );
    }

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

