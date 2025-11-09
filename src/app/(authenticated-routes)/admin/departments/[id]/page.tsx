'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Building2, Users, GraduationCap, BookOpen } from 'lucide-react';

interface Department {
  id: number;
  name: string;
  code: string;
  description: string | null;
  status: string;
  admin: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  _count: {
    programs: number;
    faculties: number;
    students: number;
    courses: number;
  };
}

export default function DepartmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchDepartment();
    }
  }, [params.id]);

  const fetchDepartment = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/departments/${params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch department');
      }
      const data = await response.json();
      if (data.success) {
        setDepartment(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch department');
      }
    } catch (error) {
      console.error('Error fetching department:', error);
      toast.error('Failed to fetch department details');
      router.push('/admin/departments');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500'></div>
      </div>
    );
  }

  if (!department) {
    return (
      <div className='container mx-auto py-10'>
        <div className='text-center'>
          <p className='text-muted-foreground'>Department not found</p>
          <Button onClick={() => router.push('/admin/departments')} className='mt-4'>
            Back to Departments
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-10'>
      <div className='mb-6'>
        <Button
          variant='ghost'
          onClick={() => router.push('/admin/departments')}
          className='mb-4'
        >
          <ArrowLeft className='mr-2 h-4 w-4' />
          Back to Departments
        </Button>
        <div className='flex items-center gap-3'>
          <Building2 className='h-8 w-8 text-primary' />
          <div>
            <h1 className='text-3xl font-bold'>{department.name}</h1>
            <p className='text-muted-foreground'>Department Code: {department.code}</p>
          </div>
        </div>
      </div>

      <div className='grid gap-6'>
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <label className='text-sm font-medium text-muted-foreground'>
                Department Name
              </label>
              <p className='text-lg'>{department.name}</p>
            </div>
            <div>
              <label className='text-sm font-medium text-muted-foreground'>
                Department Code
              </label>
              <p className='text-lg'>{department.code}</p>
            </div>
            <div>
              <label className='text-sm font-medium text-muted-foreground'>
                Description
              </label>
              <p className='text-lg'>
                {department.description || 'No description provided'}
              </p>
            </div>
            <div>
              <label className='text-sm font-medium text-muted-foreground'>
                Status
              </label>
              <div className='mt-1'>
                {department.status === 'active' ? (
                  <Badge variant='default'>Active</Badge>
                ) : (
                  <Badge variant='secondary'>Inactive</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Department Admin */}
        {department.admin && (
          <Card>
            <CardHeader>
              <CardTitle>Department Head</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>
                    Name
                  </label>
                  <p className='text-lg'>
                    {department.admin.first_name} {department.admin.last_name}
                  </p>
                </div>
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>
                    Email
                  </label>
                  <p className='text-lg'>{department.admin.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Programs</CardTitle>
              <BookOpen className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{department._count.programs}</div>
              <p className='text-xs text-muted-foreground'>
                Total programs in this department
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Faculty</CardTitle>
              <Users className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{department._count.faculties}</div>
              <p className='text-xs text-muted-foreground'>
                Total faculty members
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Students</CardTitle>
              <GraduationCap className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{department._count.students}</div>
              <p className='text-xs text-muted-foreground'>
                Total enrolled students
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex flex-wrap gap-2'>
              <Button
                variant='outline'
                onClick={() => router.push(`/admin/programs?departmentId=${department.id}`)}
              >
                View Programs
              </Button>
              <Button
                variant='outline'
                onClick={() => router.push(`/admin/courses?departmentId=${department.id}`)}
              >
                View Courses
              </Button>
              <Button
                variant='outline'
                onClick={() => router.push(`/admin/faculty?departmentId=${department.id}`)}
              >
                View Faculty
              </Button>
              <Button
                variant='outline'
                onClick={() => router.push(`/admin/students?departmentId=${department.id}`)}
              >
                View Students
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

