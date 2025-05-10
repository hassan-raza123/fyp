import { NextRequest, NextResponse } from 'next/server';
import { requireRole, getUserFromRequest } from '@/lib/api-utils';

/**
 * @swagger
 * /api/example:
 *   get:
 *     summary: Example authenticated endpoint
 *     description: Example API endpoint that requires authentication and specific roles
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Access granted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Example admin endpoint
 *     description: Example API endpoint that requires admin role
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Admin action processed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Example authenticated action
 *     description: Example API endpoint that requires any authenticated user
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Action processed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

// Example API route that requires authentication
export async function GET(request: NextRequest) {
  // Check if user is authenticated and has required role
  const { success, user, error } = requireRole(request, ['admin', 'teacher']);

  if (!success) {
    return NextResponse.json({ error }, { status: 401 });
  }

  // Access user data from request
  const userId = user?.userId;
  const userRole = user?.role;
  const userEmail = user?.email;

  // Your API logic here
  return NextResponse.json({
    message: 'Access granted',
    user: {
      id: userId,
      email: userEmail,
      role: userRole,
    },
  });
}

// Example API route that requires specific role
export async function POST(request: NextRequest) {
  // Check if user is authenticated and has admin role
  const { success, user, error } = requireRole(request, ['admin']);

  if (!success) {
    return NextResponse.json({ error }, { status: 401 });
  }

  // Get request body
  const body = await request.json();

  // Your API logic here
  return NextResponse.json({
    message: 'Admin action processed',
    data: body,
    user: {
      id: user?.userId,
      email: user?.email,
      role: user?.role,
    },
  });
}

// Example API route that requires any authenticated user
export async function PUT(request: NextRequest) {
  // Check if user is authenticated
  const { success, user, error } = requireAuth(request);

  if (!success) {
    return NextResponse.json({ error }, { status: 401 });
  }

  // Get request body
  const body = await request.json();

  // Your API logic here
  return NextResponse.json({
    message: 'Action processed',
    data: body,
    user: {
      id: user?.userId,
      email: user?.email,
      role: user?.role,
    },
  });
}
