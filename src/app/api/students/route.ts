import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const createStudentSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  rollNumber: z.string().min(1, 'Roll number is required'),
  departmentId: z.number(),
  programId: z.number(),
  batchId: z.string(),
  status: z.enum(['active', 'inactive']),
});

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { success, user, error } = requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') as
      | 'active'
      | 'inactive'
      | undefined;
    const batchId = searchParams.get('batchId');
    const search = searchParams.get('search');

    const where = {
      AND: [
        status ? { status } : {},
        batchId ? { batchId } : {},
        search
          ? {
              OR: [
                { rollNumber: { contains: search, mode: 'insensitive' } },
                {
                  user: {
                    OR: [
                      { first_name: { contains: search, mode: 'insensitive' } },
                      { last_name: { contains: search, mode: 'insensitive' } },
                      { email: { contains: search, mode: 'insensitive' } },
                    ],
                  },
                },
              ],
            }
          : {},
      ],
    };

    const [students, total] = await Promise.all([
      prisma.students.findMany({
        where,
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
          _count: {
            select: {
              studentsections: true,
            },
          },
        },
        orderBy: {
          user: {
            first_name: 'asc',
          },
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.students.count({ where }),
    ]);

    // Transform the data to include currentStudents count
    const transformedStudents = students.map((student) => ({
      id: student.id,
      rollNumber: student.rollNumber,
      status: student.status,
      user: {
        id: student.user.id,
        firstName: student.user.first_name,
        lastName: student.user.last_name,
        email: student.user.email,
      },
      batch: student.batch
        ? {
            id: student.batch.id,
            name: student.batch.name,
          }
        : null,
      department: student.department
        ? {
            id: student.department.id,
            name: student.department.name,
          }
        : null,
      program: student.program
        ? {
            id: student.program.id,
            name: student.program.name,
          }
        : null,
      currentStudents: student._count.studentsections,
    }));

    return NextResponse.json({
      success: true,
      data: transformedStudents,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const result = createStudentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const {
      firstName,
      lastName,
      email,
      rollNumber,
      departmentId,
      programId,
      batchId,
      status,
    } = result.data;

    // Check if user with email already exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Check if student with roll number already exists
    const existingStudent = await prisma.students.findUnique({
      where: { rollNumber },
    });

    if (existingStudent) {
      return NextResponse.json(
        {
          success: false,
          error: 'Student with this roll number already exists',
        },
        { status: 400 }
      );
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

    // Get the student role
    const studentRole = await prisma.roles.findUnique({
      where: { name: 'student' },
    });

    if (!studentRole) {
      return NextResponse.json(
        { success: false, error: 'Student role not found' },
        { status: 404 }
      );
    }

    const defaultPassword = '11223344';
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    // Create user with student role
    const newUser = await prisma.users.create({
      data: {
        first_name: firstName,
        last_name: lastName,
        email,
        password_hash: hashedPassword,
        userrole: {
          create: {
            roleId: studentRole.id,
          },
        },
      },
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
    });

    // Create student
    const student = await prisma.students.create({
      data: {
        rollNumber,
        status,
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
          connect: { id: newUser.id },
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
        _count: {
          select: {
            studentsections: true,
          },
        },
      },
    });

    // Transform the data to include currentStudents count
    const transformedStudent = {
      ...student,
      currentStudents: student._count.studentsections,
    };

    return NextResponse.json({
      success: true,
      data: transformedStudent,
    });
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create student' },
      { status: 500 }
    );
  }
}
