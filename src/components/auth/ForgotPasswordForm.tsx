// components/auth/ForgotPasswordForm.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail,
  ArrowLeft,
  School,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

type ValidationErrors = { [key: string]: string };

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [serverError, setServerError] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setErrors((prev) => ({ ...prev, email: 'Email is required' }));
      return false;
    }
    if (!emailRegex.test(email)) {
      setErrors((prev) => ({
        ...prev,
        email: 'Please enter a valid email address',
      }));
      return false;
    }
    setErrors((prev) => ({ ...prev, email: '' }));
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setServerError('');

    const isEmailValid = validateEmail(email);

    if (!isEmailValid) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!data.success) {
        setServerError(
          data.message || 'Failed to send reset email. Please try again.'
        );
        return;
      }

      setIsEmailSent(true);
    } catch (error) {
      setServerError(
        'Network error. Please check your connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='max-w-md w-full space-y-8'>
      {/* Header */}
      <div className='text-center'>
        <div className='bg-gradient-to-br from-primary to-primary-light w-20 h-20 rounded-2xl mx-auto flex items-center justify-center mb-6 transform hover:rotate-12 transition-all duration-300 group shadow-lg shadow-primary-light/20'>
          <School className='w-12 h-12 text-accent group-hover:scale-110 transition-transform' />
        </div>
        <h2 className='text-3xl font-bold text-primary'>Forgot Password?</h2>
        <p className='text-text-light mt-2'>
          {!isEmailSent
            ? "No worries, we'll send you reset instructions"
            : 'Check your email for reset instructions'}
        </p>
      </div>

      {!isEmailSent ? (
        <>
          {/* Information Card */}
          <div className='bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3'>
            <h3 className='font-semibold text-blue-800 flex items-center gap-2'>
              <AlertCircle className='w-5 h-5' />
              Before You Begin
            </h3>
            <ul className='text-sm text-blue-700 space-y-2'>
              <li className='flex items-start gap-2'>
                <div className='w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5'></div>
                <span>
                  Make sure to check your spam folder if you don't receive the
                  email
                </span>
              </li>
              <li className='flex items-start gap-2'>
                <div className='w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5'></div>
                <span>
                  The reset link will expire after 30 minutes for security
                </span>
              </li>
              <li className='flex items-start gap-2'>
                <div className='w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5'></div>
                <span>You'll need access to your registered email address</span>
              </li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Email Field */}
            <div className='space-y-2'>
              <label
                htmlFor='email'
                className='block text-sm font-semibold text-text'
              >
                Email Address
              </label>
              <div className='relative group'>
                <Mail className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light group-hover:text-primary-light transition-colors' />
                <input
                  id='email'
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => validateEmail(email)}
                  className={`w-full pl-12 pr-4 py-4 rounded-xl border-2 ${
                    errors.email ? 'border-red-500' : 'border-gray-200'
                  } bg-gray-50 text-text placeholder:text-text-light focus:ring-2 focus:ring-primary-light focus:border-primary-light transition-all duration-300 hover:border-primary-light/50`}
                  placeholder='Enter your registered email'
                />
              </div>
              {errors.email && (
                <p className='text-red-500 text-sm mt-1'>{errors.email}</p>
              )}
            </div>

            {/* Server Error Message */}
            {serverError && (
              <div className='bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg'>
                {serverError}
              </div>
            )}

            {/* Submit Button */}
            <button
              type='submit'
              disabled={isLoading}
              className='relative w-full bg-gradient-to-r from-primary to-primary-light text-accent py-4 rounded-xl font-semibold hover:from-primary-light hover:to-primary transform hover:-translate-y-0.5 transition-all duration-300 shadow-lg shadow-primary-light/20 disabled:opacity-70 disabled:cursor-not-allowed'
            >
              <span
                className={`inline-flex items-center justify-center ${
                  isLoading ? 'invisible' : ''
                }`}
              >
                Send Reset Instructions
              </span>
              {isLoading && (
                <div className='absolute inset-0 flex items-center justify-center'>
                  <div className='w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin' />
                </div>
              )}
            </button>
          </form>
        </>
      ) : (
        /* Success Message */
        <div className='space-y-6'>
          <div className='bg-green-50 border border-green-100 rounded-xl p-6 text-center'>
            <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <CheckCircle2 className='w-6 h-6 text-green-600' />
            </div>
            <h3 className='text-green-800 font-semibold text-lg mb-2'>
              Check Your Email
            </h3>
            <p className='text-green-700 text-sm mb-4'>
              We've sent password reset instructions to {email}
            </p>
            <div className='text-xs text-green-600 space-y-2'>
              <p>Didn't receive the email? Check your spam folder.</p>
              <p>The reset link will expire in 30 minutes.</p>
            </div>
          </div>

          <button
            onClick={() => setIsEmailSent(false)}
            className='w-full bg-gray-100 text-text py-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors'
          >
            Try Different Email
          </button>
        </div>
      )}

      {/* Back to Login Link */}
      <div className='pt-4'>
        <Link
          href='/login'
          className='inline-flex items-center text-primary hover:text-primary-light font-medium transition-colors group'
        >
          <ArrowLeft className='w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform' />
          Back to Login
        </Link>
      </div>
    </div>
  );
}
