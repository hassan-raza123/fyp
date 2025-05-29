import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const updateStudentSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .optional(),
  rollNumber: z.string().min(1, 'Roll number is required'),
  batchId: z.string().min(1, 'Batch is required'),
  departmentId: z.number().min(1, 'Department is required'),
  programId: z.number().min(1, 'Program is required'),
  status: z.enum(['active', 'inactive']).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const { success, user, error } = requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate input
    const result = updateStudentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input',
          details: result.error.errors,
        },
        { status: 400 }
      );
    }

    const {
      firstName,
      lastName,
      email,
      password,
      rollNumber,
      batchId,
      departmentId,
      programId,
      status,
    } = result.data;

    // Check if student exists
    const existingStudent = await prisma.students.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            userrole: {
              select: {
                role: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!existingStudent) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    // Check if email is being changed and if it already exists
    if (email !== existingStudent.user.email) {
      const emailExists = await prisma.users.findUnique({
        where: { email },
      });

      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'Email already exists' },
          { status: 400 }
        );
      }
    }

    // Check if roll number is being changed and if it already exists
    if (rollNumber !== existingStudent.rollNumber) {
      const rollNumberExists = await prisma.students.findUnique({
        where: { rollNumber },
      });

      if (rollNumberExists) {
        return NextResponse.json(
          { success: false, error: 'Roll number already exists' },
          { status: 400 }
        );
      }
    }

    // Check if batch exists
    const batch = await prisma.batches.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      return NextResponse.json(
        { success: false, error: 'Batch not found' },
        { status: 404 }
      );
    }

    // Check if department exists
    const department = await prisma.departments.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      return NextResponse.json(
        { success: false, error: 'Department not found' },
        { status: 404 }
      );
    }

    // Check if program exists
    const program = await prisma.programs.findUnique({
      where: { id: programId },
    });

    if (!program) {
      return NextResponse.json(
        { success: false, error: 'Program not found' },
        { status: 404 }
      );
    }

    // Prepare user update data
    const userUpdateData = {
      first_name: firstName,
      last_name: lastName,
      email,
      ...(password && { password_hash: await bcrypt.hash(password, 10) }),
    };

    // Update user and student
    const updatedStudent = await prisma.students.update({
      where: { id: parseInt(params.id) },
      data: {
        rollNumber,
        status: status || existingStudent.status,
        batch: {
          connect: { id: batchId },
        },
        department: {
          connect: { id: departmentId },
        },
        program: {
          connect: { id: programId },
        },
        user: {
          update: userUpdateData,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            userrole: {
              select: {
                role: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        batch: {
          select: {
            id: true,
            name: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        program: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedStudent,
    });
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update student' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const { success, user, error } = requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const student = await prisma.students.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        user: {
          select: {
            id: true,
            userrole: {
              select: {
                role: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    // Delete the student (this will cascade delete the user due to the relation)
    await prisma.students.delete({
      where: { id: parseInt(params.id) },
    });

    return NextResponse.json({
      success: true,
      message: 'Student deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete student' },
      { status: 500 }
    );
  }
}

// GET /api/students/[id] - Get a single student
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const { success, user, error } = requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const student = await prisma.students.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        batch: {
          select: {
            id: true,
            name: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        program: {
          select: {
            id: true,
            name: true,
          },
        },
        studentsections: {
          include: {
            section: {
              select: {
                id: true,
                name: true,
                courseOffering: {
                  select: {
                    course: {
                      select: {
                        name: true,
                        code: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    // Transform the data to match the frontend interface
    const transformedStudent = {
      id: student.id,
      rollNumber: student.rollNumber,
      status: student.status,
      user: {
        id: student.user.id,
        firstName: student.user.first_name,
        lastName: student.user.last_name,
        email: student.user.email,
      },
      batch: student.batch,
      department: student.department,
      program: student.program,
      sections: student.studentsections.map((ss) => ss.section),
    };

    return NextResponse.json({
      success: true,
      data: transformedStudent,
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch student' },
      { status: 500 }
    );
  }
}
