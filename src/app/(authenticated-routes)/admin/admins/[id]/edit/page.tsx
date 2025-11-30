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
import { ArrowLeft, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const updateAdminSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().optional(),
  employeeId: z.string().optional(),
  designation: z.string().min(1, 'Designation is required'),
  status: z.enum(['active', 'inactive']),
});

export default function EditAdminPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const primaryColorDark = isDarkMode ? 'var(--orange-dark)' : 'var(--blue-dark)';
  
  const router = useRouter();
  const params = useParams();
  const adminId = params?.id;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    employeeId: '',
    designation: 'Admin',
    status: 'active' as 'active' | 'inactive',
  });

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
      setFetching(true);
      const response = await fetch(`/api/users/${adminId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch admin');

      const userData = await response.json();
      
      if (userData && !userData.error) {
        setFormData({
          firstName: userData.first_name || '',
          lastName: userData.last_name || '',
          email: userData.email || '',
          phoneNumber: userData.phone_number || '',
          employeeId: userData.faculty?.employeeId || '',
          designation: userData.faculty?.designation || 'Admin',
          status: (userData.status || 'active') as 'active' | 'inactive',
        });
      } else {
        throw new Error('Failed to fetch admin');
      }
    } catch (error) {
      console.error('Error fetching admin:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to load admin'
      );
      router.push('/admin/admins');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Validate form data
      const result = updateAdminSchema.safeParse(formData);
      if (!result.success) {
        const newErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
        throw new Error('Please fix the form errors');
      }

      // First get user with faculty info to get faculty ID
      const userGetResponse = await fetch(`/api/users/${adminId}`, {
        credentials: 'include',
      });
      const userGetData = await userGetResponse.json();
      
      if (!userGetResponse.ok || userGetData.error) {
        throw new Error(userGetData.error || 'Failed to fetch user');
      }

      // Update user
      const userResponse = await fetch(`/api/users/${adminId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone_number: formData.phoneNumber || null,
          status: formData.status,
        }),
      });

      const userData = await userResponse.json();
      if (!userResponse.ok) {
        throw new Error(userData.error || 'Failed to update user');
      }

      // Update faculty/admin details if faculty record exists
      if (userGetData.faculty?.id) {
        const facultyResponse = await fetch(`/api/faculty/${userGetData.faculty.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            employeeId: formData.employeeId || null,
            designation: formData.designation,
            status: formData.status,
          }),
        });

        if (!facultyResponse.ok) {
          const errorData = await facultyResponse.json();
          console.warn('Failed to update faculty details:', errorData);
          // Don't throw error, user update succeeded
        }
      }

      toast.success('Admin updated successfully');
      router.push('/admin/admins');
    } catch (error) {
      console.error('Error updating admin:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update admin'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || fetching) {
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
          onClick={() => router.push('/admin/admins')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2 text-primary-text">
            <Shield className="h-4 w-4" style={{ color: primaryColor }} />
            Edit Admin User
          </h1>
          <p className="text-xs text-secondary-text mt-0.5">Update admin user information</p>
        </div>
      </div>

      <Card className="bg-card border-card-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-primary-text">Admin Information</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-xs text-primary-text">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  className={`${errors.firstName ? 'border-[var(--error)]' : ''} bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary`}
                />
                {errors.firstName && (
                  <p className="text-xs" style={{ color: 'var(--error)' }}>{errors.firstName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-xs text-primary-text">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  className={`${errors.lastName ? 'border-[var(--error)]' : ''} bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary`}
                />
                {errors.lastName && (
                  <p className="text-xs" style={{ color: 'var(--error)' }}>{errors.lastName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs text-primary-text">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className={`${errors.email ? 'border-[var(--error)]' : ''} bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary`}
                />
                {errors.email && (
                  <p className="text-xs" style={{ color: 'var(--error)' }}>{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-xs text-primary-text">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeId" className="text-xs text-primary-text">Employee ID</Label>
                <Input
                  id="employeeId"
                  value={formData.employeeId}
                  onChange={(e) =>
                    setFormData({ ...formData, employeeId: e.target.value })
                  }
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="designation" className="text-xs text-primary-text">Designation *</Label>
                <Input
                  id="designation"
                  value={formData.designation}
                  onChange={(e) =>
                    setFormData({ ...formData, designation: e.target.value })
                  }
                  placeholder="e.g., Department Admin, System Admin"
                  className={`${errors.designation ? 'border-[var(--error)]' : ''} bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary`}
                />
                {errors.designation && (
                  <p className="text-xs" style={{ color: 'var(--error)' }}>{errors.designation}</p>
                )}
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
                onClick={() => router.push('/admin/admins')}
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
                    Updating...
                  </>
                ) : (
                  'Update Admin'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

