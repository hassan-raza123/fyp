import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStudentFromRequest } from '@/lib/auth';
import { z } from 'zod';

const updatePreferencesSchema = z.object({
  notificationPreferences: z
    .object({
      emailNotifications: z.boolean().optional(),
      assessmentReminders: z.boolean().optional(),
      gradeNotifications: z.boolean().optional(),
      systemUpdates: z.boolean().optional(),
    })
    .optional(),
  displayPreferences: z
    .object({
      gradeDisplayFormat: z.enum(['percentage', 'letter', 'both']).optional(),
      dateFormat: z.string().optional(),
      defaultView: z.string().optional(),
    })
    .optional(),
});

const defaultNotifications = {
  emailNotifications: true,
  assessmentReminders: true,
  gradeNotifications: true,
  systemUpdates: true,
};

const defaultDisplay = {
  gradeDisplayFormat: 'both',
  dateFormat: 'MM/DD/YYYY',
  defaultView: 'dashboard',
};

// GET - Get student preferences
export async function GET(request: NextRequest) {
  try {
    const student = await getStudentFromRequest(request);
    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found or unauthorized' },
        { status: 401 }
      );
    }

    const stored = await prisma.student_preferences.findUnique({
      where: { studentId: student.id },
    });

    const preferences = {
      notificationPreferences: (stored?.notificationPreferences as object) ?? defaultNotifications,
      displayPreferences: (stored?.displayPreferences as object) ?? defaultDisplay,
    };

    return NextResponse.json({ success: true, data: preferences });
  } catch (error) {
    console.error('Error fetching student preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

// PUT - Update student preferences
export async function PUT(request: NextRequest) {
  try {
    const student = await getStudentFromRequest(request);
    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found or unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updatePreferencesSchema.parse(body);

    // Fetch existing preferences to merge with defaults
    const existing = await prisma.student_preferences.findUnique({
      where: { studentId: student.id },
    });

    const mergedNotifications = {
      ...defaultNotifications,
      ...((existing?.notificationPreferences as object) ?? {}),
      ...(validatedData.notificationPreferences ?? {}),
    };

    const mergedDisplay = {
      ...defaultDisplay,
      ...((existing?.displayPreferences as object) ?? {}),
      ...(validatedData.displayPreferences ?? {}),
    };

    const saved = await prisma.student_preferences.upsert({
      where: { studentId: student.id },
      create: {
        studentId: student.id,
        notificationPreferences: mergedNotifications,
        displayPreferences: mergedDisplay,
      },
      update: {
        notificationPreferences: mergedNotifications,
        displayPreferences: mergedDisplay,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        notificationPreferences: saved.notificationPreferences,
        displayPreferences: saved.displayPreferences,
      },
    });
  } catch (error) {
    console.error('Error updating student preferences:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
