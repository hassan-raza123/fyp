'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Shield } from 'lucide-react';

interface Admin {
  userId: number;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    status: string;
    phone_number?: string;
  };
  employeeId?: string | null;
  designation: string;
  department: {
    id: number;
    name: string;
    code: string;
  } | null;
}

export default function AdminDetailsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  
  const router = useRouter();
  const params = useParams();
  const adminId = params?.id;
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (adminId) {
      fetchAdmin();
    }
  }, [adminId]);

  const fetchAdmin = async () => {
    try {
      setLoading(true);
      // Fetch from users API
      const response = await fetch(`/api/users/${adminId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch admin');

      const userData = await response.json();
      
      // Format as admin
      setAdmin({
        userId: userData.id,
        user: {
          id: userData.id,
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
          status: userData.status,
          phone_number: userData.phone_number,
        },
        employeeId: userData.faculty?.employeeId || null,
        designation: userData.faculty?.designation || 'Admin',
        department: userData.faculty?.department || null,
      });
    } catch (error) {
      console.error('Error fetching admin:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to fetch admin'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center text-secondary-text">Loading...</div>
      </div>
    );
  }

  if (error || !admin) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <p className="mb-4" style={{ color: 'var(--error)' }}>{error || 'Admin not found'}</p>
          <Button variant="outline" onClick={() => router.push('/admin/admins')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admins
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/admin/admins')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-primary-text">
              <Shield className="h-8 w-8" style={{ color: isDarkMode ? 'var(--orange)' : 'var(--blue)' }} />
              Admin Details
            </h1>
            <p className="text-secondary-text">
              View admin user information
            </p>
          </div>
        </div>
        <Button
          onClick={() => router.push(`/admin/admins/${adminId}/edit`)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Admin
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-secondary-text">
                  First Name
                </p>
                <p className="text-lg text-primary-text">{admin.user.first_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-text">
                  Last Name
                </p>
                <p className="text-lg text-primary-text">{admin.user.last_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-text">
                  Email
                </p>
                <p className="text-lg text-primary-text">{admin.user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-text">
                  Phone Number
                </p>
                <p className="text-lg text-primary-text">{admin.user.phone_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-text">
                  Status
                </p>
                <div className="mt-1">{getStatusBadge(admin.user.status)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Admin Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-secondary-text">
                  Employee ID
                </p>
                <p className="text-lg text-primary-text">{admin.employeeId || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-text">
                  Designation
                </p>
                <p className="text-lg text-primary-text">{admin.designation}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-text">
                  Department
                </p>
                <p className="text-lg text-primary-text">
                  {admin.department
                    ? `${admin.department.name} (${admin.department.code})`
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-text">
                  Role
                </p>
                <Badge variant="default" className="mt-1">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

