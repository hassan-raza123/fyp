import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFacultyFromRequest } from '@/lib/auth';
import { z } from 'zod';

const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().optional(),
});

// GET - Get faculty profile
export async function GET(request: NextRequest) {
  try {
    const faculty = await getFacultyFromRequest(request);
    if (!faculty) {
      return NextResponse.json(
        { success: false, error: 'Faculty not found or unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: faculty.id,
        firstName: faculty.user.first_name,
        lastName: faculty.user.last_name,
        email: faculty.user.email,
        phoneNumber: faculty.user.phone_number || '',
        employeeId: faculty.employeeId || '',
        designation: faculty.designation || '',
        department: faculty.department,
        status: faculty.user.status,
      },
    });
  } catch (error) {
    console.error('Error fetching faculty profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PUT - Update faculty profile
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
    const validatedData = updateProfileSchema.parse(body);

    // Check if email is being changed and if it already exists
    if (validatedData.email !== faculty.user.email) {
      const emailExists = await prisma.users.findUnique({
        where: { email: validatedData.email },
      });

      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'Email already exists' },
          { status: 400 }
        );
      }
    }

    // Update user data
    const updatedUser = await prisma.users.update({
      where: { id: faculty.user.id },
      data: {
        first_name: validatedData.firstName,
        last_name: validatedData.lastName,
        email: validatedData.email,
        phone_number: validatedData.phoneNumber || null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: faculty.id,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        email: updatedUser.email,
        phoneNumber: updatedUser.phone_number || '',
      },
    });
  } catch (error) {
    console.error('Error updating faculty profile:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

