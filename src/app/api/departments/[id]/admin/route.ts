import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';

interface UserWithRole {
  id: number;
  userrole: {
    role: {
      name: string;
    };
  }[];
}

/**
 * @swagger
 * /api/departments/{id}/admin:
 *   get:
 *     summary: Get department admin
 *     description: Retrieve information about the admin of a specific department
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Department ID
 *     responses:
 *       200:
 *         description: Department admin information retrieved successfully
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
 *                     designation:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Department or admin not found
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Assign department admin
 *     description: Assign a user as the admin of a specific department
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Department ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: ID of the user to be assigned as department admin
 *     responses:
 *       200:
 *         description: Department admin assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     department:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         code:
 *                           type: string
 *                     admin:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         email:
 *                           type: string
 *                         first_name:
 *                           type: string
 *                         last_name:
 *                           type: string
 *       400:
 *         description: Bad Request - Invalid department ID or user ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Department or user not found
 *       500:
 *         description: Internal server error
 */

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and get user data
    const { success, user, error } = requireAuth(request);
    if (!success) {
      return NextResponse.json({ success: false, error }, { status: 401 });
    }

    // Check if user has admin role
    if (user?.role !== 'super_admin' && user?.role !== 'sub_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const departmentId = parseInt(params.id);
    if (isNaN(departmentId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid department ID' },
        { status: 400 }
      );
    }

    const { adminId } = await request.json();

    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      return NextResponse.json(
        { success: false, error: 'Department not found' },
        { status: 404 }
      );
    }

    // Validate adminId if provided
    if (adminId !== null) {
      const admin = await prisma.user.findUnique({
        where: { id: adminId },
        include: {
          userrole: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!admin) {
        return NextResponse.json(
          { success: false, error: 'Admin not found' },
          { status: 404 }
        );
      }

      // Check if user has department_admin role
      const isDepartmentAdmin = admin.userrole.some(
        (ur) => ur.role.name === 'department_admin'
      );

      if (!isDepartmentAdmin) {
        return NextResponse.json(
          { success: false, error: 'User is not a department admin' },
          { status: 400 }
        );
      }
    }

    // Update department
    const updatedDepartment = await prisma.department.update({
      where: { id: departmentId },
      data: { adminId },
      include: {
        admin: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedDepartment,
    });
  } catch (error) {
    console.error('Error assigning department admin:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to assign department admin',
      },
      { status: 500 }
    );
  }
}
