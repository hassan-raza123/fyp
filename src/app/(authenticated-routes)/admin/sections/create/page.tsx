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
  name: z.string().min(1, 'Section name is required'),
  courseOfferingId: z.string().min(1, 'Course offering is required'),
  facultyId: z.string().min(1, 'Faculty/Teacher is required'),
  batchId: z.string().min(1, 'Batch is required'),
  maxStudents: z.string().min(1, 'Maximum students is required'),
});

interface CourseOffering {
  id: number;
  course: {
    code: string;
    name: string;
  };
  semester: {
    name: string;
  };
}

interface Batch {
  id: string;
  name: string;
}

interface Faculty {
  id: number;
  user: {
    first_name: string;
    last_name: string;
  };
}

export default function CreateSectionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      courseOfferingId: '',
      facultyId: '',
      batchId: '',
      maxStudents: '',
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log('Starting to fetch data for dropdowns...');

      // Fetch course offerings with status=active and limit=100
      const offeringsResponse = await fetch(
        '/api/courses/offerings?status=active&limit=100'
      );
      console.log(
        'Course offerings response status:',
        offeringsResponse.status
      );
      if (!offeringsResponse.ok) {
        const errorData = await offeringsResponse.json();
        console.error('Error fetching course offerings:', errorData);
        throw new Error(errorData.error || 'Failed to fetch course offerings');
      }
      const offeringsData = await offeringsResponse.json();
      if (!offeringsData.success) {
        console.error('Error in course offerings response:', offeringsData);
        throw new Error(
          offeringsData.error || 'Failed to fetch course offerings'
        );
      }
      console.log('Fetched course offerings:', offeringsData.data.length);

      // Fetch batches with status=active
      const batchesResponse = await fetch('/api/batches?status=active');
      console.log('Batches response status:', batchesResponse.status);
      if (!batchesResponse.ok) {
        const errorData = await batchesResponse.json();
        console.error('Error fetching batches:', errorData);
        throw new Error(errorData.error || 'Failed to fetch batches');
      }
      const batchesData = await batchesResponse.json();
      if (!batchesData.success) {
        console.error('Error in batches response:', batchesData);
        throw new Error(batchesData.error || 'Failed to fetch batches');
      }
      console.log('Fetched batches:', batchesData.data.length);

      // Fetch faculties with status=active
      const facultiesResponse = await fetch('/api/faculties?status=active');
      console.log('Faculties response status:', facultiesResponse.status);
      if (!facultiesResponse.ok) {
        const errorData = await facultiesResponse.json();
        console.error('Error fetching faculties:', errorData);
        throw new Error(errorData.error || 'Failed to fetch faculties');
      }
      const facultiesData = await facultiesResponse.json();
      if (!facultiesData.success) {
        console.error('Error in faculties response:', facultiesData);
        throw new Error(facultiesData.error || 'Failed to fetch faculties');
      }
      console.log('Fetched faculties:', facultiesData.data.length);

      // Update state with fetched data
      setCourseOfferings(offeringsData.data || []);
      setBatches(batchesData.data || []);
      setFaculties(facultiesData.data || []);
    } catch (error) {
      console.error('Error in fetchData:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to fetch data'
      );
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      console.log('Submitting form with values:', values);

      const requestBody = {
        ...values,
        courseOfferingId: parseInt(values.courseOfferingId),
        facultyId: parseInt(values.facultyId),
        maxStudents: parseInt(values.maxStudents),
      };

      console.log('Request body:', requestBody);

      const response = await fetch('/api/sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();
      console.log('API Response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to create section');
      }

      if (!responseData.success) {
        throw new Error(responseData.error || 'Failed to create section');
      }

      toast.success('Section created successfully');
      router.push('/admin/sections');
    } catch (error) {
      console.error('Error creating section:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create section'
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
          onClick={() => router.push('/admin/sections')}
        >
          <ArrowLeft className='h-4 w-4' />
        </Button>
        <div>
          <h1 className='text-3xl font-bold'>Create Section</h1>
          <p className='text-muted-foreground'>
            Create a new section for a course offering
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Section Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <div className='grid grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <label htmlFor='name' className='text-sm font-medium'>
                  Section Name
                </label>
                <Input
                  id='name'
                  {...form.register('name')}
                  placeholder='e.g., CS101-A'
                />
                {form.formState.errors.name && (
                  <p className='text-sm text-red-500'>
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className='space-y-2'>
                <label
                  htmlFor='courseOfferingId'
                  className='text-sm font-medium'
                >
                  Course Offering
                </label>
                <Select
                  onValueChange={(value) =>
                    form.setValue('courseOfferingId', value)
                  }
                  value={form.watch('courseOfferingId')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select course offering' />
                  </SelectTrigger>
                  <SelectContent>
                    {courseOfferings.map((offering) => (
                      <SelectItem
                        key={offering.id}
                        value={offering.id.toString()}
                      >
                        {offering.course.code} - {offering.course.name} (
                        {offering.semester.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.courseOfferingId && (
                  <p className='text-sm text-red-500'>
                    {form.formState.errors.courseOfferingId.message}
                  </p>
                )}
              </div>

              <div className='space-y-2'>
                <label htmlFor='facultyId' className='text-sm font-medium'>
                  Faculty/Teacher <span className='text-red-500'>*</span>
                </label>
                <Select
                  onValueChange={(value) => form.setValue('facultyId', value)}
                  value={form.watch('facultyId')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select faculty' />
                  </SelectTrigger>
                  <SelectContent>
                    {faculties.map((faculty) => (
                      <SelectItem
                        key={faculty.id}
                        value={faculty.id.toString()}
                      >
                        {faculty.user.first_name} {faculty.user.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.facultyId && (
                  <p className='text-sm text-red-500'>
                    {form.formState.errors.facultyId.message}
                  </p>
                )}
              </div>

              <div className='space-y-2'>
                <label htmlFor='batchId' className='text-sm font-medium'>
                  Batch
                </label>
                <Select
                  onValueChange={(value) => form.setValue('batchId', value)}
                  value={form.watch('batchId')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select batch' />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.batchId && (
                  <p className='text-sm text-red-500'>
                    {form.formState.errors.batchId.message}
                  </p>
                )}
              </div>

              <div className='space-y-2'>
                <label htmlFor='maxStudents' className='text-sm font-medium'>
                  Maximum Students
                </label>
                <Input
                  id='maxStudents'
                  type='number'
                  {...form.register('maxStudents')}
                  placeholder='e.g., 30'
                />
                {form.formState.errors.maxStudents && (
                  <p className='text-sm text-red-500'>
                    {form.formState.errors.maxStudents.message}
                  </p>
                )}
              </div>
            </div>

            <div className='flex justify-end gap-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => router.push('/admin/sections')}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={loading}>
                {loading ? 'Creating...' : 'Create Section'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
