'use client';

import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
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
    <div className='w-full'>
      {/* Header */}
      <div className='mb-8'>
        <h2 className='text-2xl sm:text-3xl font-extrabold tracking-tight text-ink mb-2'>
          Forgot your password?
        </h2>
        <p className='text-base text-ink-2'>
          {!isEmailSent
            ? "No worries, we'll send you reset instructions"
            : 'Check your email for reset instructions'}
        </p>
      </div>

      {!isEmailSent ? (
        <form onSubmit={handleSubmit} className='space-y-5'>
          {/* Email Field */}
          <div>
            <label
              htmlFor='email'
              className='block text-sm font-medium mb-2 text-ink-2'
            >
              Email address
            </label>
            <input
              id='email'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border transition-all focus:outline-none bg-surface text-ink ${
                errors.email 
                  ? 'border-bad focus:border-bad focus:ring-2 focus:ring-bad/20' 
                  : 'border-firm focus:border-primary focus:ring-2 focus:ring-primary/20'
              }`}
              onBlur={() => validateEmail(email)}
              placeholder='Enter your registered email'
            />
            {errors.email && (
              <p className='text-bad text-sm mt-1'>{errors.email}</p>
            )}
          </div>

          {/* Server Error */}
          {serverError && (
            <div 
              className='px-4 py-3 rounded-lg border text-sm'
              style={{
                background: 'var(--error-opacity-05)',
                borderColor: 'var(--error-opacity-20)',
                color: 'var(--error-dark)'
              }}
            >
              <div className='flex items-center gap-2'>
                <AlertCircle className='w-4 h-4' />
                <span>{serverError}</span>
              </div>
            </div>
          )}

          {/* Back to sign in */}
          <div className='flex items-center justify-between pt-2'>
            <Link
              href='/login'
              className='text-sm font-medium inline-flex items-center py-1 hover:underline'
              style={{ color: 'var(--accent)' }}
            >
              <ArrowLeft className='w-4 h-4 mr-1' />
              Back to sign in
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type='submit'
            disabled={isLoading}
          className='accent-btn w-full py-3.5 rounded-xl font-semibold transition-colors disabled:opacity-70 disabled:cursor-not-allowed'
        >
            {isLoading ? (
              <span className='flex items-center justify-center'>
                <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2' />
                Sending...
              </span>
            ) : (
              'Send reset instructions'
            )}
          </button>
        </form>
      ) : (
        <div className='text-center space-y-6'>
          <div 
            className='px-6 py-5 rounded-xl border-2'
            style={{
              background: 'var(--success-green-opacity-05)',
              borderColor: 'var(--success-green-opacity-20)'
            }}
          >
            <CheckCircle2 className='w-12 h-12 mx-auto mb-3' style={{ color: 'var(--success-green)' }} />
            <p className='font-medium' style={{ color: 'var(--success-green-dark)' }}>
              Reset instructions have been sent to your email.
            </p>
          </div>
          <Link
            href='/login'
            className='font-medium transition-colors inline-flex items-center py-1 hover:underline'
            style={{ color: 'var(--accent)' }}
          >
            <ArrowLeft className='w-4 h-4 mr-1' />
            Back to sign in
          </Link>
        </div>
      )}
    </div>
  );
}
