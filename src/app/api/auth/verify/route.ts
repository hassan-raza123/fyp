import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { AUTH_TOKEN_COOKIE } from '@/constants/auth';

export async function GET(request: Request) {
  try {
    // Get token from cookies
    const token = request.headers
      .get('cookie')
      ?.split(';')
      .find((c) => c.trim().startsWith(`${AUTH_TOKEN_COOKIE}=`))
      ?.split('=')[1];

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Verify token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    // Return user details
    return NextResponse.json({
      isAuthenticated: true,
      user: {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
        userData: payload.userData,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid token', isAuthenticated: false },
      { status: 401 }
    );
  }
}
