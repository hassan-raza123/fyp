'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { z } from 'zod';
import { getDefaultPassword } from '@/lib/password-utils';

const createFacultySchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().optional(),
  employeeId: z.string().optional(),
  designation: z.string().min(1, 'Designation is required'),
  departmentId: z.string().min(1, 'Department is required'),
  status: z.enum(['active', 'inactive']),
});

export default function CreateFacultyPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentDepartmentId, setCurrentDepartmentId] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    employeeId: '',
    designation: '',
    departmentId: '',
    status: 'active' as 'active' | 'inactive',
  });
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchCurrentDepartment();
  }, []);

  const fetchCurrentDepartment = async () => {
    try {
      // Get settings to find department code
      const settingsResponse = await fetch('/api/settings');
      if (!settingsResponse.ok) {
        throw new Error('Failed to fetch settings');
      }
      const settingsData = await settingsResponse.json();
      if (!settingsData.success || !settingsData.data) {
        throw new Error('Settings not found');
      }

      const systemSettings =
        typeof settingsData.data.system === 'string'
          ? JSON.parse(settingsData.data.system)
          : settingsData.data.system;

      const departmentCode = systemSettings?.departmentCode;
      if (!departmentCode) {
        toast.error('Please configure department in Settings first');
        return;
      }

      // Get department ID by code
      const deptResponse = await fetch(
        `/api/departments/by-code?code=${departmentCode}`
      );
      if (!deptResponse.ok) {
        throw new Error('Department not found');
      }
      const deptData = await deptResponse.json();
      const deptId = deptData.id.toString();

      setCurrentDepartmentId(deptId);
      setFormData((prev) => ({
        ...prev,
        departmentId: deptId,
      }));
    } catch (error) {
      console.error('Error fetching current department:', error);
      toast.error('Failed to load department. Please configure in Settings.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Validate form data
      const result = createFacultySchema.safeParse(formData);
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

      // Create user first
      const userResponse = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone_number: formData.phoneNumber || null,
          password: getDefaultPassword('faculty'), // Role-based default password for faculty
        }),
      });

      const userData = await userResponse.json();
      if (!userResponse.ok) {
        throw new Error(userData.error || 'Failed to create user');
      }

      if (!userData.success || !userData.data) {
        throw new Error('Failed to create user account');
      }

      const userId = userData.data.id;

      // Assign faculty role
      const roleResponse = await fetch(`/api/users/${userId}/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roles: ['faculty'],
          facultyDetails: {
            departmentId: formData.departmentId,
            designation: formData.designation,
            employeeId: formData.employeeId || null,
          },
        }),
      });

      const roleData = await roleResponse.json();
      if (!roleResponse.ok) {
        // If role assignment fails, try to delete the user
        await fetch(`/api/users/${userId}`, { method: 'DELETE' });
        throw new Error(roleData.error || 'Failed to assign faculty role');
      }

      toast.success('Faculty member created successfully');
      toast.info(
        `Login credentials - Email: ${formData.email}, Password: ${getDefaultPassword('faculty')}`
      );
      router.push('/admin/faculty');
    } catch (error) {
      console.error('Error creating faculty:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create faculty'
      );
    } finally {
      setLoading(false);
    }
  };

  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const primaryColorDark = isDarkMode ? 'var(--orange-dark)' : 'var(--blue-dark)';

  if (!mounted) {
    return null;
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
          onClick={() => router.push('/admin/faculty')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-lg font-bold text-primary-text">Add Faculty Member</h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Create a new faculty member account
          </p>
        </div>
      </div>

      <Card className="bg-card border-card-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-primary-text">Faculty Information</CardTitle>
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
                  placeholder="e.g., Assistant Professor"
                  className={`${errors.designation ? 'border-[var(--error)]' : ''} bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary`}
                />
                {errors.designation && (
                  <p className="text-xs" style={{ color: 'var(--error)' }}>{errors.designation}</p>
                )}
              </div>

              {/* Department is automatically set from Settings */}
              {currentDepartmentId && (
                <div className="space-y-2">
                  <Label htmlFor="departmentId" className="text-xs text-primary-text">Department</Label>
                  <Input
                    id="departmentId"
                    value="Current Department (from Settings)"
                    disabled
                    className="bg-card border-card-border text-primary-text"
                    style={{ backgroundColor: 'var(--hover-bg)' }}
                  />
                  <p className="text-xs text-secondary-text">
                    Department is configured in System Settings
                  </p>
                </div>
              )}

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

            <div className="p-4 rounded-lg" style={{ backgroundColor: isDarkMode ? 'rgba(38, 40, 149, 0.15)' : 'rgba(38, 40, 149, 0.1)' }}>
              <p className="text-xs" style={{ color: isDarkMode ? 'var(--orange)' : 'var(--blue)' }}>
                <strong>Note:</strong> A user account will be created
                automatically with default password: <strong>{getDefaultPassword('faculty')}</strong>.
                Faculty member can login and change their password.
              </p>
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
                onClick={() => router.push('/admin/faculty')}
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
                    Creating...
                  </>
                ) : (
                  'Create Faculty'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
