'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
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

      window.location.href = data.data.redirectTo;
    } catch (error) {
      setError('Network error. Please check your connection and try again.');
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
          Verify Your Email
        </h2>
        <p className='text-base' style={{ color: 'var(--gray-600)' }}>
          We've sent a 6-digit code to <span className='font-medium'>{email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-5'>
        {/* OTP Input */}
        <div>
          <label
            htmlFor='otp'
            className='block text-sm font-medium text-center mb-3'
            style={{ color: 'var(--brand-primary)' }}
          >
            Enter Verification Code
          </label>
          <div className='flex justify-center gap-3'>
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
                className='w-14 h-14 text-center text-2xl font-bold rounded-lg border-2 transition-all focus:outline-none'
                style={{
                  borderColor: 'var(--gray-300)',
                  color: 'var(--brand-primary)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--brand-secondary)';
                  e.target.style.boxShadow = '0 0 0 3px var(--brand-secondary-opacity-10)';
                  e.target.style.transform = 'scale(1.05)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--gray-300)';
                  e.target.style.boxShadow = 'none';
                  e.target.style.transform = 'scale(1)';
                }}
              />
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div 
            className='px-4 py-3 rounded-lg border text-center text-sm'
            style={{
              background: 'rgba(239, 68, 68, 0.05)',
              borderColor: 'rgba(239, 68, 68, 0.2)',
              color: '#dc2626'
            }}
          >
            <span className='font-medium'>{error}</span>
          </div>
        )}

        {/* Resend & Back */}
        <div className='flex items-center justify-between text-sm'>
          <button
            type='button'
            onClick={handleResendOTP}
            disabled={!canResend || isResending}
            className='font-medium transition-colors'
            style={{ 
              color: canResend ? 'var(--brand-primary)' : 'var(--gray-400)',
              cursor: canResend ? 'pointer' : 'not-allowed'
            }}
          >
            {isResending
              ? '⏳ Sending...'
              : canResend
              ? '🔄 Resend Code'
              : `⏱️ Resend in ${timer}s`}
          </button>
          <Link
            href='/login'
            className='font-medium hover:underline'
            style={{ color: 'var(--brand-primary)' }}
          >
            Back to Login
          </Link>
        </div>

        {/* Submit Button */}
        <button
          type='submit'
          disabled={isLoading}
          className='w-full text-white py-3.5 rounded-lg font-semibold transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm'
          style={{
            background: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)'
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px var(--brand-secondary-opacity-30)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
          }}
        >
          {isLoading ? (
            <span className='flex items-center justify-center'>
              <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2' />
              Verifying...
            </span>
          ) : (
            'Verify & Continue'
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
