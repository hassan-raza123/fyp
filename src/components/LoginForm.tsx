'use client';

import { useState } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  School,
  BookOpen,
  Clock,
  ExternalLink,
} from 'lucide-react';

type UserType = 'student' | 'faculty' | 'admin';

export default function LoginForm() {
  const [error, setError] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userType, setUserType] = useState<UserType>('student');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate a login API call
    setTimeout(() => {
      if (email === 'admin@university.edu' && password === 'admin123') {
        alert('Login successful!');
      } else {
        setError('Invalid email or password. Please try again.');
      }
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className='max-w-md w-full'>
      <div className='text-center mb-10'>
        <div className='bg-gradient-to-br from-primary to-primary-light w-20 h-20 rounded-2xl mx-auto flex items-center justify-center mb-6 transform hover:rotate-12 transition-all duration-300 group shadow-lg shadow-primary-light/20'>
          <School className='w-12 h-12 text-accent group-hover:scale-110 transition-transform' />
        </div>
        <h2 className='text-3xl font-bold text-primary'>Welcome Back!</h2>
        <p className='text-text-light mt-2'>
          {userType === 'admin'
            ? 'Access the admin dashboard'
            : userType === 'faculty'
            ? 'Sign in to your faculty account'
            : 'Sign in to your student account'}
        </p>
      </div>

      {/* User Type Selector */}
      <div className='flex rounded-2xl bg-gray-100 p-1.5 mb-8'>
        {(['Student', 'Faculty', 'Admin'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setUserType(type.toLowerCase() as UserType)}
            className={`flex-1 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
              userType === type.toLowerCase()
                ? 'bg-white text-primary shadow-lg shadow-gray-200'
                : 'text-text-light hover:text-text'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className='space-y-6'>
        <div className='space-y-2'>
          <label
            htmlFor='email'
            className='block text-sm font-semibold text-text'
          >
            {userType === 'admin'
              ? 'Admin Email'
              : userType === 'faculty'
              ? 'Faculty Email'
              : 'University Email'}
          </label>
          <div className='relative group'>
            <Mail className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light group-hover:text-primary-light transition-colors' />
            <input
              id='email'
              type='email'
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              className='w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 bg-gray-50 text-text placeholder:text-text-light focus:ring-2 focus:ring-primary-light focus:border-primary-light transition-all duration-300 hover:border-primary-light/50'
              placeholder={
                userType === 'admin'
                  ? 'admin@university.edu'
                  : userType === 'faculty'
                  ? 'teacher@university.edu'
                  : 'student@university.edu'
              }
              required
            />
          </div>
        </div>

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
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              className='w-full pl-12 pr-12 py-4 rounded-xl border-2 border-gray-200 bg-gray-50 text-text placeholder:text-text-light focus:ring-2 focus:ring-primary-light focus:border-primary-light transition-all duration-300 hover:border-primary-light/50'
              placeholder='Enter your password'
              required
            />
            <button
              type='button'
              onClick={() => setShowPassword(!showPassword)}
              className='absolute right-4 top-1/2 -translate-y-1/2 text-text-light hover:text-primary-light transition-colors'
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {error && (
          <div className='text-red-500 text-sm text-center'>{error}</div>
        )}

        <div className='flex items-center justify-between'>
          <label className='flex items-center cursor-pointer group'>
            <input
              type='checkbox'
              className='w-4 h-4 text-primary-light rounded border-gray-300 focus:ring-primary-light'
            />
            <span className='ml-2 text-text-light group-hover:text-primary transition-colors'>
              Remember me
            </span>
          </label>
          <a
            href='#'
            className='text-primary hover:text-primary-light font-medium transition-colors inline-flex items-center group'
          >
            Reset Password
            <ExternalLink className='w-4 h-4 ml-1 opacity-70 group-hover:opacity-100 transition-opacity' />
          </a>
        </div>

        <button
          type='submit'
          disabled={isLoading}
          className='relative w-full bg-gradient-to-r from-primary to-primary-light text-accent py-4 rounded-xl font-semibold hover:from-primary-light hover:to-primary transform hover:-translate-y-0.5 transition-all duration-300 shadow-lg shadow-primary-light/20'
        >
          <span
            className={`inline-flex items-center justify-center ${
              isLoading ? 'invisible' : ''
            }`}
          >
            {userType === 'admin'
              ? 'Access Admin Dashboard'
              : userType === 'faculty'
              ? 'Sign In as Faculty'
              : 'Sign In to Account'}
          </span>
          {isLoading && (
            <div className='absolute inset-0 flex items-center justify-center'>
              <div className='w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin' />
            </div>
          )}
        </button>

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
