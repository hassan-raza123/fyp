'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail } from 'lucide-react';
import Link from 'next/link';

function OTPVerificationFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const userType = searchParams.get('userType');

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email || !userType) {
      router.push('/login');
      return;
    }

    // Auto focus the first input field
    inputRefs.current[0]?.focus();

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [email, userType, router]);

  const handleInputChange = (index: number, value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue.length > 1) {
      value = numericValue.slice(0, 1);
    } else {
      value = numericValue;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Move to next input if current input is filled
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input on backspace if current input is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const newOtp = [...otp];

    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }

    setOtp(newOtp);
    setError('');
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    try {
      setIsResending(true);
      setError('');
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userType }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message || 'Failed to resend OTP');
        return;
      }

      setTimer(60);
      setCanResend(false);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate OTP length
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email,
          userType,
          otp: otpString,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message || 'Invalid OTP. Please try again.');
        return;
      }

      // Redirect to the dashboard based on the server response
      window.location.href = data.data.redirectTo;
    } catch (error) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='max-w-md w-full mx-auto p-6'>
      <div className='text-center mb-8'>
        <div className='bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 w-20 h-20 rounded-2xl mx-auto flex items-center justify-center mb-6 transform hover:rotate-12 transition-all duration-300 group shadow-lg shadow-primary-light/20'>
          <Mail className='w-12 h-12 text-white group-hover:scale-110 transition-transform' />
        </div>
        <h2 className='text-3xl font-bold text-primary'>Verify Your Email</h2>
        <p className='text-text-light mt-2'>
          We've sent a verification code to {email}
        </p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-6'>
        <div className='space-y-2'>
          <label
            htmlFor='otp'
            className='block text-sm font-semibold text-primary'
          >
            Enter Verification Code
          </label>
          <div className='flex justify-center space-x-2'>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type='text'
                inputMode='numeric'
                pattern='[0-9]*'
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className='w-12 h-12 text-center text-xl font-semibold rounded-xl border-2 border-gray-200 bg-white text-primary focus:ring-2 focus:ring-primary-light focus:border-primary-light transition-all duration-300 hover:border-primary-light/50'
              />
            ))}
          </div>
        </div>

        {error && (
          <div className='text-red-500 text-sm text-center'>{error}</div>
        )}

        <div className='flex items-center justify-between'>
          <button
            type='button'
            onClick={handleResendOTP}
            disabled={!canResend || isResending}
            className={`text-sm ${
              canResend
                ? 'text-primary hover:text-primary-light'
                : 'text-gray-400'
            }`}
          >
            {isResending
              ? 'Sending...'
              : canResend
              ? 'Resend Code'
              : `Resend in ${timer}s`}
          </button>
          <Link
            href='/login'
            className='text-sm text-primary hover:text-primary-light'
          >
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
            Verify
          </span>
          {isLoading && (
            <div className='absolute inset-0 flex items-center justify-center'>
              <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
            </div>
          )}
        </button>
      </form>
    </div>
  );
}

export default function OTPVerificationForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OTPVerificationFormContent />
    </Suspense>
  );
}
