import type { Metadata } from 'next';
import OTPVerificationForm from '@/components/auth/OTPVerificationForm';

export const metadata: Metadata = {
  title: 'Verify code',
  description: 'Enter the verification code sent to your email.',
};

export default function OTPVerificationPage() {
  return <OTPVerificationForm />;
}
