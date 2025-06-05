'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_TOKEN_COOKIE } from '@/constants/auth';

export async function logout() {
  const cookieStore = await cookies();

  // Method 2: Alternative approach - explicitly delete the cookie
  cookieStore.delete(AUTH_TOKEN_COOKIE);

  // Redirect to login page
  redirect('/login');
}
