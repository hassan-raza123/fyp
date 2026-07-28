import { NextRequest, NextResponse } from 'next/server';
import { resolveDepartmentScope, departmentFilter } from '@/lib/authz';
import { prisma } from '@/lib/prisma';
import { requireAuth, getDepartmentIdFromRequest } from '@/lib/auth';
import { hash } from 'bcryptjs';
import { generateTemporaryPassword } from '@/lib/password-utils';
import { z } from 'zod';

const createFacultySchema = z.object({
  email: z.string().email('Invalid email format'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone_number: z.string().nullable().optional(),
  designation: z.string().min(1, 'Designation is required').optional(),
  status: z.enum(['active', 'inactive']).optional().default('active'),
});

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { success, user, error } = await requireAuth(request);
    if (!success || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins can access this endpoint
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get department ID directly from token (fast, no database query)
    // A super_admin belongs to no department and must not be scoped out of
    // the system; see resolveDepartmentScope.
    const currentDepartmentIdScope = await resolveDepartmentScope(request, user!);
    if (currentDepartmentIdScope.error) return currentDepartmentIdScope.error;
    const currentDepartmentId = currentDepartmentIdScope.departmentId;

    // Always filter by current department
    const whereClause: any = {
      status: 'active',
      departmentId: currentDepartmentId,
    };

    // Fetch all faculties for the department
    const allFaculties = await prisma.faculties.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            status: true,
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
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Filter out admin users - only keep faculty role users
    const faculties = allFaculties
      .filter((faculty) => {
        const userRole = faculty.user.userrole?.role?.name;
        return userRole === 'faculty'; // Only include faculty role, exclude admin
      })
      .map((faculty) => ({
        id: faculty.id,
        userId: faculty.userId,
        designation: faculty.designation,
        status: faculty.status,
        createdAt: faculty.createdAt,
        updatedAt: faculty.updatedAt,
        user: {
          id: faculty.user.id,
          first_name: faculty.user.first_name,
          last_name: faculty.user.last_name,
          email: faculty.user.email,
          status: faculty.user.status,
        },
        department: faculty.department,
      }));

    return NextResponse.json({
      success: true,
      data: faculties,
    });
  } catch (error) {
    console.error('Error fetching faculties:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch faculties' },
      { status: 500 }
    );
  }
}

// POST /api/faculties - Create a new faculty
export async function POST(request: NextRequest) {
  try {
    const { success, user, error } = await requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins can create faculty
    if (user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get current user's department
    // A super_admin belongs to no department and must not be scoped out of
    // the system; see resolveDepartmentScope.
    const departmentIdScope = await resolveDepartmentScope(request, user!);
    if (departmentIdScope.error) return departmentIdScope.error;

    // A faculty member must belong to a department. A super_admin has none of
    // their own, so the target department has to come from the request.
    const departmentId =
      departmentIdScope.departmentId ??
      (typeof (validatedData as { departmentId?: number }).departmentId === 'number'
        ? (validatedData as { departmentId?: number }).departmentId!
        : null);

    if (departmentId === null) {
      return NextResponse.json(
        {
          success: false,
          error:
            'departmentId is required when creating faculty as a super admin.',
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validationResult = createFacultySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error.errors[0]?.message || 'Validation failed',
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Check if email already exists
    const existingUser = await prisma.users.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password (use role-based default password)
    const defaultPassword = generateTemporaryPassword();
    const hashedPassword = await hash(defaultPassword, 12);

    // Generate username from email
    const username = validatedData.email.split('@')[0];

    // Get faculty role
    const facultyRole = await prisma.roles.findUnique({
      where: { name: 'faculty' },
    });

    if (!facultyRole) {
      return NextResponse.json(
        { success: false, error: 'Faculty role not found' },
        { status: 500 }
      );
    }

    // Start transaction to create user, assign faculty role, and create faculty record
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.users.create({
        data: {
          email: validatedData.email,
          username,
          password_hash: hashedPassword,
        // Temporary credential: the user must set their own before using the app
        must_change_password: true,
          first_name: validatedData.first_name,
          last_name: validatedData.last_name,
          phone_number: validatedData.phone_number || null,
          status: validatedData.status || 'active',
          email_verified: false,
          profile_image: null,
          last_login: null,
          updatedAt: new Date(),
        },
      });

      // Assign faculty role
      await tx.userroles.create({
        data: {
          userId: newUser.id,
          roleId: facultyRole.id,
          updatedAt: new Date(),
        },
      });

      // Create faculty record
      const faculty = await tx.faculties.create({
        data: {
          userId: newUser.id,
          departmentId,
          designation: validatedData.designation || 'Faculty',
          status: validatedData.status || 'active',
          updatedAt: new Date(),
        },
        include: {
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      return { user: newUser, faculty };
    });

    // Format the response
    const formattedFaculty = {
      id: result.faculty.id,
      userId: result.user.id,
      designation: result.faculty.designation,
      status: result.faculty.status,
      user: {
        id: result.user.id,
        first_name: result.user.first_name,
        last_name: result.user.last_name,
        email: result.user.email,
        status: result.user.status,
      },
      department: result.faculty.department,
    };

    return NextResponse.json({
      success: true,
      data: formattedFaculty,
      message: 'Faculty created successfully',
      defaultPassword,
    });
  } catch (error) {
    console.error('Error creating faculty:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create faculty',
      },
      { status: 500 }
    );
  }
}
