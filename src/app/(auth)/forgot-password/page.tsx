import type { Metadata } from 'next';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

/**
 * The title used to come from the shared `(auth)` layout, which set it to
 * "Login | Attainly" for every page in the group — so this page, the OTP
 * page and the reset page all announced themselves as the login screen in
 * the browser tab, in history and in a bookmark. Each page names itself now.
 */
export const metadata: Metadata = {
  title: 'Forgot password',
  description: 'Request a link to reset your password.',
};

// Was also named `LoginPage`, in a file that is not the login page.
export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
