'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

type ValidationErrors = { [key: string]: string };

function ResetPasswordFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [serverError, setServerError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setErrors((prev) => ({ ...prev, password: 'Password is required' }));
      return false;
    }
    if (password.length < 8) {
      setErrors((prev) => ({
        ...prev,
        password: 'Password must be at least 8 characters',
      }));
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      setErrors((prev) => ({
        ...prev,
        password: 'Password must contain at least one uppercase letter',
      }));
      return false;
    }
    if (!/[a-z]/.test(password)) {
      setErrors((prev) => ({
        ...prev,
        password: 'Password must contain at least one lowercase letter',
      }));
      return false;
    }
    if (!/\d/.test(password)) {
      setErrors((prev) => ({
        ...prev,
        password: 'Password must contain at least one number',
      }));
      return false;
    }
    if (!/[@$!%*?&]/.test(password)) {
      setErrors((prev) => ({
        ...prev,
        password:
          'Password must contain at least one special character (@$!%*?&)',
      }));
      return false;
    }
    setErrors((prev) => ({ ...prev, password: '' }));
    return true;
  };

  const validateConfirmPassword = (confirmPassword: string): boolean => {
    if (!confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: 'Please confirm your password',
      }));
      return false;
    }
    if (confirmPassword !== password) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: 'Passwords do not match',
      }));
      return false;
    }
    setErrors((prev) => ({ ...prev, confirmPassword: '' }));
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setServerError('');

    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

    if (!isPasswordValid || !isConfirmPasswordValid) {
      setIsLoading(false);
      return;
    }

    if (!token) {
      setServerError('Invalid reset link. Please request a new one.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!data.success) {
        setServerError(
          data.message || 'Failed to reset password. Please try again.'
        );
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch {
      setServerError(
        'Network error. Please check your connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className='w-full text-center'>
        <div 
          className='rounded-2xl p-8 border-2'
          style={{
            background: 'var(--error-opacity-05)',
            borderColor: 'var(--error-opacity-20)'
          }}
        >
          <div 
            className='w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4'
            style={{
              background: 'var(--error-opacity-10)'
            }}
          >
            <AlertCircle className='w-8 h-8' style={{ color: 'var(--error-dark)' }} />
          </div>
          <h3 className='font-bold text-xl mb-2' style={{ color: 'var(--error-darker)' }}>
            Invalid Reset Link
          </h3>
          <p className='text-sm mb-6' style={{ color: 'var(--error-light)' }}>
            This password reset link is invalid or has expired.
          </p>
          <Link
            href='/forgot-password'
            className='inline-block font-semibold text-white py-3 px-6 rounded-xl transition-all duration-300 hover:-translate-y-0.5'
            style={{
              background: 'var(--brand-primary)',
              boxShadow: `0 10px 25px var(--brand-primary-opacity-30)`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--brand-primary-dark)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--brand-primary)';
            }}
          >
            Request New Reset Link
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className='w-full text-center'>
        <div 
          className='rounded-2xl p-8 border-2'
          style={{
            background: 'var(--success-green-opacity-05)',
            borderColor: 'var(--success-green-opacity-20)'
          }}
        >
          <div 
            className='w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4'
            style={{
              background: 'var(--success-green-opacity-10)'
            }}
          >
            <CheckCircle2 className='w-8 h-8' style={{ color: 'var(--success-green)' }} />
          </div>
          <h3 className='font-bold text-xl mb-2' style={{ color: 'var(--success-green-dark)' }}>
            Password Reset Successful! 🎉
          </h3>
          <p className='text-sm' style={{ color: 'var(--success-green-light)' }}>
            Your password has been reset successfully. Redirecting to login page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='w-full'>
      {/* Header */}
      <div className='mb-8'>
        <h2 
          className='text-3xl font-bold mb-2'
          style={{ color: 'var(--brand-primary)' }}
        >
          Reset Password
        </h2>
        <p className='text-base' style={{ color: 'var(--gray-600)' }}>
          Enter your new password below
        </p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-5'>
        {/* Password Field */}
        <div>
          <label
            htmlFor='password'
            className='block text-sm font-medium mb-2 text-gray-700'
          >
            New Password
          </label>
          <div className='relative'>
            <input
              id='password'
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-3 pr-12 rounded-lg border transition-all focus:outline-none bg-white text-gray-900 ${
                errors.password 
                  ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                  : 'border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
              }`}
              onBlur={() => validatePassword(password)}
              placeholder='Enter your new password'
            />
            <button
              type='button'
              onClick={() => setShowPassword(!showPassword)}
              className='absolute right-4 top-1/2 -translate-y-1/2 transition-colors text-gray-400 hover:text-gray-600'
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && (
            <p className='text-red-500 text-xs mt-1 flex items-center gap-1'>
              <span>⚠</span> {errors.password}
            </p>
          )}
        </div>

        {/* Confirm Password Field */}
        <div>
          <label
            htmlFor='confirmPassword'
            className='block text-sm font-medium mb-2 text-gray-700'
          >
            Confirm New Password
          </label>
          <div className='relative'>
            <input
              id='confirmPassword'
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full px-4 py-3 pr-12 rounded-lg border transition-all focus:outline-none bg-white text-gray-900 ${
                errors.confirmPassword 
                  ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                  : 'border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
              }`}
              onBlur={() => validateConfirmPassword(confirmPassword)}
              placeholder='Confirm your new password'
            />
            <button
              type='button'
              onClick={() => setShowPassword(!showPassword)}
              className='absolute right-4 top-1/2 -translate-y-1/2 transition-colors text-gray-400 hover:text-gray-600'
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className='text-red-500 text-xs mt-1 flex items-center gap-1'>
              <span>⚠</span> {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Password Requirements */}
        <div 
          className='rounded-xl p-4 border text-sm'
          style={{
            background: 'var(--brand-primary-opacity-10)',
            borderColor: 'var(--brand-primary-opacity-10)'
          }}
        >
          <p className='font-semibold mb-2' style={{ color: 'var(--brand-primary)' }}>
            Password must contain:
          </p>
          <ul className='space-y-1' style={{ color: 'var(--gray-600)' }}>
            <li className='text-xs'>• At least 8 characters</li>
            <li className='text-xs'>• One uppercase letter (A-Z)</li>
            <li className='text-xs'>• One lowercase letter (a-z)</li>
            <li className='text-xs'>• One number (0-9)</li>
            <li className='text-xs'>• One special character (@$!%*?&)</li>
          </ul>
        </div>

        {/* Server Error */}
        {serverError && (
          <div 
            className='px-4 py-3 rounded-lg border-2 border-red-200'
            style={{
              background: 'var(--error-opacity-05)',
              color: 'var(--error-dark)'
            }}
          >
            <div className='flex items-center gap-2 justify-center'>
              <AlertCircle className='w-4 h-4' />
              <span className='font-medium text-sm'>{serverError}</span>
            </div>
          </div>
        )}

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
              e.currentTarget.style.boxShadow = `0 4px 12px var(--brand-primary-opacity-30)`;
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
              Resetting...
            </span>
          ) : (
            'Reset Password'
          )}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordFormContent />
    </Suspense>
  );
}
