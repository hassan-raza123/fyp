import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface User {
  id: number;
  email: string;
  role: string;
  userData: {
    firstName: string;
    lastName: string;
    departmentId?: number;
    programId?: number;
    rollNumber?: string;
    designation?: string;
  };
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await fetch('/api/auth/verify', {
          method: 'GET',
          credentials: 'include', // This ensures cookies are sent with the request
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('Failed to verify authentication');
        }

        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        console.error('Error verifying auth:', error);
        toast.error('Authentication failed');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, [router]);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    role: user?.role || null,
  };
}
