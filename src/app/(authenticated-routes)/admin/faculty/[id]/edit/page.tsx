'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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

interface Department {
  id: number;
  name: string;
  code: string;
}

export default function EditFacultyPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const primaryColorDark = isDarkMode ? 'var(--orange-dark)' : 'var(--blue-dark)';
  
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [formData, setFormData] = useState({
    designation: '',
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (params.id) {
      fetchFaculty();
    }
  }, [params.id]);

  const fetchFaculty = async () => {
    try {
      setInitialLoading(true);
      const response = await fetch(`/api/faculty/${params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch faculty');
      }
      const data = await response.json();
      if (data.success && data.data) {
        setFaculty(data.data);
        setFormData({
          designation: data.data.designation || '',
          status: data.data.status || 'active',
        });
      } else {
        throw new Error(data.error || 'Failed to fetch faculty');
      }
    } catch (error) {
      console.error('Error fetching faculty:', error);
      toast.error('Failed to fetch faculty details');
      router.push('/admin/faculty');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/faculty/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update faculty');
      }

      toast.success('Faculty member updated successfully');
      router.push(`/admin/faculty/${params.id}`);
    } catch (error) {
      console.error('Error updating faculty:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update faculty'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || initialLoading) {
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

  if (!faculty) {
    return (
      <div className="space-y-4">
        <div className="text-center py-12">
          <p className="text-sm text-secondary-text mb-4">Faculty not found</p>
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
            onClick={() => router.push('/admin/faculty')}
          >
            Back to Faculty
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
          onClick={() => router.push(`/admin/faculty/${params.id}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-lg font-bold text-primary-text">Edit Faculty Member</h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Update faculty member information
          </p>
        </div>
      </div>

      <Card className="bg-card border-card-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-primary-text">
            {faculty.user.first_name} {faculty.user.last_name}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs text-primary-text">Name</Label>
                <Input
                  value={`${faculty.user.first_name} ${faculty.user.last_name}`}
                  disabled
                  className="bg-card border-card-border text-primary-text"
                  style={{ backgroundColor: 'var(--hover-bg)' }}
                />
                <p className="text-xs text-secondary-text">
                  Name cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-primary-text">Email</Label>
                <Input
                  value={faculty.user.email}
                  disabled
                  className="bg-card border-card-border text-primary-text"
                  style={{ backgroundColor: 'var(--hover-bg)' }}
                />
                <p className="text-xs text-secondary-text">
                  Email cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="designation" className="text-xs text-primary-text">Designation *</Label>
                <Input
                  id="designation"
                  value={formData.designation}
                  onChange={(e) =>
                    setFormData({ ...formData, designation: e.target.value })
                  }
                  placeholder="e.g., Assistant Professor"
                  required
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-primary-text">Department</Label>
                <Input
                  value={`${faculty.department.name} (${faculty.department.code})`}
                  disabled
                  className="bg-card border-card-border text-primary-text"
                  style={{ backgroundColor: 'var(--hover-bg)' }}
                />
                <p className="text-xs text-secondary-text">
                  Department cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-xs text-primary-text">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'active' | 'inactive') =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger className="bg-card border-card-border text-primary-text">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-card-border">
                    <SelectItem value="active" className="text-primary-text hover:bg-card/50">Active</SelectItem>
                    <SelectItem value="inactive" className="text-primary-text hover:bg-card/50">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs border-card-border bg-transparent"
                style={{
                  color: isDarkMode ? '#ffffff' : '#111827',
                  borderColor: isDarkMode ? '#404040' : '#e5e7eb',
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
                onClick={() => router.push(`/admin/faculty/${params.id}`)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                size="sm"
                className="h-8 text-xs text-white"
                style={{
                  backgroundColor: loading ? (isDarkMode ? '#9a3412' : '#1e40af') : primaryColor,
                  color: 'white',
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = primaryColorDark;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = primaryColor;
                  }
                }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
