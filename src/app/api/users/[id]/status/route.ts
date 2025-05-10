import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';

/**
 * @swagger
 * /api/users/{id}/status:
 *   put:
 *     summary: Update user status
 *     description: Update the status of a specific user (active/inactive)
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: New status for the user
 *     responses:
 *       200:
 *         description: User status updated successfully
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
 *                     id:
 *                       type: integer
 *                     status:
 *                       type: string
 *       400:
 *         description: Invalid request body or user ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Await the params
  const { id } = await context.params;

  // Validate the ID
  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
  }

  const userId = Number(id);

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
    const { status } = body;

    // Validate status
    if (
      !status ||
      !['active', 'inactive', 'suspended', 'deleted'].includes(status)
    ) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
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
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
