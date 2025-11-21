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
        <h2 
          className='text-3xl font-bold mb-2'
          style={{ color: 'var(--brand-primary)' }}
        >
          Forgot Password?
        </h2>
        <p className='text-base' style={{ color: 'var(--gray-600)' }}>
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
              className='block text-sm font-medium mb-2'
              style={{ color: 'var(--gray-700)' }}
            >
              Email Address
            </label>
            <input
              id='email'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className='w-full px-4 py-3 rounded-lg border transition-all focus:outline-none'
              style={{
                borderColor: errors.email ? '#ef4444' : 'var(--gray-300)'
              }}
              onFocus={(e) => {
                if (!errors.email) {
                  e.target.style.borderColor = 'var(--brand-secondary)';
                  e.target.style.boxShadow = '0 0 0 3px var(--brand-secondary-opacity-10)';
                }
              }}
              onBlur={(e) => {
                validateEmail(email);
                if (!errors.email) {
                  e.target.style.borderColor = 'var(--gray-300)';
                  e.target.style.boxShadow = 'none';
                }
              }}
              placeholder='Enter your registered email'
            />
            {errors.email && (
              <p className='text-red-500 text-sm mt-1'>{errors.email}</p>
            )}
          </div>

          {/* Server Error */}
          {serverError && (
            <div 
              className='px-4 py-3 rounded-lg border text-sm'
              style={{
                background: 'rgba(239, 68, 68, 0.05)',
                borderColor: 'rgba(239, 68, 68, 0.2)',
                color: '#dc2626'
              }}
            >
              <div className='flex items-center gap-2'>
                <AlertCircle className='w-4 h-4' />
                <span>{serverError}</span>
              </div>
            </div>
          )}

          {/* Back to Login */}
          <div className='flex items-center justify-between pt-2'>
            <Link
              href='/login'
              className='text-sm font-medium inline-flex items-center hover:underline'
              style={{ color: 'var(--brand-primary)' }}
            >
              <ArrowLeft className='w-4 h-4 mr-1' />
              Back to Login
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type='submit'
            disabled={isLoading}
          className='w-full text-white py-3.5 rounded-lg font-semibold transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm'
          style={{
            background: 'var(--brand-primary)'
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.background = 'var(--brand-primary-dark)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(38, 40, 149, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.background = 'var(--brand-primary)';
            e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
          }}
          >
            {isLoading ? (
              <span className='flex items-center justify-center'>
                <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2' />
                Sending...
              </span>
            ) : (
              'Send Reset Instructions'
            )}
          </button>
        </form>
      ) : (
        <div className='text-center space-y-6'>
          <div 
            className='px-6 py-5 rounded-xl border-2'
            style={{
              background: 'rgba(34, 197, 94, 0.05)',
              borderColor: 'rgba(34, 197, 94, 0.2)'
            }}
          >
            <CheckCircle2 className='w-12 h-12 mx-auto mb-3' style={{ color: '#22c55e' }} />
            <p className='font-medium' style={{ color: '#15803d' }}>
              Reset instructions have been sent to your email.
            </p>
          </div>
          <Link
            href='/login'
            className='font-medium transition-colors inline-flex items-center hover:underline'
            style={{ color: 'var(--brand-primary)' }}
          >
            <ArrowLeft className='w-4 h-4 mr-1' />
            Back to Login
          </Link>
        </div>
      )}
    </div>
  );
}
