'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, School, ExternalLink } from 'lucide-react';

// Refined type definitions
type BaseUserType = 'student' | 'teacher' | 'admin';
type AdminRole = 'super_admin' | 'department_admin' | 'child_admin';
type AllRoles = BaseUserType | AdminRole;

// Student specific data
interface StudentData {
  rollNumber: string;
  departmentId: string;
  programId: string;
  batch: string;
}

// Teacher specific data
interface TeacherData {
  employeeId: string;
  departmentId: string;
  designation: string;
}

// Base user data
interface BaseUserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: AllRoles;
}

// Combined user data type
type UserData = BaseUserData & Partial<StudentData & TeacherData>;

// API response types
interface LoginSuccess {
  success: true;
  message: string;
  data: {
    user: UserData;
    redirectTo: string;
    token: string;
    userType: AllRoles;
  };
}

interface LoginError {
  success: false;
  message: string;
  errors?: Array<{ field: string; message: string }>;
}

type LoginResponse = LoginSuccess | LoginError;

type ValidationErrors = { [key: string]: string };

export default function LoginForm() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userType: 'student' as BaseUserType,
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
    setFormData((prev) => ({ ...prev, userType: type }));
    setErrors({});
    setServerError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setServerError('');

    const isEmailValid = validateEmail(formData.email);
    const isPasswordValid = validatePassword(formData.password);

    if (!isEmailValid || !isPasswordValid) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          userType: formData.userType,
        }),
      });

      const data: LoginResponse = await response.json();

      if (!data.success) {
        if (data.errors) {
          const newErrors: ValidationErrors = {};
          data.errors.forEach((error) => {
            newErrors[error.field] = error.message;
          });
          setErrors(newErrors);
        } else {
          setServerError(data.message || 'Login failed. Please try again.');
        }
        setIsLoading(false);
        return;
      }

      // Handle successful login
      if (formData.rememberMe) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        localStorage.setItem('userType', data.data.userType);
      }

      // Store session info
      sessionStorage.setItem('lastLoginTime', new Date().toISOString());
      sessionStorage.setItem('currentUserRole', data.data.userType);

      // Redirect to the appropriate dashboard using the redirectTo path
      if (data.data.redirectTo) {
        router.push(data.data.redirectTo);
      } else {
        setServerError('Redirect path not provided.');
      }
    } catch (error) {
      setServerError(
        'Network error. Please check your connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getUserTypeDisplay = (type: BaseUserType): string => {
    switch (type) {
      case 'admin':
        return 'Administrator';
      case 'teacher':
        return 'Faculty';
      case 'student':
        return 'Student';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const getEmailPlaceholder = (type: BaseUserType): string => {
    switch (type) {
      case 'admin':
        return 'admin@university.edu';
      case 'teacher':
        return 'faculty@university.edu';
      case 'student':
        return 'student@university.edu';
      default:
        return 'Enter your email address';
    }
  };

  return (
    <div className='max-w-md w-full'>
      {/* Header */}
      <div className='text-center mb-10'>
        <div className='bg-gradient-to-br from-primary to-primary-light w-20 h-20 rounded-2xl mx-auto flex items-center justify-center mb-6 transform hover:rotate-12 transition-all duration-300 group shadow-lg shadow-primary-light/20'>
          <School className='w-12 h-12 text-accent group-hover:scale-110 transition-transform' />
        </div>
        <h2 className='text-3xl font-bold text-primary'>Welcome Back!</h2>
        <p className='text-text-light mt-2'>
          {formData.userType === 'admin'
            ? 'Access your administrative dashboard'
            : `Sign in to your ${formData.userType} account`}
        </p>
      </div>

      {/* User Type Selector */}
      <div className='flex rounded-2xl bg-gray-100 p-1.5 mb-8'>
        {(['student', 'teacher', 'admin'] as const).map((type) => (
          <button
            key={type}
            type='button'
            onClick={() => handleUserTypeChange(type)}
            className={`flex-1 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
              formData.userType === type
                ? 'bg-white text-primary shadow-lg shadow-gray-200'
                : 'text-text-light hover:text-text'
            }`}
          >
            {getUserTypeDisplay(type)}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Email Field */}
        <div className='space-y-2'>
          <label
            htmlFor='email'
            className='block text-sm font-semibold text-text'
          >
            {getUserTypeDisplay(formData.userType)} Email
          </label>
          <div className='relative group'>
            <Mail className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light group-hover:text-primary-light transition-colors' />
            <input
              id='email'
              name='email'
              type='email'
              value={formData.email}
              onChange={handleInputChange}
              onBlur={() => validateEmail(formData.email)}
              className={`w-full pl-12 pr-4 py-4 rounded-xl border-2 ${
                errors.email ? 'border-red-500' : 'border-gray-200'
              } bg-gray-50 text-text placeholder:text-text-light focus:ring-2 focus:ring-primary-light focus:border-primary-light transition-all duration-300 hover:border-primary-light/50`}
              placeholder={getEmailPlaceholder(formData.userType)}
            />
          </div>
          {errors.email && (
            <p className='text-red-500 text-sm mt-1'>{errors.email}</p>
          )}
        </div>

        {/* Password Field */}
        <div className='space-y-2'>
          <label
            htmlFor='password'
            className='block text-sm font-semibold text-text'
          >
            Password
          </label>
          <div className='relative group'>
            <Lock className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light group-hover:text-primary-light transition-colors' />
            <input
              id='password'
              name='password'
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange}
              onBlur={() => validatePassword(formData.password)}
              className={`w-full pl-12 pr-12 py-4 rounded-xl border-2 ${
                errors.password ? 'border-red-500' : 'border-gray-200'
              } bg-gray-50 text-text placeholder:text-text-light focus:ring-2 focus:ring-primary-light focus:border-primary-light transition-all duration-300 hover:border-primary-light/50`}
              placeholder='Enter your password'
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

        {/* Server Error Message */}
        {serverError && (
          <div className='bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg'>
            {serverError}
          </div>
        )}

        {/* Remember Me & Forgot Password */}
        <div className='flex items-center justify-between'>
          <label className='flex items-center cursor-pointer group'>
            <input
              type='checkbox'
              name='rememberMe'
              checked={formData.rememberMe}
              onChange={handleInputChange}
              className='w-4 h-4 text-primary-light rounded border-gray-300 focus:ring-primary-light'
            />
            <span className='ml-2 text-text-light group-hover:text-primary transition-colors'>
              Remember me
            </span>
          </label>
          <a
            href='/auth/reset-password'
            className='text-primary hover:text-primary-light font-medium transition-colors inline-flex items-center group'
          >
            Reset Password
            <ExternalLink className='w-4 h-4 ml-1 opacity-70 group-hover:opacity-100 transition-opacity' />
          </a>
        </div>

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
            {formData.userType === 'admin'
              ? 'Access Administrative Dashboard'
              : `Sign In as ${getUserTypeDisplay(formData.userType)}`}
          </span>
          {isLoading && (
            <div className='absolute inset-0 flex items-center justify-center'>
              <div className='w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin' />
            </div>
          )}
        </button>

        {/* Footer */}
        <div className='bg-gray-50 rounded-xl p-4 mt-6'>
          <p className='text-center text-text-light text-sm'>
            Need assistance? Contact{' '}
            <a
              href='mailto:support@university.edu'
              className='text-primary hover:text-primary-light font-medium transition-colors inline-flex items-center group'
            >
              IT Support
              <ExternalLink className='w-3 h-3 ml-0.5 opacity-70 group-hover:opacity-100 transition-opacity' />
            </a>
          </p>
          <p className='text-center text-text-light text-xs mt-2'>
            Your data is securely encrypted.
          </p>
        </div>
      </form>
    </div>
  );
}
