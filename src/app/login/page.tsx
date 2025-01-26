'use client';

import { useState } from 'react';
import { Eye, EyeOff, UserCircle, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className='min-h-screen bg-[#f8fafc] flex items-center justify-center p-4'>
      <div className='relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 overflow-hidden'>
        <div className='absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-blue-600' />
        <div className='absolute -left-4 -top-4 w-24 h-24 bg-blue-100 rounded-full opacity-50 blur-2xl' />
        <div className='absolute -right-4 -bottom-4 w-24 h-24 bg-blue-200 rounded-full opacity-50 blur-2xl' />

        <div className='text-center mb-8 relative'>
          <div className='bg-gradient-to-r from-blue-500 to-blue-700 w-20 h-20 rounded-2xl mx-auto flex items-center justify-center mb-4 transform rotate-12 hover:rotate-0 transition-all duration-300 shadow-lg'>
            <UserCircle className='w-12 h-12 text-white' />
          </div>
          <h1 className='text-3xl font-bold text-gray-900'>Welcome Back</h1>
          <p className='text-gray-700 mt-2 text-base'>
            Sign in to manage attendance
          </p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-6'>
          <div className='space-y-1'>
            <label
              htmlFor='email'
              className='block text-sm font-semibold text-gray-900'
            >
              Email Address
            </label>
            <div className='relative group'>
              <Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-hover:text-blue-500 transition-colors' />
              <input
                id='email'
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className='w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-200 text-gray-900 text-base placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-blue-300'
                placeholder='youremail@university.edu'
                required
              />
            </div>
          </div>

          <div className='space-y-1'>
            <label
              htmlFor='password'
              className='block text-sm font-semibold text-gray-900'
            >
              Password
            </label>
            <div className='relative group'>
              <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-hover:text-blue-500 transition-colors' />
              <input
                id='password'
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='w-full pl-12 pr-12 py-3.5 rounded-xl border-2 border-gray-200 text-gray-900 text-base placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-blue-300'
                placeholder='Enter your password'
                required
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 transition-colors'
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className='flex items-center justify-between text-sm'>
            <label className='flex items-center group cursor-pointer'>
              <input
                type='checkbox'
                className='w-4 h-4 text-blue-600 rounded-md border-gray-300 focus:ring-blue-500 transition-colors'
              />
              <span className='ml-2 text-gray-700 group-hover:text-blue-600 transition-colors font-medium'>
                Remember me
              </span>
            </label>
            <a
              href='#'
              className='text-blue-600 hover:text-blue-800 font-semibold transition-colors hover:underline'
            >
              Forgot password?
            </a>
          </div>

          <button
            type='submit'
            disabled={isLoading}
            className='relative w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 text-base'
          >
            <span
              className={`inline-flex items-center ${
                isLoading ? 'invisible' : ''
              }`}
            >
              <Lock className='w-5 h-5 mr-2' />
              Sign In
            </span>
            {isLoading && (
              <div className='absolute inset-0 flex items-center justify-center'>
                <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
              </div>
            )}
          </button>
        </form>

        <p className='text-center text-gray-700 mt-8 text-base'>
          Don't have an account?{' '}
          <a
            href='#'
            className='text-blue-600 hover:text-blue-800 font-semibold transition-colors hover:underline'
          >
            Contact Admin
          </a>
        </p>
      </div>
    </div>
  );
}
