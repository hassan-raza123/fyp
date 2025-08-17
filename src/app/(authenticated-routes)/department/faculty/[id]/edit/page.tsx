'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { ArrowLeft, Save, User } from 'lucide-react';

interface Faculty {
  id: number;
  employeeId: string;
  designation: string;
  status: 'active' | 'inactive';
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  department: {
    id: number;
    name: string;
    code: string;
  };
}

export default function EditFacultyPage() {
  const router = useRouter();
  const params = useParams();
  const facultyId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    designation: '',
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    if (facultyId) {
      fetchFaculty();
    }
  }, [facultyId]);

  const fetchFaculty = async () => {
    try {
      setFetching(true);
      const response = await fetch(`/api/department/faculty/${facultyId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch faculty');
      }
      const data = await response.json();
      if (data.success) {
        setFaculty(data.data);
        setFormData({
          employeeId: data.data.employeeId,
          designation: data.data.designation,
          status: data.data.status,
        });
      }
    } catch (error) {
      console.error('Error fetching faculty:', error);
      toast.error('Failed to fetch faculty');
      router.push('/department/faculty');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employeeId || !formData.designation) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/department/faculty/${facultyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update faculty member');
      }

      toast.success('Faculty member updated successfully');
      router.push('/department/faculty');
    } catch (error) {
      console.error('Error updating faculty:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update faculty member'
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

  if (fetching) {
    return (
      <div className='container mx-auto py-6'>
        <div className='text-center'>Loading...</div>
      </div>
    );
  }

  if (!faculty) {
    return (
      <div className='container mx-auto py-6'>
        <div className='text-center text-red-600'>Faculty not found</div>
      </div>
    );
  }

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
        <h1 className='text-3xl font-bold'>Edit Faculty Member</h1>
      </div>

      <Card className='max-w-2xl'>
        <CardHeader>
          <CardTitle className='flex items-center'>
            <User className='mr-2 h-5 w-5' />
            Edit Faculty Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='space-y-2'>
              <Label htmlFor='userInfo'>User</Label>
              <Input
                id='userInfo'
                value={`${faculty.user.first_name} ${faculty.user.last_name} (${faculty.user.email})`}
                disabled
                className='bg-gray-50'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='departmentInfo'>Department</Label>
              <Input
                id='departmentInfo'
                value={`${faculty.department.name} (${faculty.department.code})`}
                disabled
                className='bg-gray-50'
              />
            </div>

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
                {loading ? 'Updating...' : 'Update Faculty Member'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
