import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStudentFromRequest } from '@/lib/auth';
import { z } from 'zod';

const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const student = await getStudentFromRequest(request);
    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found or unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: student.id,
        rollNumber: student.rollNumber,
        firstName: student.user.first_name,
        lastName: student.user.last_name,
        email: student.user.email,
        phone: student.user.phone || '',
        department: student.department,
        program: student.program,
        batch: student.batch,
        status: student.status,
      },
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

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
    const validatedData = updateProfileSchema.parse(body);

    // Update user information
    await prisma.users.update({
      where: { id: student.user.id },
      data: {
        first_name: validatedData.firstName,
        last_name: validatedData.lastName,
        email: validatedData.email,
        phone: validatedData.phone || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Error updating student profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

