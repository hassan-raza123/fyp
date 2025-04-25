export const AUTH_TOKEN_COOKIE = 'token'; // Change this to match your current cookie name

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 24 * 60 * 60, // 24 hours
  path: '/',
};
