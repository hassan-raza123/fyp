'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { use } from 'react';

const editCourseSchema = z.object({
  code: z.string().min(3).max(10),
  name: z.string().min(3),
  description: z.string().optional(),
  creditHours: z.number().min(0).max(6),
  theoryHours: z.number().min(0).optional(),
  labHours: z.number().min(0).optional(),
  type: z.enum(['THEORY', 'LAB', 'PROJECT', 'THESIS']),
  departmentId: z.number(),
  status: z.enum(['active', 'inactive', 'archived']),
});

type FormData = z.infer<typeof editCourseSchema>;

interface Course {
  id: number;
  code: string;
  name: string;
  description: string | null;
  creditHours: number;
  theoryHours: number | null;
  labHours: number | null;
  type: 'THEORY' | 'LAB' | 'PROJECT' | 'THESIS';
  status: 'active' | 'inactive' | 'archived';
  departmentId: number;
}

export default function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<
    { id: number; name: string }[]
  >([]);
  const resolvedParams = use(params);
  const courseId = resolvedParams.id;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(editCourseSchema),
  });

  const creditHours = watch('creditHours');
  const theoryHours = watch('theoryHours');
  const labHours = watch('labHours');

  useEffect(() => {
    fetchCourse();
    fetchDepartments();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`);
      if (!response.ok) throw new Error('Failed to fetch course');
      const data = await response.json();
      if (data.success) {
        const course: Course = data.data;
        setValue('code', course.code);
        setValue('name', course.name);
        setValue('description', course.description || '');
        setValue('creditHours', course.creditHours);
        setValue('theoryHours', course.theoryHours || 0);
        setValue('labHours', course.labHours || 0);
        setValue('type', course.type);
        setValue('departmentId', course.departmentId);
        setValue(
          'status',
          course.status.toLowerCase() as 'active' | 'inactive' | 'archived'
        );
      } else {
        throw new Error(data.error || 'Failed to fetch course');
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to fetch course'
      );
      router.push('/admin/courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (!response.ok) throw new Error('Failed to fetch departments');
      const data = await response.json();
      if (data.success) {
        setDepartments(data.data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to fetch departments');
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update course');
      }

      toast.success('Course updated successfully');
      router.push('/admin/courses');
    } catch (error) {
      console.error('Error updating course:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update course'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className='container mx-auto py-10'>
        <div className='text-center'>Loading...</div>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-10'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-3xl font-bold'>Edit Course</h1>
        <Button variant='outline' onClick={() => router.push('/admin/courses')}>
          Cancel
        </Button>
      </div>

      <Card className='p-6'>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-2'>
              <Label htmlFor='code'>Course Code</Label>
              <Input
                id='code'
                {...register('code')}
                placeholder='e.g., CS101'
              />
              {errors.code && (
                <p className='text-sm text-red-500'>{errors.code.message}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='name'>Course Name</Label>
              <Input
                id='name'
                {...register('name')}
                placeholder='e.g., Introduction to Programming'
              />
              {errors.name && (
                <p className='text-sm text-red-500'>{errors.name.message}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='creditHours'>Credit Hours</Label>
              <Input
                id='creditHours'
                type='number'
                {...register('creditHours', { valueAsNumber: true })}
                min={0}
                max={6}
                step={0.5}
              />
              {errors.creditHours && (
                <p className='text-sm text-red-500'>
                  {errors.creditHours.message}
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='type'>Course Type</Label>
              <Select
                onValueChange={(value) =>
                  setValue(
                    'type',
                    value as 'THEORY' | 'LAB' | 'PROJECT' | 'THESIS'
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='THEORY'>Theory</SelectItem>
                  <SelectItem value='LAB'>Lab</SelectItem>
                  <SelectItem value='PROJECT'>Project</SelectItem>
                  <SelectItem value='THESIS'>Thesis</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className='text-sm text-red-500'>{errors.type.message}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='theoryHours'>Theory Hours</Label>
              <Input
                id='theoryHours'
                type='number'
                {...register('theoryHours', { valueAsNumber: true })}
                min={0}
                max={creditHours}
                step={0.5}
              />
              {errors.theoryHours && (
                <p className='text-sm text-red-500'>
                  {errors.theoryHours.message}
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='labHours'>Lab Hours</Label>
              <Input
                id='labHours'
                type='number'
                {...register('labHours', { valueAsNumber: true })}
                min={0}
                max={creditHours - (theoryHours || 0)}
                step={0.5}
              />
              {errors.labHours && (
                <p className='text-sm text-red-500'>
                  {errors.labHours.message}
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='departmentId'>Department</Label>
              <Select
                onValueChange={(value) =>
                  setValue('departmentId', parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select department' />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.departmentId && (
                <p className='text-sm text-red-500'>
                  {errors.departmentId.message}
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='status'>Status</Label>
              <Select
                onValueChange={(value) =>
                  setValue(
                    'status',
                    value as 'active' | 'inactive' | 'archived'
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='active'>Active</SelectItem>
                  <SelectItem value='inactive'>Inactive</SelectItem>
                  <SelectItem value='archived'>Archived</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className='text-sm text-red-500'>{errors.status.message}</p>
              )}
            </div>

            <div className='space-y-2 md:col-span-2'>
              <Label htmlFor='description'>Description</Label>
              <Textarea
                id='description'
                {...register('description')}
                placeholder='Enter course description...'
                className='min-h-[100px]'
              />
              {errors.description && (
                <p className='text-sm text-red-500'>
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>

          <div className='flex justify-end gap-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => router.push('/admin/courses')}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
