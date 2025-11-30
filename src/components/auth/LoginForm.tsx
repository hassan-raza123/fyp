'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import {
  BaseUserType,
  LoginResponse,
  ValidationErrors,
  AdminRole,
} from '@/types/login';
import Link from 'next/link';

interface FormData {
  email: string;
  password: string;
  userType: BaseUserType | AdminRole;
  rememberMe: boolean;
}

export default function LoginForm() {
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    userType: 'student',
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [serverError, setServerError] = useState('');

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

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setErrors((prev) => ({ ...prev, password: 'Password is required' }));
      return false;
    }
    if (password.length < 6) {
      setErrors((prev) => ({
        ...prev,
        password: 'Password must be at least 6 characters',
      }));
      return false;
    }
    setErrors((prev) => ({ ...prev, password: '' }));
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setServerError('');
  };

  const handleUserTypeChange = (type: BaseUserType) => {
    setFormData((prev) => ({
      ...prev,
      userType: type,
    }));
    setErrors({});
    setServerError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setServerError('');

    try {
      // Validate form data
      if (!formData.email || !formData.password) {
        setErrors((prev) => ({
          ...prev,
          email: 'Email is required',
          password: 'Password is required',
        }));
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          userType: formData.userType,
        }),
      });

      const data: LoginResponse = await response.json();

      if (!response.ok || !data.success) {
        setServerError(data.message || 'Login failed');
        setIsLoading(false);
        return;
      }

      // Success response yahan par guaranteed hai (data.success === true)

      // If user is verified and should be redirected directly
      if ((data as any).data?.shouldRedirect) {
        // Store user preferences in localStorage if remember me is checked
        if (formData.rememberMe) {
          localStorage.setItem('userEmail', formData.email);
          localStorage.setItem('userType', formData.userType);
        }

        // Redirect to dashboard
        window.location.href = (data as any).data.redirectTo;
        return;
      }

      // For OTP verification required
      // Backend ho sakta hai effective role (admin / super_admin) return kare
      // isliye yahan se wahi userType bhejte hain jo server ne diya hai
      const otpUserType =
        ((data as any).data && (data as any).data.userType) ||
        formData.userType;

      window.location.href = `/verify-otp?email=${encodeURIComponent(
        formData.email
      )}&userType=${encodeURIComponent(otpUserType)}`;
    } catch (error) {
      setServerError('An error occurred during login');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserTypeDisplay = (type: BaseUserType | AdminRole): string => {
    switch (type) {
      case 'admin':
        return 'Admin';
      case 'faculty':
        return 'Faculty';
      case 'student':
        return 'Student';
      default:
        return String(type).charAt(0).toUpperCase() + String(type).slice(1);
    }
  };

  const getEmailPlaceholder = (type: BaseUserType | AdminRole): string => {
    switch (type) {
      case 'admin':
        return 'admin@university.edu';
      case 'faculty':
        return 'faculty@university.edu';
      case 'student':
        return 'student@university.edu';
      default:
        return 'Enter your email address';
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
          Sign in to EduTrack
        </h2>
      </div>

      {/* User Type Selector */}
      <div className='flex gap-2 mb-6'>
        {(['student', 'faculty', 'admin'] as const).map((type) => (
          <button
            key={type}
            type='button'
            onClick={() => handleUserTypeChange(type)}
            className='flex-1 py-3 text-sm font-medium rounded-lg transition-all'
            style={
              formData.userType === type
                ? {
                    background: 'var(--brand-primary)',
                    color: 'var(--white)'
                  }
                : {
                    background: 'var(--gray-100)',
                    color: 'var(--gray-700)'
                  }
            }
            onMouseEnter={(e) => {
              if (formData.userType !== type) {
                e.currentTarget.style.background = 'var(--gray-200)';
              }
            }}
            onMouseLeave={(e) => {
              if (formData.userType !== type) {
                e.currentTarget.style.background = 'var(--gray-100)';
              }
            }}
          >
            {getUserTypeDisplay(type)}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className='space-y-5'>
        {/* Email Field */}
        <div>
            <label
              htmlFor='email'
              className='block text-sm font-medium mb-2 text-gray-700'
            >
              Email
            </label>
          <input
            id='email'
            name='email'
            type='email'
            value={formData.email}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 rounded-lg border transition-all focus:outline-none bg-white text-gray-900 ${
              errors.email 
                ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                : 'border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
            }`}
            onBlur={() => validateEmail(formData.email)}
            placeholder={getEmailPlaceholder(formData.userType)}
          />
          {errors.email && (
            <p className='text-red-500 text-sm mt-1'>{errors.email}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <div className='flex justify-between items-center mb-2'>
            <label
              htmlFor='password'
              className='block text-sm font-medium text-gray-700'
            >
              Password
            </label>
            <Link
              href='/forgot-password'
              className='text-sm font-medium hover:underline text-blue-600'
            >
              Forgot password
            </Link>
          </div>
          <div className='relative'>
            <input
              id='password'
              name='password'
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 pr-12 rounded-lg border transition-all focus:outline-none bg-white text-gray-900 ${
                errors.password 
                  ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                  : 'border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
              }`}
              onBlur={() => validatePassword(formData.password)}
              placeholder='Enter your password'
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
            <p className='text-red-500 text-sm mt-1'>{errors.password}</p>
          )}
        </div>

        {/* Server Error */}
        {serverError && (
          <div className='bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm'>
            {serverError}
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
            e.currentTarget.style.background = 'var(--brand-primary)';
          }}
        >
          {isLoading ? (
            <span className='flex items-center justify-center'>
              <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2' />
              Signing in...
            </span>
          ) : (
            'Sign in'
          )}
        </button>

        {/* Support Info */}
        <p className='text-center text-sm mt-4' style={{ color: 'var(--gray-500)' }}>
          Need help? Contact{' '}
          <a
            href='mailto:itzhassanraza276@gmail.com'
            className='font-medium hover:underline'
            style={{ color: 'var(--brand-primary)' }}
          >
            IT Support
          </a>
        </p>
      </form>
    </div>
  );
}
