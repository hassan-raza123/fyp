import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
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
            academicYear: '2024',
            currentSemester: 'Spring',
            defaultLanguage: 'en',
            timeZone: 'UTC',
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
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { system, email, notifications } = data;

    // Update or create settings
    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: {
        system,
        email,
        notifications,
      },
      create: {
        id: 1,
        system,
        email,
        notifications,
      },
    });

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
