'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Save,
  Building2,
  Users,
  BookOpen,
  Target,
  Settings,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Department {
  id: number;
  name: string;
  code: string;
  description: string | null;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  _count: {
    programs: number;
    courses: number;
    students: number;
    faculty: number;
  };
}

interface DepartmentStats {
  totalPrograms: number;
  totalCourses: number;
  totalStudents: number;
  totalFaculty: number;
  activeSemester: string | null;
  currentBatch: string | null;
}

export default function DepartmentSettingsPage() {
  const [department, setDepartment] = useState<Department | null>(null);
  const [stats, setStats] = useState<DepartmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    fetchDepartmentData();
  }, []);

  const fetchDepartmentData = async () => {
    try {
      setLoading(true);
      const [deptResponse, statsResponse] = await Promise.all([
        fetch('/api/department/departments'),
        fetch('/api/department/overview'),
      ]);

      if (!deptResponse.ok || !statsResponse.ok) {
        throw new Error('Failed to fetch department data');
      }

      const [deptData, statsData] = await Promise.all([
        deptResponse.json(),
        statsResponse.json(),
      ]);

      if (deptData.success && statsData.success) {
        // Get the first department (should be the admin's department)
        const dept = Array.isArray(deptData.data)
          ? deptData.data[0]
          : deptData.data;
        setDepartment(dept);
        setFormData({
          name: dept.name,
          code: dept.code,
          description: dept.description || '',
          status: dept.status,
        });
        setStats(statsData.data);
      }
    } catch (error) {
      console.error('Error fetching department data:', error);
      toast.error('Failed to fetch department data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.code) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(
        `/api/department/departments/${department?.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update department');
      }

      toast.success('Department updated successfully');
      fetchDepartmentData(); // Refresh data
    } catch (error) {
      console.error('Error updating department:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update department'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className='container mx-auto py-6'>
        <div className='text-center'>Loading...</div>
      </div>
    );
  }

  if (!department) {
    return (
      <div className='container mx-auto py-6'>
        <div className='text-center text-red-600'>Department not found</div>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-6 space-y-6'>
      <div className='flex items-center space-x-4'>
        <Settings className='h-8 w-8 text-blue-600' />
        <h1 className='text-3xl font-bold'>Department Settings</h1>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Main Settings Form */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Department Information */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <Building2 className='mr-2 h-5 w-5' />
                Department Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='name'>Department Name *</Label>
                    <Input
                      id='name'
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange('name', e.target.value)
                      }
                      placeholder='Enter department name'
                      required
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='code'>Department Code *</Label>
                    <Input
                      id='code'
                      value={formData.code}
                      onChange={(e) =>
                        handleInputChange('code', e.target.value)
                      }
                      placeholder='Enter department code'
                      required
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='description'>Description</Label>
                  <Textarea
                    id='description'
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange('description', e.target.value)
                    }
                    placeholder='Enter department description'
                    rows={4}
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='status'>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      handleInputChange('status', value)
                    }
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

                <div className='flex justify-end'>
                  <Button type='submit' disabled={saving}>
                    <Save className='mr-2 h-4 w-4' />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle>Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='text-sm font-medium text-gray-500'>
                    Created
                  </label>
                  <p className='text-lg font-semibold'>
                    {new Date(department.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-500'>
                    Last Updated
                  </label>
                  <p className='text-lg font-semibold'>
                    {new Date(department.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-500'>
                    Status
                  </label>
                  <Badge
                    variant={
                      department.status === 'active' ? 'default' : 'secondary'
                    }
                  >
                    {department.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className='space-y-6'>
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Department Overview</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-blue-600'>
                  {stats?.totalPrograms || department._count.programs}
                </div>
                <div className='text-sm text-gray-500'>Programs</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-green-600'>
                  {stats?.totalCourses || department._count.courses}
                </div>
                <div className='text-sm text-gray-500'>Courses</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-purple-600'>
                  {stats?.totalStudents || department._count.students}
                </div>
                <div className='text-sm text-gray-500'>Students</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-orange-600'>
                  {stats?.totalFaculty || department._count.faculty}
                </div>
                <div className='text-sm text-gray-500'>Faculty</div>
              </div>
            </CardContent>
          </Card>

          {/* Current Academic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Academic Status</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <label className='text-sm font-medium text-gray-500'>
                  Current Semester
                </label>
                <p className='text-lg font-semibold'>
                  {stats?.activeSemester || 'Not set'}
                </p>
              </div>
              <div>
                <label className='text-sm font-medium text-gray-500'>
                  Active Batch
                </label>
                <p className='text-lg font-semibold'>
                  {stats?.currentBatch || 'Not set'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <Button
                variant='outline'
                className='w-full'
                onClick={() => (window.location.href = '/department/programs')}
              >
                <BookOpen className='mr-2 h-4 w-4' />
                Manage Programs
              </Button>
              <Button
                variant='outline'
                className='w-full'
                onClick={() => (window.location.href = '/department/courses')}
              >
                <Target className='mr-2 h-4 w-4' />
                Manage Courses
              </Button>
              <Button
                variant='outline'
                className='w-full'
                onClick={() => (window.location.href = '/department/faculty')}
              >
                <Users className='mr-2 h-4 w-4' />
                Manage Faculty
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
