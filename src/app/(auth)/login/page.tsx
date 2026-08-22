import type { Metadata } from 'next';
import LoginForm from '@/components/auth/LoginForm';
import { PRODUCT_NAME } from '@/constants/branding';

export const metadata: Metadata = {
  title: 'Sign in',
  description: `Sign in to your ${PRODUCT_NAME} portal.`,
};

export default function LoginPage() {
  return <LoginForm />;
}
