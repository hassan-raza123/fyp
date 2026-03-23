import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { syncDepartmentFromSettings } from '@/lib/auth';

// GET /api/settings
export async function GET(request: NextRequest) {
  try {
    const { success, error } = await requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const settings = await prisma.settings.findFirst();
    if (!settings) {
      // Return default settings if none exist
      return NextResponse.json({
        success: true,
        data: {
          system: {
            applicationName: 'Smart Campus for MNSUET',
            academicYear: '2025',
            currentSemester: 'Spring',
            defaultLanguage: 'en',
            timeZone: 'UTC',
            departmentName: '',
            departmentCode: '',
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
          obe: {
            directWeight: 0.8,
            indirectWeight: 0.2,
            attainmentThreshold: 60,
            minGraduationCGPA: 2.0,
          },
        },
      });
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT /api/settings
export async function PUT(request: NextRequest) {
  try {
    const { success, user, error } = await requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!['admin', 'super_admin'].includes(user?.role)) {
      return NextResponse.json(
        { error: 'Only admins can update settings' },
        { status: 403 }
      );
    }

    const data = await request.json();
    const { system, email, notifications, obe } = data;

    // Update or create settings
    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: {
        system,
        email,
        notifications,
        ...(obe && { obe }),
      },
      create: {
        id: 1,
        system,
        email,
        notifications,
        ...(obe && { obe }),
      },
    });

    // If department name and code are provided in settings, create/update department
    if (system?.departmentCode && system?.departmentName) {
      await syncDepartmentFromSettings();
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
