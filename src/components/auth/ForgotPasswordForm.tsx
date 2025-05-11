// components/auth/ForgotPasswordForm.tsx
'use client';

import React, { useState } from 'react';
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
    } catch {
      setServerError(
        'Network error. Please check your connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='max-w-md w-full mx-auto p-6'>
      <div className='text-center mb-8'>
        <div className='bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 w-20 h-20 rounded-2xl mx-auto flex items-center justify-center mb-6 transform hover:rotate-12 transition-all duration-300 group shadow-lg shadow-primary-light/20'>
          <School className='w-12 h-12 text-white group-hover:scale-110 transition-transform' />
        </div>
        <h2 className='text-3xl font-bold text-primary'>Forgot Password?</h2>
        <p className='text-text-light mt-2'>
          {!isEmailSent
            ? "No worries, we'll send you reset instructions"
            : 'Check your email for reset instructions'}
        </p>
      </div>

      {!isEmailSent ? (
        <form onSubmit={handleSubmit} className='space-y-6'>
          <div className='space-y-2'>
            <label
              htmlFor='email'
              className='block text-sm font-semibold text-primary'
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
                } bg-white text-primary placeholder:text-text-light focus:ring-2 focus:ring-primary-light focus:border-primary-light transition-all duration-300 hover:border-primary-light/50`}
                placeholder='Enter your registered email'
              />
            </div>
            {errors.email && (
              <p className='text-red-500 text-sm mt-1'>{errors.email}</p>
            )}
          </div>

          {serverError && (
            <div className='text-red-500 text-sm text-center'>
              {serverError}
            </div>
          )}

          <div className='flex items-center justify-between'>
            <Link
              href='/login'
              className='text-sm text-primary hover:text-primary-light inline-flex items-center'
            >
              <ArrowLeft className='w-4 h-4 mr-1' />
              Back to Login
            </Link>
          </div>

          <button
            type='submit'
            disabled={isLoading}
            className='relative w-full bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-primary-light/30 transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed'
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
                <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
              </div>
            )}
          </button>
        </form>
      ) : (
        <div className='text-center space-y-6'>
          <div className='bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl'>
            <CheckCircle2 className='w-6 h-6 mx-auto mb-2' />
            <p>Reset instructions have been sent to your email.</p>
          </div>
          <Link
            href='/login'
            className='text-primary hover:text-primary-light font-medium transition-colors inline-flex items-center'
          >
            <ArrowLeft className='w-4 h-4 mr-1' />
            Back to Login
          </Link>
        </div>
      )}
    </div>
  );
}
