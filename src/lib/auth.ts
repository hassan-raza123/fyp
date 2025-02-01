import jwt from 'jsonwebtoken';

export async function verifyAuth(token: string) {
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET!);
    return verified;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}
