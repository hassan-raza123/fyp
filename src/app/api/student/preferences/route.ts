import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStudentFromRequest } from '@/lib/student-utils';
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

    // Get preferences from user record or return defaults
    // In a real implementation, you might store these in a separate preferences table
    // For now, we'll return defaults
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
    };

    return NextResponse.json({
      success: true,
      data: preferences,
    });
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

    // In a real implementation, you would store preferences in a separate table
    // For now, we'll just return success
    // TODO: Create a student_preferences table to store these settings

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      data: validatedData,
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

