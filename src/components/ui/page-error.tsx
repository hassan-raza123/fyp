'use client';

import { AlertCircle } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface PageErrorProps {
  message?: string;
  onRetry?: () => void;
  fullScreen?: boolean;
}

export function PageError({
  message = 'Something went wrong. Please try again.',
  onRetry,
  fullScreen = true,
}: PageErrorProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const primaryColor =
    mounted && resolvedTheme === 'dark' ? 'var(--orange)' : 'var(--blue)';
  const primaryColorDark =
    mounted && resolvedTheme === 'dark'
      ? 'var(--orange-dark)'
      : 'var(--blue-dark)';

  return (
    <div
      className={`flex items-center justify-center ${
        fullScreen ? 'min-h-screen' : 'min-h-[50vh]'
      } bg-page`}
    >
      <div className="text-center">
        <AlertCircle
          className="w-16 h-16 mx-auto mb-4"
          style={{ color: 'var(--error)' }}
        />
        <div
          className="text-sm font-semibold mb-2"
          style={{ color: 'var(--error)' }}
        >
          Error
        </div>
        <div className="text-xs text-secondary-text mb-4">{message}</div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8"
            style={{ backgroundColor: primaryColor, color: 'white' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = primaryColorDark;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = primaryColor;
            }}
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
