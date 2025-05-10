import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';
import { hash } from 'bcryptjs';

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get a specific user
 *     description: Retrieve detailed information about a specific user
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 email:
 *                   type: string
 *                 first_name:
 *                   type: string
 *                 last_name:
 *                   type: string
 *                 status:
 *                   type: string
 *                 userrole:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       role:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                 faculty:
 *                   type: object
 *                   nullable: true
 *                 student:
 *                   type: object
 *                   nullable: true
 *       400:
 *         description: Invalid user ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update a user
 *     description: Update information for a specific user
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
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     first_name:
 *                       type: string
 *                     last_name:
 *                       type: string
 *                     status:
 *                       type: string
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

// GET /api/users/[id] - Get a specific user
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const userId = parseInt(context.params.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const authResult = await requireAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the requesting user's role
    const requestingUserRole = await prisma.userrole.findFirst({
      where: { userId: authResult.user.userId },
      include: { role: true },
    });

    // If the requesting user is a sub_admin, don't allow access to super_admin
    if (requestingUserRole?.role.name === 'sub_admin') {
      const targetUserRole = await prisma.userrole.findFirst({
        where: { userId },
        include: { role: true },
      });

      if (targetUserRole?.role.name === 'super_admin') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Get the target user with their role, faculty, and student data
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userrole: {
          include: {
            role: true,
          },
        },
        faculty: true,
        student: true,
      },
    });

    // If user not found or is a super admin, return not found
    if (!targetUser || targetUser.userrole[0]?.role.name === 'super_admin') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return the user data without the super admin
    return NextResponse.json({
      id: targetUser.id,
      email: targetUser.email,
      first_name: targetUser.first_name,
      last_name: targetUser.last_name,
      status: targetUser.status,
      userrole: targetUser.userrole.map((ur) => ({
        role: {
          name: ur.role.name,
        },
      })),
      faculty: targetUser.faculty,
      student: targetUser.student,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update a user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and get user data
    const { success, user, error } = requireAuth(request);
    if (!success) {
      return NextResponse.json({ error }, { status: 401 });
    }

    // Check if user has admin role
    if (user?.role !== 'super_admin' && user?.role !== 'sub_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      email,
      first_name,
      last_name,
      phone_number,
      status,
      role,
      password,
      faculty,
      student,
    } = body;

    // Validate required fields
    if (!email || !first_name || !last_name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: Number(params.id) },
      include: {
        userrole: true,
        faculty: true,
        student: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if email is already taken by another user
    if (email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });
      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already taken' },
          { status: 400 }
        );
      }
    }

    // Update user data
    const updatedUser = await prisma.user.update({
      where: { id: Number(params.id) },
      data: {
        email,
        first_name,
        last_name,
        phone_number,
        status,
        ...(password && {
          password_hash: await hash(password, 12),
        }),
        userrole: {
          deleteMany: {},
          create: {
            role: {
              connect: {
                name: role,
              },
            },
          },
        },
        ...(role === 'teacher' &&
          faculty && {
            faculty: {
              upsert: {
                where: {
                  userId: Number(params.id),
                },
                create: {
                  departmentId: Number(faculty.departmentId),
                  designation: faculty.designation,
                  status: faculty.status || 'active',
                },
                update: {
                  departmentId: Number(faculty.departmentId),
                  designation: faculty.designation,
                  status: faculty.status || 'active',
                },
              },
            },
          }),
        ...(role === 'student' &&
          student && {
            student: {
              upsert: {
                where: {
                  userId: Number(params.id),
                },
                create: {
                  rollNumber: student.rollNumber,
                  departmentId: Number(student.departmentId),
                  programId: Number(student.programId),
                  status: student.status || 'active',
                },
                update: {
                  rollNumber: student.rollNumber,
                  departmentId: Number(student.departmentId),
                  programId: Number(student.programId),
                  status: student.status || 'active',
                },
              },
            },
          }),
      },
      include: {
        userrole: {
          include: {
            role: true,
          },
        },
        faculty: true,
        student: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete a user
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // First validate the user ID
    const userId = parseInt(context.params.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Check authentication
    const authResult = await requireAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the requesting user's role
    const requestingUserRole = await prisma.userrole.findFirst({
      where: { userId: authResult.user.userId },
      include: { role: true },
    });

    // If the requesting user is a sub_admin, don't allow deletion of super_admin
    if (requestingUserRole?.role.name === 'sub_admin') {
      const targetUserRole = await prisma.userrole.findFirst({
        where: { userId },
        include: { role: true },
      });

      if (targetUserRole?.role.name === 'super_admin') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Prevent deletion of the first super admin (ID 1)
    if (userId === 1) {
      return NextResponse.json(
        { error: 'Cannot delete the primary super admin' },
        { status: 403 }
      );
    }

    // First delete any related records
    await prisma.userrole.deleteMany({
      where: { userId },
    });

    await prisma.faculty.deleteMany({
      where: { userId },
    });

    await prisma.student.deleteMany({
      where: { userId },
    });

    // Finally delete the user
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
