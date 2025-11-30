import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getUserIdFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { success, user, error } = await requireAuth(request);
    if (!success || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins can access this endpoint
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get userId from multiple possible sources
    let userId: number | null = null;
    
    if (user.userId) {
      if (typeof user.userId === 'number') {
        userId = user.userId;
      } else {
        const parsed = parseInt(String(user.userId), 10);
        if (!isNaN(parsed)) userId = parsed;
      }
    }
    
    if (!userId && user.userData?.id) {
      if (typeof user.userData.id === 'number') {
        userId = user.userData.id;
      } else {
        const parsed = parseInt(String(user.userData.id), 10);
        if (!isNaN(parsed)) userId = parsed;
      }
    }
    
    if (!userId) {
      userId = getUserIdFromRequest(request);
    }
    
    if (!userId || isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: 'User ID not found or invalid' },
        { status: 400 }
      );
    }

    // Get admin's assigned department from faculty record
    const faculty = await prisma.faculties.findFirst({
      where: { userId },
      select: { departmentId: true },
    });

    if (!faculty || !faculty.departmentId) {
      return NextResponse.json(
        { success: false, error: 'Department not assigned. Please contact super admin to assign a department to your account.' },
        { status: 400 }
      );
    }

    const currentDepartmentId = faculty.departmentId;

    // Always filter by current department
    const whereClause: any = {
      status: 'active',
      departmentId: currentDepartmentId,
    };

    const faculties = await prisma.faculties.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            status: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    console.log('Found faculties:', faculties.length);

    return NextResponse.json({
      success: true,
      data: faculties,
    });
  } catch (error) {
    console.error('Error fetching faculties:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch faculties' },
      { status: 500 }
    );
  }
}
