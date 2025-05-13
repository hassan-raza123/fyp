'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
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

// Define role types
type RoleType =
  | 'super_admin'
  | 'sub_admin'
  | 'department_admin'
  | 'child_admin'
  | 'teacher'
  | 'student';

const roleOptions = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'sub_admin', label: 'Sub Admin' },
  { value: 'department_admin', label: 'Department Admin' },
  { value: 'child_admin', label: 'Child Admin' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'student', label: 'Student' },
];

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
  departmentId?: string;
  programId?: string;
  rollNumber?: string;
  designation?: string;
  general?: string;
}

export default function UserCreationForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '' as RoleType,
    password: '',
    confirmPassword: '',
    departmentId: '',
    programId: '',
    rollNumber: '',
    designation: '',
  });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.role === 'teacher' && !formData.departmentId) {
      newErrors.departmentId = 'Department is required for teachers';
    }

    if (formData.role === 'student' && !formData.rollNumber) {
      newErrors.rollNumber = 'Roll Number is required for students';
    }

    if (formData.role === 'student' && !formData.departmentId) {
      newErrors.departmentId = 'Department is required for students';
    }

    if (formData.role === 'student' && !formData.programId) {
      newErrors.programId = 'Program is required for students';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          role: formData.role,
          password: formData.password,
          departmentId: formData.departmentId || undefined,
          programId: formData.programId || undefined,
          rollNumber:
            formData.role === 'student' ? formData.rollNumber : undefined,
          designation:
            formData.role === 'teacher' ? formData.designation : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create user');
      }

      // Success - redirect to users list
      router.push('/dashboard/users');
      router.refresh(); // Refresh the page to show the new user
    } catch (error) {
      console.error('Error creating user:', error);
      setErrors({
        general:
          error instanceof Error ? error.message : 'Failed to create user',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <Card className='p-6'>
      <form onSubmit={handleSubmit} className='space-y-6'>
        {errors.general && (
          <div className='bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg'>
            {errors.general}
          </div>
        )}

        {/* Basic Information */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-2'>
            <Label htmlFor='firstName'>First Name</Label>
            <Input
              id='firstName'
              name='firstName'
              value={formData.firstName}
              onChange={handleChange}
              required
              className={errors.firstName ? 'border-red-500' : ''}
            />
            {errors.firstName && (
              <p className='text-red-500 text-sm mt-1'>{errors.firstName}</p>
            )}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='lastName'>Last Name</Label>
            <Input
              id='lastName'
              name='lastName'
              value={formData.lastName}
              onChange={handleChange}
              required
              className={errors.lastName ? 'border-red-500' : ''}
            />
            {errors.lastName && (
              <p className='text-red-500 text-sm mt-1'>{errors.lastName}</p>
            )}
          </div>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='email'>Email</Label>
          <Input
            id='email'
            name='email'
            type='email'
            value={formData.email}
            onChange={handleChange}
            required
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && (
            <p className='text-red-500 text-sm mt-1'>{errors.email}</p>
          )}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='role'>Role</Label>
          <Select
            value={formData.role}
            onValueChange={(value) => {
              setFormData((prev) => ({ ...prev, role: value as RoleType }));
              if (errors.role) {
                setErrors((prev) => ({ ...prev, role: undefined }));
              }
            }}
          >
            <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
              <SelectValue placeholder='Select a role' />
            </SelectTrigger>
            <SelectContent>
              {roleOptions.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.role && (
            <p className='text-red-500 text-sm mt-1'>{errors.role}</p>
          )}
        </div>

        {/* Password Fields */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-2'>
            <Label htmlFor='password'>Password</Label>
            <Input
              id='password'
              name='password'
              type='password'
              value={formData.password}
              onChange={handleChange}
              required
              className={errors.password ? 'border-red-500' : ''}
            />
            {errors.password && (
              <p className='text-red-500 text-sm mt-1'>{errors.password}</p>
            )}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='confirmPassword'>Confirm Password</Label>
            <Input
              id='confirmPassword'
              name='confirmPassword'
              type='password'
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className={errors.confirmPassword ? 'border-red-500' : ''}
            />
            {errors.confirmPassword && (
              <p className='text-red-500 text-sm mt-1'>
                {errors.confirmPassword}
              </p>
            )}
          </div>
        </div>

        {/* Role-specific Fields */}
        {formData.role === 'teacher' && (
          <div className='space-y-2'>
            <Label htmlFor='departmentId'>Department</Label>
            <Input
              id='departmentId'
              name='departmentId'
              value={formData.departmentId}
              onChange={handleChange}
              required
              className={errors.departmentId ? 'border-red-500' : ''}
            />
            {errors.departmentId && (
              <p className='text-red-500 text-sm mt-1'>{errors.departmentId}</p>
            )}
          </div>
        )}

        {formData.role === 'student' && (
          <div className='space-y-2'>
            <Label htmlFor='rollNumber'>Roll Number</Label>
            <Input
              id='rollNumber'
              name='rollNumber'
              value={formData.rollNumber}
              onChange={handleChange}
              required
              className={errors.rollNumber ? 'border-red-500' : ''}
            />
            {errors.rollNumber && (
              <p className='text-red-500 text-sm mt-1'>{errors.rollNumber}</p>
            )}
          </div>
        )}

        <div className='flex justify-end gap-4'>
          <Button
            type='button'
            variant='outline'
            onClick={() => router.push('/dashboard/users')}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type='submit' disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create User'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
