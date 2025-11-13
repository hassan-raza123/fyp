import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';

// POST /api/admin/assign-department - Assign admin to a department
export async function POST(request: NextRequest) {
  try {
    const { success, user, error } = requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins can assign themselves to a department
    if (user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { departmentId } = body;

    if (!departmentId) {
      return NextResponse.json(
        { success: false, error: 'Department ID is required' },
        { status: 400 }
      );
    }

    const userId = user.userId;

    // Check if department exists
    const department = await prisma.departments.findUnique({
      where: { id: parseInt(departmentId) },
    });

    if (!department) {
      return NextResponse.json(
        { success: false, error: 'Department not found' },
        { status: 404 }
      );
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check if user already has a faculty record
      const existingFaculty = await tx.faculties.findFirst({
        where: { userId },
      });

      if (existingFaculty) {
        // Update existing faculty record
        await tx.faculties.update({
          where: { id: existingFaculty.id },
          data: {
            departmentId: parseInt(departmentId),
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new faculty record for admin
        await tx.faculties.create({
          data: {
            userId,
            departmentId: parseInt(departmentId),
            designation: 'Admin',
            status: 'active',
            updatedAt: new Date(),
          },
        });
      }

      // Update department's adminId only if not already set
      const dept = await tx.departments.findUnique({
        where: { id: parseInt(departmentId) },
        select: { adminId: true },
      });

      if (!dept?.adminId) {
        await tx.departments.update({
          where: { id: parseInt(departmentId) },
          data: {
            adminId: userId,
            updatedAt: new Date(),
          },
        });
      }

      // Update settings with department info
      const settings = await tx.settings.findFirst();
      if (settings) {
        const systemSettings =
          typeof settings.system === 'string'
            ? JSON.parse(settings.system)
            : settings.system;

        systemSettings.departmentCode = department.code;
        systemSettings.departmentName = department.name;

        await tx.settings.update({
          where: { id: settings.id },
          data: {
            system: systemSettings,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create settings if they don't exist
        await tx.settings.create({
          data: {
            system: {
              applicationName: 'Smart Campus for MNSUET',
              academicYear: '2024',
              currentSemester: 'Spring',
              defaultLanguage: 'en',
              timeZone: 'UTC',
              departmentCode: department.code,
              departmentName: department.name,
            },
            email: {
              smtpHost: '',
              smtpPort: '',
              smtpUsername: '',
              smtpPassword: '',
              fromEmail: '',
              fromName: '',
            },
            notifications: {
              enabled: true,
              channels: {
                email: true,
                push: false,
                sms: false,
              },
            },
          },
        });
      }

      return { success: true };
    });

    return NextResponse.json({
      success: true,
      message: 'Department assigned successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error assigning department:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to assign department',
      },
      { status: 500 }
    );
  }
}

