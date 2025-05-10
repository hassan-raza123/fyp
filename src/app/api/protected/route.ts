import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * @swagger
 * /api/protected:
 *   get:
 *     summary: Access protected resource
 *     description: Example of a protected API endpoint that requires authentication
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Protected resource accessed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
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
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */

export async function GET(request: NextRequest) {
  try {
    // Get the token from cookies
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the token and get user data
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    // Now you can access user information from payload
    const userId = payload.userId;
    const userEmail = payload.email;
    const userRole = payload.role;

    // Your protected API logic here
    return NextResponse.json({
      success: true,
      message: 'Protected API accessed successfully',
      user: {
        id: userId,
        email: userEmail,
        role: userRole,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
