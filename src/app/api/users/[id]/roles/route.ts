import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';

/**
 * @swagger
 * /api/users/{id}/roles:
 *   post:
 *     summary: Assign roles to a user
 *     description: Assign one or more roles to a user along with role-specific details
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roles
 *             properties:
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [sub_admin, department_admin, teacher, student]
 *                 description: List of roles to assign
 *               studentDetails:
 *                 type: object
 *                 properties:
 *                   rollNumber:
 *                     type: string
 *                   departmentId:
 *                     type: integer
 *                   programId:
 *                     type: integer
 *               facultyDetails:
 *                 type: object
 *                 properties:
 *                   departmentId:
 *                     type: integer
 *                   designation:
 *                     type: string
 *     responses:
 *       200:
 *         description: Roles assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad Request - Invalid role or missing required details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User does not have permission
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

// POST /api/users/[id]/roles - Assign roles and role-specific details to a user
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and get user data
    const { success, user: authUser, error } = await requireAuth(request);
    if (!success) {
      return NextResponse.json({ error }, { status: 401 });
    }

    // Check if user has admin role
    if (authUser?.role !== 'super_admin' && authUser?.role !== 'sub_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { roles, studentDetails, facultyDetails } = body;

    // Validate required fields
    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return NextResponse.json(
        { error: 'At least one role is required' },
        { status: 400 }
      );
    }

    // Parse user ID safely
    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userrole: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Validate roles and role-specific details
    const validRoles = ['sub_admin', 'department_admin', 'teacher', 'student'];
    const hasStudentRole = roles.includes('student');
    const hasFacultyRole =
      roles.includes('teacher') || roles.includes('department_admin');
    const hasSubAdminRole = roles.includes('sub_admin');

    // Validate roles
    for (const role of roles) {
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: `Invalid role: ${role}` },
          { status: 400 }
        );
      }

      if (role === 'super_admin') {
        return NextResponse.json(
          { error: 'Super admin role cannot be assigned' },
          { status: 400 }
        );
      }
    }

    // Validate role-specific details
    if (hasStudentRole) {
      if (!studentDetails) {
        return NextResponse.json(
          { error: 'Student details are required for student role' },
          { status: 400 }
        );
      }
      if (
        !studentDetails.rollNumber ||
        !studentDetails.departmentId ||
        !studentDetails.programId
      ) {
        return NextResponse.json(
          {
            error:
              'Student details must include rollNumber, departmentId, and programId',
          },
          { status: 400 }
        );
      }
    }

    if (hasFacultyRole) {
      if (!facultyDetails) {
        return NextResponse.json(
          {
            error:
              'Faculty details are required for teacher/department admin role',
          },
          { status: 400 }
        );
      }
      if (!facultyDetails.departmentId) {
        return NextResponse.json(
          { error: 'Faculty details must include departmentId' },
          { status: 400 }
        );
      }
    }

    // Get role IDs
    const roleRecords = await prisma.role.findMany({
      where: { name: { in: roles } },
    });

    if (roleRecords.length !== roles.length) {
      return NextResponse.json(
        { error: 'One or more roles are invalid' },
        { status: 400 }
      );
    }

    // Start a transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      try {
        // Delete existing roles and role-specific records
        await tx.userrole.deleteMany({
          where: { userId },
        });
        await tx.student.deleteMany({
          where: { userId },
        });
        await tx.faculty.deleteMany({
          where: { userId },
        });

        // Handle each role separately
        for (const role of roles) {
          // Find the role record
          const roleRecord = roleRecords.find((r) => r.name === role);
          if (!roleRecord) continue;

          // Create user role
          await tx.userrole.create({
            data: {
              userId,
              roleId: roleRecord.id,
              updatedAt: new Date(),
            },
          });

          // Handle role-specific details
          switch (role) {
            case 'student':
              if (studentDetails) {
                await tx.student.create({
                  data: {
                    rollNumber: studentDetails.rollNumber,
                    departmentId: parseInt(studentDetails.departmentId),
                    programId: parseInt(studentDetails.programId),
                    status: 'active' as const,
                    updatedAt: new Date(),
                    userId,
                  },
                });
              }
              break;

            case 'teacher':
              if (facultyDetails) {
                await tx.faculty.create({
                  data: {
                    departmentId: parseInt(facultyDetails.departmentId),
                    designation: facultyDetails.designation || 'Teacher',
                    status: 'active' as const,
                    updatedAt: new Date(),
                    userId,
                  },
                });
              }
              break;

            case 'department_admin':
              if (facultyDetails) {
                const departmentId = parseInt(facultyDetails.departmentId);

                // First create the faculty record
                await tx.faculty.create({
                  data: {
                    departmentId,
                    designation: 'Department Admin',
                    status: 'active' as const,
                    updatedAt: new Date(),
                    userId,
                  },
                });

                // Then update the department's adminId
                await tx.department.update({
                  where: { id: departmentId },
                  data: {
                    adminId: userId,
                    updatedAt: new Date(),
                  },
                });
              }
              break;

            case 'sub_admin':
              // No additional details needed for sub_admin
              break;
          }
        }

        // Fetch updated user with roles and details
        const updatedUser = await tx.user.findUnique({
          where: { id: userId },
          include: {
            userrole: {
              include: {
                role: true,
              },
            },
            student: true,
            faculty: true,
          },
        });

        if (!updatedUser) {
          throw new Error('Failed to fetch updated user');
        }

        return updatedUser;
      } catch (error) {
        console.error('Transaction error:', error);
        throw error;
      }
    });

    if (!result) {
      throw new Error('Failed to update user roles');
    }

    return NextResponse.json({
      success: true,
      data: {
        id: result.id,
        email: result.email,
        first_name: result.first_name,
        last_name: result.last_name,
        roles: result.userrole.map((ur) => ur.role.name),
        student: result.student,
        faculty: result.faculty,
      },
    });
  } catch (error) {
    console.error('Error in role assignment:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to assign roles',
      },
      { status: 500 }
    );
  }
}
