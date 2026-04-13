import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFacultyFromRequest } from '@/lib/auth';
import { z } from 'zod';

const updatePreferencesSchema = z.object({
  notificationPreferences: z.object({
    emailNotifications: z.boolean().optional(),
    assessmentReminders: z.boolean().optional(),
    gradeNotifications: z.boolean().optional(),
    systemUpdates: z.boolean().optional(),
  }).optional(),
  displayPreferences: z.object({
    gradeDisplayFormat: z.enum(['percentage', 'letter', 'both']).optional(),
    dateFormat: z.string().optional(),
    defaultView: z.string().optional(),
  }).optional(),
  teachingPreferences: z.object({
    defaultAssessmentType: z.string().optional(),
    defaultWeightage: z.number().optional(),
    cloCalculationThreshold: z.number().optional(),
    autoCalculateGrades: z.boolean().optional(),
  }).optional(),
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

const defaultTeaching = {
  defaultAssessmentType: 'quiz',
  defaultWeightage: 10,
  cloCalculationThreshold: 60,
  autoCalculateGrades: false,
};

// GET - Get faculty preferences
export async function GET(request: NextRequest) {
  try {
    const faculty = await getFacultyFromRequest(request);
    if (!faculty) {
      return NextResponse.json(
        { success: false, error: 'Faculty not found or unauthorized' },
        { status: 401 }
      );
    }

    const stored = await prisma.faculty_preferences.findUnique({
      where: { facultyId: faculty.id },
    });

    const preferences = {
      notificationPreferences: (stored?.notificationPreferences as object) ?? defaultNotifications,
      displayPreferences: (stored?.displayPreferences as object) ?? defaultDisplay,
      teachingPreferences: (stored?.teachingPreferences as object) ?? defaultTeaching,
    };

    return NextResponse.json({ success: true, data: preferences });
  } catch (error) {
    console.error('Error fetching faculty preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

// PUT - Update faculty preferences
export async function PUT(request: NextRequest) {
  try {
    const faculty = await getFacultyFromRequest(request);
    if (!faculty) {
      return NextResponse.json(
        { success: false, error: 'Faculty not found or unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updatePreferencesSchema.parse(body);

    // Fetch existing preferences to merge with defaults
    const existing = await prisma.faculty_preferences.findUnique({
      where: { facultyId: faculty.id },
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

    const mergedTeaching = {
      ...defaultTeaching,
      ...((existing?.teachingPreferences as object) ?? {}),
      ...(validatedData.teachingPreferences ?? {}),
    };

    const saved = await prisma.faculty_preferences.upsert({
      where: { facultyId: faculty.id },
      create: {
        facultyId: faculty.id,
        notificationPreferences: mergedNotifications,
        displayPreferences: mergedDisplay,
        teachingPreferences: mergedTeaching,
      },
      update: {
        notificationPreferences: mergedNotifications,
        displayPreferences: mergedDisplay,
        teachingPreferences: mergedTeaching,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        notificationPreferences: saved.notificationPreferences,
        displayPreferences: saved.displayPreferences,
        teachingPreferences: saved.teachingPreferences,
      },
    });
  } catch (error) {
    console.error('Error updating faculty preferences:', error);
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
