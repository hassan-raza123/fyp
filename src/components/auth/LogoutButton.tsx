'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

interface LogoutButtonProps {
  variant?: 'header' | 'menu';
}

export default function LogoutButton({ variant = 'header' }: LogoutButtonProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        window.location.href = '/login';
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  if (variant === 'header') {
    return (
      <button
        onClick={handleLogout}
        className="flex items-center space-x-2 px-2 sm:px-4 py-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 hover:-translate-y-0.5 text-accent transition-all duration-200"
      >
        <LogOut size={18} />
        <span className="text-sm font-medium hidden sm:block">Logout</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
    >
      <LogOut size={16} className="inline-block mr-2" />
      Sign Out
    </button>
  );
} 