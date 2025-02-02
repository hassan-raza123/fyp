'use client';

import React from 'react';
import { School, ExternalLink } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showSupport?: boolean;
}

export default function AuthLayout({
  children,
  title,
  subtitle,
  showSupport = true,
}: AuthLayoutProps) {
  return (
    <div className='max-w-md w-full'>
      {/* Header */}
      <div className='text-center mb-10'>
        <div className='bg-gradient-to-br from-primary to-primary-light w-20 h-20 rounded-2xl mx-auto flex items-center justify-center mb-6 transform hover:rotate-12 transition-all duration-300 group shadow-lg shadow-primary-light/20'>
          <School className='w-12 h-12 text-accent group-hover:scale-110 transition-transform' />
        </div>
        <h2 className='text-3xl font-bold text-primary'>{title}</h2>
        {subtitle && <p className='text-text-light mt-2'>{subtitle}</p>}
      </div>

      {/* Main Content */}
      {children}

      {/* Footer */}
      {showSupport && (
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
      )}
    </div>
  );
}

// components/auth/FormInput.tsx
interface FormInputProps {
  id: string;
  name: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  label: string;
  placeholder?: string;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function FormInput({
  id,
  name,
  type,
  value,
  onChange,
  onBlur,
  label,
  placeholder,
  error,
  icon,
  rightIcon,
}: FormInputProps) {
  return (
    <div className='space-y-2'>
      <label htmlFor={id} className='block text-sm font-semibold text-text'>
        {label}
      </label>
      <div className='relative group'>
        {icon && (
          <div className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light group-hover:text-primary-light transition-colors'>
            {icon}
          </div>
        )}
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={`w-full ${icon ? 'pl-12' : 'pl-4'} ${
            rightIcon ? 'pr-12' : 'pr-4'
          } py-4 rounded-xl border-2 ${
            error ? 'border-red-500' : 'border-gray-200'
          } bg-gray-50 text-text placeholder:text-text-light focus:ring-2 focus:ring-primary-light focus:border-primary-light transition-all duration-300 hover:border-primary-light/50`}
          placeholder={placeholder}
        />
        {rightIcon && (
          <div className='absolute right-4 top-1/2 -translate-y-1/2'>
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className='text-red-500 text-sm mt-1'>{error}</p>}
    </div>
  );
}
