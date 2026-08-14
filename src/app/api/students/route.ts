import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { generateTemporaryPassword } from '@/lib/password-utils';

const createStudentSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  rollNumber: z.string().min(1, 'Roll number is required'),
  departmentId: z.number().nullable().optional(),
  programId: z.number(),
  batchId: z.string(),
  status: z.enum(['active', 'inactive']),
});

export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization
    const { success, user, error } = await requireAuth(request);
    if (!success || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Staff only. A student has no business enumerating the student body —
    // this listing carries every classmate's name, roll number and email.
    // A student's own record is served by /api/student/profile.
    if (!['admin', 'faculty', 'super_admin'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Import getDepartmentIdFromRequest
    const { getDepartmentIdFromRequest } = await import('@/lib/auth');

    // Get department ID from authenticated user
    const currentDepartmentId = await getDepartmentIdFromRequest(request);
    
    // For super_admin, allow access without department restriction
    if (!currentDepartmentId && user.role !== 'super_admin') {
      return NextResponse.json(
        {
          success: false,
          error: 'Department not assigned. Please contact super admin to assign a department to your account.',
        },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    /**
     * Paginate only when the caller asks for it.
     *
     * A default `limit=10` applied to every request meant a caller that sent no
     * query string quietly received the first ten rows. Tables pass
     * `page`/`limit` and were fine; the dropdowns that fill from these
     * endpoints do not, so past the tenth row they simply had no option to
     * select and nothing said so.
     */
    const hasExplicitPaging =
      searchParams.has('page') || searchParams.has('limit');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10', 10) || 10);
    const status = searchParams.get('status') as
      | 'active'
      | 'inactive'
      | undefined;
    const batchId = searchParams.get('batchId');
    const search = searchParams.get('search');

    // If user is faculty, only show students from their sections
    let studentIds: number[] | null = null;
    if (user?.role === 'faculty') {
      const { getFacultyIdFromRequest } = await import('@/lib/auth');
      const facultyId = await getFacultyIdFromRequest(request);
      if (facultyId) {
        // Get student IDs from faculty's sections
        const studentSections = await prisma.studentsections.findMany({
          where: {
            section: {
              facultyId: facultyId,
              status: 'active',
            },
          },
          select: {
            studentId: true,
          },
        });

        studentIds = [
          ...new Set(studentSections.map((ss) => ss.studentId)),
        ];

        if (studentIds.length === 0) {
          // Faculty has no students, return empty result
          return NextResponse.json({
            success: true,
            data: [],
            pagination: {
              total: 0,
              page,
              limit,
              totalPages: 0,
            },
          });
        }
      }
    }

    const where = {
      AND: [
        // Only filter by department if we have a department ID (not for super_admin without department)
        ...(currentDepartmentId ? [{ departmentId: currentDepartmentId }] : []),
        studentIds ? { id: { in: studentIds } } : {}, // Filter by faculty's students if faculty
        status ? { status } : {},
        batchId ? { batchId } : {},
        search
          ? {
              OR: [
                { rollNumber: { contains: search } },
                {
                  user: {
                    OR: [
                      { first_name: { contains: search } },
                      { last_name: { contains: search } },
                      { email: { contains: search } },
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
        ...(hasExplicitPaging
          ? { skip: (page - 1) * limit, take: limit }
          : {}),
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
    // Check authentication and authorization
    const { success, user, error } = await requireAuth(request);
    if (!success || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins and super_admins can create students
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
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
      departmentId: providedDepartmentId,
      programId,
      batchId,
      status,
    } = result.data;

    // Resolve the department the student is created in.
    //
    // A department admin does not get to choose: taking `departmentId` from the
    // request body and only checking that it exists let them create accounts in
    // any department in the university. Their own department is authoritative,
    // and a supplied value is accepted only when it matches it. A super_admin
    // belongs to no department, so for them the body is the only source.
    const { getDepartmentIdFromRequest } = await import('@/lib/auth');
    const { forbiddenResponse } = await import('@/lib/authz');
    const callerDepartmentId = await getDepartmentIdFromRequest(request);
    let departmentId: number;

    if (user.role === 'super_admin') {
      if (!providedDepartmentId) {
        return NextResponse.json(
          { success: false, error: 'departmentId is required' },
          { status: 400 }
        );
      }
      departmentId = providedDepartmentId;
    } else {
      if (!callerDepartmentId) {
        return NextResponse.json(
          { success: false, error: 'Department not configured. Please set department in Settings.' },
          { status: 400 }
        );
      }
      if (providedDepartmentId && providedDepartmentId !== callerDepartmentId) {
        return forbiddenResponse(
          'You can only create students in your own department'
        );
      }
      departmentId = callerDepartmentId;
    }

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

    const defaultPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    /**
     * One transaction for the whole account.
     *
     * A student is three rows — `users`, `userroles`, `students` — plus an
     * optional enrolment. Created separately, a failure part-way left a user
     * who could not sign in ("User has no roles assigned") or a user with a
     * role but no student record, and nothing rolled back.
     */
    const student = await prisma.$transaction(async (tx) => {
    // Create user with student role
    const newUser = await tx.users.create({
      data: {
        first_name: firstName,
        last_name: lastName,
        email,
        password_hash: hashedPassword,
        // Temporary credential: the user must set their own before using the app
        must_change_password: true,
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
    const created = await tx.students.create({
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

    // Enroll student in section if sectionId is provided
      if (body.sectionId) {
        await tx.studentsections.create({
          data: {
            studentId: created.id,
            sectionId: Number(body.sectionId),
            status: 'active',
          },
        });
      }

      return created;
    });

    // Transform the data to include currentStudents count
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
      currentStudents: student._count?.studentsections || 0,
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
