'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit } from 'lucide-react';
import Link from 'next/link';

interface Faculty {
  id: number;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    status: string;
  };
  employeeId?: string;
  designation: string;
  status: string;
  department: {
    id: number;
    name: string;
    code: string;
  };
}

export default function FacultyDetailsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  
  const router = useRouter();
  const params = useParams();
  const facultyId = params?.id;
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (facultyId) {
      fetchFaculty();
    }
  }, [facultyId]);

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/faculty/${facultyId}`);
      if (!response.ok) throw new Error('Failed to fetch faculty');

      const data = await response.json();
      if (data.success && data.data) {
        setFaculty(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch faculty');
      }
    } catch (error) {
      console.error('Error fetching faculty:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to fetch faculty'
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
          <p className="text-xs text-secondary-text">Loading faculty details...</p>
        </div>
      </div>
    );
  }

  if (error || !faculty) {
    return (
      <div className="space-y-4">
        <div className="text-center py-12">
          <p className="mb-4 text-sm" style={{ color: 'var(--error)' }}>{error || 'Faculty not found'}</p>
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
            onClick={() => router.push('/admin/faculty')}
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Back to Faculty
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
            onClick={() => router.push('/admin/faculty')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-primary-text">
              {faculty.user.first_name} {faculty.user.last_name}
            </h1>
            <p className="text-xs text-secondary-text mt-0.5">Faculty Details</p>
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
          onClick={() => router.push(`/admin/faculty/${facultyId}/edit`)}
        >
          <Edit className="mr-1.5 h-3.5 w-3.5" />
          Edit Faculty
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card border-card-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-primary-text">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div>
              <p className="text-xs font-medium text-secondary-text mb-1">Employee ID</p>
              <p className="text-sm text-primary-text">{faculty.employeeId || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-secondary-text mb-1">Name</p>
              <p className="text-sm text-primary-text">
                {faculty.user.first_name} {faculty.user.last_name}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-secondary-text mb-1">Email</p>
              <p className="text-sm text-primary-text">{faculty.user.email}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-secondary-text mb-1">Designation</p>
              <p className="text-sm text-primary-text">{faculty.designation || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-card-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-primary-text">Department Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div>
              <p className="text-xs font-medium text-secondary-text mb-1">Department</p>
              <p className="text-sm text-primary-text">
                {faculty.department.name} ({faculty.department.code})
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-secondary-text mb-1">Status</p>
              <div className="mt-1">{getStatusBadge(faculty.user.status)}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

