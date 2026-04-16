'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface PageLoadingProps {
  message?: string;
  fullScreen?: boolean;
}

export function PageLoading({
  message = 'Loading...',
  fullScreen = true,
}: PageLoadingProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const color =
    mounted && resolvedTheme === 'dark' ? 'var(--orange)' : 'var(--blue)';

  return (
    <div
      className={`flex items-center justify-center ${
        fullScreen ? 'min-h-screen' : 'min-h-[50vh]'
      } bg-page`}
    >
      <div className="flex flex-col items-center space-y-3">
        <div
          className="w-10 h-10 border-2 rounded-full animate-spin"
          style={{
            borderColor: color,
            borderTopColor: 'transparent',
          }}
        />
        <p className="text-xs text-secondary-text">{message}</p>
      </div>
    </div>
  );
}
