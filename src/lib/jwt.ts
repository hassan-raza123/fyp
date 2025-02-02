import { TokenPayload } from '@/types/auth';
import * as jose from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-strong-secret-key-for-development-12345'
);

export async function createToken(payload: TokenPayload): Promise<string> {
  try {
    return await new jose.SignJWT({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      userData: payload.userData,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(secret);
  } catch (error) {
    console.error('Token creation error:', error);
    throw new Error('Failed to create token');
  }
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, secret);

    // Validate the required fields
    if (!payload.userId || !payload.role) {
      console.error('Invalid token structure');
      return null;
    }

    return payload as unknown as TokenPayload;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}
