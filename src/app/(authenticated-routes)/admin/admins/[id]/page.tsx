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

  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const primaryColorDark = isDarkMode ? 'var(--orange-dark)' : 'var(--blue-dark)';

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-3">
          <div 
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: primaryColor }}
          />
          <p className="text-xs text-secondary-text">Loading admin details...</p>
        </div>
      </div>
    );
  }

  if (error || !admin) {
    return (
      <div className="space-y-4">
        <div className="text-center py-12">
          <p className="mb-4 text-sm" style={{ color: 'var(--error)' }}>{error || 'Admin not found'}</p>
          <Button 
            variant="outline" 
            size="sm"
            className="h-8 text-xs border-card-border bg-transparent"
            style={{
              color: isDarkMode ? '#ffffff' : '#111827',
              borderColor: isDarkMode ? '#404040' : '#e5e7eb',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';
              e.currentTarget.style.borderColor = primaryColor;
              e.currentTarget.style.color = primaryColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = isDarkMode ? '#404040' : '#e5e7eb';
              e.currentTarget.style.color = isDarkMode ? '#ffffff' : '#111827';
            }}
            onClick={() => router.push('/admin/admins')}
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 border-card-border bg-transparent"
            style={{
              color: isDarkMode ? '#ffffff' : '#111827',
              borderColor: isDarkMode ? '#404040' : '#e5e7eb',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';
              e.currentTarget.style.color = primaryColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = isDarkMode ? '#ffffff' : '#111827';
            }}
            onClick={() => router.push('/admin/admins')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2 text-primary-text">
              <Shield className="h-4 w-4" style={{ color: primaryColor }} />
              Admin Details
            </h1>
            <p className="text-xs text-secondary-text mt-0.5">
              View admin user information
            </p>
          </div>
        </div>
        <Button
          size="sm"
          className="h-8 text-xs text-white"
          style={{
            backgroundColor: primaryColor,
            color: 'white',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = primaryColorDark;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = primaryColor;
          }}
          onClick={() => router.push(`/admin/admins/${adminId}/edit`)}
        >
          <Edit className="h-3.5 w-3.5 mr-1.5" />
          Edit Admin
        </Button>
      </div>

      <div className="grid gap-4">
        <Card className="bg-card border-card-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-primary-text">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-secondary-text mb-1">
                  First Name
                </p>
                <p className="text-sm text-primary-text">{admin.user.first_name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-secondary-text mb-1">
                  Last Name
                </p>
                <p className="text-sm text-primary-text">{admin.user.last_name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-secondary-text mb-1">
                  Email
                </p>
                <p className="text-sm text-primary-text">{admin.user.email}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-secondary-text mb-1">
                  Phone Number
                </p>
                <p className="text-sm text-primary-text">{admin.user.phone_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-secondary-text mb-1">
                  Status
                </p>
                <div className="mt-1">{getStatusBadge(admin.user.status)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-card-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-primary-text">Admin Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-secondary-text mb-1">
                  Employee ID
                </p>
                <p className="text-sm text-primary-text">{admin.employeeId || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-secondary-text mb-1">
                  Designation
                </p>
                <p className="text-sm text-primary-text">{admin.designation}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-secondary-text mb-1">
                  Department
                </p>
                <p className="text-sm text-primary-text">
                  {admin.department
                    ? `${admin.department.name} (${admin.department.code})`
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-secondary-text mb-1">
                  Role
                </p>
                <Badge variant="default" className="mt-1 text-[10px] px-1.5 py-0.5">
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

