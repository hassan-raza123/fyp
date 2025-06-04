'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const formSchema = z.object({
  courseId: z.string().min(1, 'Course is required'),
  semesterId: z.string().min(1, 'Semester is required'),
  status: z.enum(['active', 'inactive', 'cancelled']).default('active'),
});

interface Course {
  id: number;
  code: string;
  name: string;
  department: {
    name: string;
  };
}

interface Semester {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
}

export default function CreateCourseOfferingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      courseId: '',
      semesterId: '',
      status: 'active',
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [coursesRes, semestersRes] = await Promise.all([
        fetch('/api/courses?status=active'),
        fetch('/api/semesters?status=active'),
      ]);

      if (!coursesRes.ok || !semestersRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [coursesData, semestersData] = await Promise.all([
        coursesRes.json(),
        semestersRes.json(),
      ]);

      setCourses(coursesData.data);
      setSemesters(semestersData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch required data');
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      const response = await fetch('/api/courses/offerings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: parseInt(values.courseId),
          semesterId: parseInt(values.semesterId),
          status: values.status,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create course offering');
      }

      toast.success('Course offering created successfully');
      router.push('/admin/course-offerings');
    } catch (error) {
      console.error('Error creating course offering:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to create course offering'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='container mx-auto py-10'>
      <div className='flex items-center gap-4 mb-6'>
        <Button
          variant='ghost'
          size='icon'
          onClick={() => router.push('/admin/course-offerings')}
        >
          <ArrowLeft className='h-4 w-4' />
        </Button>
        <div>
          <h1 className='text-3xl font-bold'>Create Course Offering</h1>
          <p className='text-muted-foreground'>
            Create a new course offering for a semester
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Offering Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <div className='grid grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <label htmlFor='courseId' className='text-sm font-medium'>
                  Course
                </label>
                <Select
                  onValueChange={(value) => form.setValue('courseId', value)}
                  value={form.watch('courseId')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select a course' />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.code} - {course.name} ({course.department.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.courseId && (
                  <p className='text-sm text-red-500'>
                    {form.formState.errors.courseId.message}
                  </p>
                )}
              </div>

              <div className='space-y-2'>
                <label htmlFor='semesterId' className='text-sm font-medium'>
                  Semester
                </label>
                <Select
                  onValueChange={(value) => form.setValue('semesterId', value)}
                  value={form.watch('semesterId')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select a semester' />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map((semester) => (
                      <SelectItem
                        key={semester.id}
                        value={semester.id.toString()}
                      >
                        {semester.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.semesterId && (
                  <p className='text-sm text-red-500'>
                    {form.formState.errors.semesterId.message}
                  </p>
                )}
              </div>

              <div className='space-y-2'>
                <label htmlFor='status' className='text-sm font-medium'>
                  Status
                </label>
                <Select
                  onValueChange={(value) =>
                    form.setValue('status', value as any)
                  }
                  value={form.watch('status')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='active'>Active</SelectItem>
                    <SelectItem value='inactive'>Inactive</SelectItem>
                    <SelectItem value='cancelled'>Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.status && (
                  <p className='text-sm text-red-500'>
                    {form.formState.errors.status.message}
                  </p>
                )}
              </div>
            </div>

            <div className='flex justify-end gap-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => router.push('/admin/course-offerings')}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={loading}>
                {loading ? 'Creating...' : 'Create Course Offering'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
