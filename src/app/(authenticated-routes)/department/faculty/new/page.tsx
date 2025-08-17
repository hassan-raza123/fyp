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
import { toast } from 'sonner';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface Department {
  id: number;
  name: string;
  code: string;
}

export default function NewFacultyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState({
    employeeId: '',
    designation: '',
    userId: '',
    status: 'active',
  });

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/department/users/available');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/department/departments');
      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }
      const data = await response.json();
      if (data.success) {
        setDepartments(data.data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to fetch departments');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employeeId || !formData.designation || !formData.userId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/department/faculty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create faculty member');
      }

      toast.success('Faculty member created successfully');
      router.push('/department/faculty');
    } catch (error) {
      console.error('Error creating faculty:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to create faculty member'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className='container mx-auto py-6 space-y-6'>
      <div className='flex items-center space-x-4'>
        <Button
          variant='ghost'
          onClick={() => router.back()}
          className='p-0 h-auto'
        >
          <ArrowLeft className='h-4 w-4 mr-2' />
          Back
        </Button>
        <h1 className='text-3xl font-bold'>Add New Faculty Member</h1>
      </div>

      <Card className='max-w-2xl'>
        <CardHeader>
          <CardTitle className='flex items-center'>
            <UserPlus className='mr-2 h-5 w-5' />
            Faculty Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='employeeId'>Employee ID *</Label>
                <Input
                  id='employeeId'
                  value={formData.employeeId}
                  onChange={(e) =>
                    handleInputChange('employeeId', e.target.value)
                  }
                  placeholder='Enter employee ID'
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='designation'>Designation *</Label>
                <Input
                  id='designation'
                  value={formData.designation}
                  onChange={(e) =>
                    handleInputChange('designation', e.target.value)
                  }
                  placeholder='Enter designation'
                  required
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='userId'>Select User *</Label>
              <Select
                value={formData.userId}
                onValueChange={(value) => handleInputChange('userId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select a user' />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.first_name} {user.last_name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='status'>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='active'>Active</SelectItem>
                  <SelectItem value='inactive'>Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='flex justify-end space-x-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={loading}>
                <Save className='mr-2 h-4 w-4' />
                {loading ? 'Creating...' : 'Create Faculty Member'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
