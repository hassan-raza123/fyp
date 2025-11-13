'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

const createAdminSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().optional(),
  employeeId: z.string().optional(),
  designation: z.string().min(1, 'Designation is required'),
  departmentId: z.string().min(1, 'Department is required'),
  status: z.enum(['active', 'inactive']),
});

export default function CreateAdminPage() {
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
    designation: 'Admin',
    departmentId: '',
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    fetchCurrentDepartment();
  }, []);

  const fetchCurrentDepartment = async () => {
    try {
      // Get current admin's department
      const checkResponse = await fetch('/api/admin/check-department', {
        credentials: 'include',
      });
      
      if (!checkResponse.ok) {
        throw new Error('Failed to fetch department');
      }
      
      const checkData = await checkResponse.json();
      if (!checkData.success) {
        throw new Error(checkData.error || 'Failed to fetch department');
      }

      if (!checkData.hasDepartment || !checkData.department) {
        toast.error('Please select your department first in the dashboard');
        router.push('/admin');
        return;
      }

      const deptId = checkData.department.id.toString();
      setCurrentDepartmentId(deptId);
      setFormData((prev) => ({
        ...prev,
        departmentId: deptId,
      }));
    } catch (error) {
      console.error('Error fetching current department:', error);
      toast.error('Failed to load department. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Validate form data
      const result = createAdminSchema.safeParse(formData);
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
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone_number: formData.phoneNumber || null,
          password: '11223344', // Default password
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

      // Assign admin role
      const roleResponse = await fetch(`/api/users/${userId}/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          roles: ['admin'],
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
        await fetch(`/api/users/${userId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        throw new Error(roleData.error || 'Failed to assign admin role');
      }

      toast.success('Admin user created successfully');
      toast.info(
        `Login credentials - Email: ${formData.email}, Password: 11223344`
      );
      router.push('/admin/admins');
    } catch (error) {
      console.error('Error creating admin:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create admin'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/admin/admins')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Add Admin User
          </h1>
          <p className="text-muted-foreground">
            Create a new admin user account
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  className={errors.firstName ? 'border-red-500' : ''}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-500">{errors.firstName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  className={errors.lastName ? 'border-red-500' : ''}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-500">{errors.lastName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input
                  id="employeeId"
                  value={formData.employeeId}
                  onChange={(e) =>
                    setFormData({ ...formData, employeeId: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="designation">Designation *</Label>
                <Input
                  id="designation"
                  value={formData.designation}
                  onChange={(e) =>
                    setFormData({ ...formData, designation: e.target.value })
                  }
                  placeholder="e.g., Department Admin, System Admin"
                  className={errors.designation ? 'border-red-500' : ''}
                />
                {errors.designation && (
                  <p className="text-sm text-red-500">{errors.designation}</p>
                )}
              </div>

              {/* Department is automatically set from Settings */}
              {currentDepartmentId && (
                <div className="space-y-2">
                  <Label htmlFor="departmentId">Department</Label>
                  <Input
                    id="departmentId"
                    value="Current Department (from Settings)"
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500">
                    Department is configured in System Settings
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'active' | 'inactive') =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> A user account will be created
                automatically with default password: <strong>11223344</strong>.
                Admin user can login and change their password. The admin will
                have full access to manage the department.
              </p>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/admins')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Admin'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

