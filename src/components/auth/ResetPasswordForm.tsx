'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

type ValidationErrors = { [key: string]: string };

export default function ResetPasswordForm() {
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
        password: 'Password must contain at least one special character (@$!%*?&)',
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
        setServerError(data.message || 'Failed to reset password. Please try again.');
        return;
      }

      setIsSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch {
      setServerError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className='max-w-md w-full space-y-8 text-center'>
        <div className='bg-red-50 border border-red-200 rounded-xl p-6'>
          <div className='w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <AlertCircle className='w-6 h-6 text-red-600' />
          </div>
          <h3 className='text-red-800 font-semibold text-lg mb-2'>
            Invalid Reset Link
          </h3>
          <p className='text-red-700 text-sm mb-4'>
            This password reset link is invalid or has expired.
          </p>
          <Link
            href='/forgot-password'
            className='text-primary hover:text-primary-light font-medium transition-colors'
          >
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className='max-w-md w-full space-y-8 text-center'>
        <div className='bg-green-50 border border-green-100 rounded-xl p-6'>
          <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <CheckCircle2 className='w-6 h-6 text-green-600' />
          </div>
          <h3 className='text-green-800 font-semibold text-lg mb-2'>
            Password Reset Successful
          </h3>
          <p className='text-green-700 text-sm mb-4'>
            Your password has been reset successfully. You will be redirected to the login page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-md w-full space-y-8'>
      {/* Header */}
      <div className='text-center'>
        <h2 className='text-3xl font-bold text-primary'>Reset Password</h2>
        <p className='text-text-light mt-2'>
          Enter your new password below
        </p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Password Field */}
        <div className='space-y-2'>
          <label
            htmlFor='password'
            className='block text-sm font-semibold text-text'
          >
            New Password
          </label>
          <div className='relative group'>
            <Lock className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light group-hover:text-primary-light transition-colors' />
            <input
              id='password'
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => validatePassword(password)}
              className={`w-full pl-12 pr-12 py-4 rounded-xl border-2 ${
                errors.password ? 'border-red-500' : 'border-gray-200'
              } bg-gray-50 text-text placeholder:text-text-light focus:ring-2 focus:ring-primary-light focus:border-primary-light transition-all duration-300 hover:border-primary-light/50`}
              placeholder='Enter your new password'
            />
            <button
              type='button'
              onClick={() => setShowPassword(!showPassword)}
              className='absolute right-4 top-1/2 -translate-y-1/2 text-text-light hover:text-primary-light transition-colors'
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && (
            <p className='text-red-500 text-sm mt-1'>{errors.password}</p>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className='space-y-2'>
          <label
            htmlFor='confirmPassword'
            className='block text-sm font-semibold text-text'
          >
            Confirm New Password
          </label>
          <div className='relative group'>
            <Lock className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light group-hover:text-primary-light transition-colors' />
            <input
              id='confirmPassword'
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() => validateConfirmPassword(confirmPassword)}
              className={`w-full pl-12 pr-12 py-4 rounded-xl border-2 ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-200'
              } bg-gray-50 text-text placeholder:text-text-light focus:ring-2 focus:ring-primary-light focus:border-primary-light transition-all duration-300 hover:border-primary-light/50`}
              placeholder='Confirm your new password'
            />
            <button
              type='button'
              onClick={() => setShowPassword(!showPassword)}
              className='absolute right-4 top-1/2 -translate-y-1/2 text-text-light hover:text-primary-light transition-colors'
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className='text-red-500 text-sm mt-1'>{errors.confirmPassword}</p>
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
            Reset Password
          </span>
          {isLoading && (
            <div className='absolute inset-0 flex items-center justify-center'>
              <div className='w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin' />
            </div>
          )}
        </button>
      </form>

      {/* Back to Login Link */}
      <div className='pt-4 text-center'>
        <Link
          href='/login'
          className='text-primary hover:text-primary-light font-medium transition-colors'
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
} 