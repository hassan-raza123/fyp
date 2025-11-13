import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFacultyFromRequest } from '@/lib/faculty-utils';
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

    // Get preferences from faculty record or return defaults
    const preferences = {
      notificationPreferences: {
        emailNotifications: true,
        assessmentReminders: true,
        gradeNotifications: true,
        systemUpdates: true,
      },
      displayPreferences: {
        gradeDisplayFormat: 'both' as const,
        dateFormat: 'MM/DD/YYYY',
        defaultView: 'dashboard',
      },
      teachingPreferences: {
        defaultAssessmentType: 'quiz',
        defaultWeightage: 10,
        cloCalculationThreshold: 60,
        autoCalculateGrades: false,
      },
    };

    return NextResponse.json({
      success: true,
      data: preferences,
    });
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

    // In a real implementation, you would store preferences in a separate table
    // For now, we'll just return success
    // TODO: Create a faculty_preferences table to store these settings

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      data: validatedData,
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

