'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface CourseOffering {
  id: number;
  course: {
    id: number;
    code: string;
    name: string;
  };
  semester: {
    id: number;
    name: string;
  };
}

interface Faculty {
  id: number;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface Batch {
  id: string;
  name: string;
}

interface Section {
  id: number;
  name: string;
  maxStudents: number;
  status: 'active' | 'inactive' | 'suspended' | 'deleted';
  courseOffering: CourseOffering;
  faculty: Faculty | null;
  batch: Batch;
}

type SectionStatus = 'active' | 'inactive' | 'suspended';

export default function EditSectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [section, setSection] = useState<Section | null>(null);
  const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    maxStudents: '',
    status: 'active' as SectionStatus,
    courseOfferingId: '',
    facultyId: '',
    batchId: '',
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      // Fetch section details
      const sectionResponse = await fetch(`/api/sections/${id}`);
      if (!sectionResponse.ok) {
        throw new Error('Failed to fetch section details');
      }
      const sectionData = await sectionResponse.json();
      if (!sectionData.success) {
        throw new Error(sectionData.error || 'Failed to fetch section details');
      }
      setSection(sectionData.data);
      setFormData({
        name: sectionData.data.name,
        maxStudents: sectionData.data.maxStudents.toString(),
        status: sectionData.data.status as SectionStatus,
        courseOfferingId: sectionData.data.courseOffering.id.toString(),
        facultyId: sectionData.data.faculty?.id.toString() || '',
        batchId: sectionData.data.batch.id,
      });

      // Fetch course offerings
      const offeringsResponse = await fetch(
        '/api/courses/offerings?status=active&limit=100'
      );
      if (!offeringsResponse.ok) {
        throw new Error('Failed to fetch course offerings');
      }
      const offeringsData = await offeringsResponse.json();
      if (!offeringsData.success) {
        throw new Error(
          offeringsData.error || 'Failed to fetch course offerings'
        );
      }
      setCourseOfferings(offeringsData.data);

      // Fetch faculties
      const facultiesResponse = await fetch('/api/faculties?status=active');
      if (!facultiesResponse.ok) {
        throw new Error('Failed to fetch faculties');
      }
      const facultiesData = await facultiesResponse.json();
      if (!facultiesData.success) {
        throw new Error(facultiesData.error || 'Failed to fetch faculties');
      }
      setFaculties(facultiesData.data);

      // Fetch batches
      const batchesResponse = await fetch('/api/batches?status=active');
      if (!batchesResponse.ok) {
        throw new Error('Failed to fetch batches');
      }
      const batchesData = await batchesResponse.json();
      if (!batchesData.success) {
        throw new Error(batchesData.error || 'Failed to fetch batches');
      }
      setBatches(batchesData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to fetch data'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const maxStudents = parseInt(formData.maxStudents);
      if (isNaN(maxStudents) || maxStudents < 1) {
        throw new Error(
          'Maximum students must be a valid number greater than 0'
        );
      }

      const response = await fetch(`/api/sections/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          maxStudents,
          status: formData.status,
          courseOfferingId: parseInt(formData.courseOfferingId),
          facultyId: formData.facultyId ? parseInt(formData.facultyId) : null,
          batchId: formData.batchId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update section');
      }

      toast.success('Section updated successfully');
      router.push(`/admin/sections/${id}`);
    } catch (error) {
      console.error('Error updating section:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update section'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className='container mx-auto py-10'>
        <div className='flex items-center justify-center h-64'>
          <p className='text-muted-foreground'>Loading...</p>
        </div>
      </div>
    );
  }

  if (!section) {
    return (
      <div className='container mx-auto py-10'>
        <div className='flex items-center justify-center h-64'>
          <p className='text-muted-foreground'>Section not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-10'>
      <div className='flex items-center gap-4 mb-6'>
        <Button
          variant='ghost'
          size='icon'
          onClick={() => router.push(`/admin/sections/${id}`)}
        >
          <ArrowLeft className='h-4 w-4' />
        </Button>
        <div>
          <h1 className='text-3xl font-bold'>Edit Section</h1>
          <p className='text-muted-foreground'>
            {section.courseOffering.course.code} -{' '}
            {section.courseOffering.course.name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Section Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='grid grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label htmlFor='name'>Section Name</Label>
                <Input
                  id='name'
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='maxStudents'>Maximum Students</Label>
                <Input
                  id='maxStudents'
                  type='number'
                  min='1'
                  value={formData.maxStudents}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxStudents: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='courseOffering'>Course Offering</Label>
                <Select
                  value={formData.courseOfferingId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, courseOfferingId: value })
                  }
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
              </div>

              <div className='space-y-2'>
                <Label htmlFor='faculty'>Faculty</Label>
                <Select
                  value={formData.facultyId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, facultyId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select faculty' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='none'>None</SelectItem>
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
              </div>

              <div className='space-y-2'>
                <Label htmlFor='batch'>Batch</Label>
                <Select
                  value={formData.batchId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, batchId: value })
                  }
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
              </div>

              <div className='space-y-2'>
                <Label htmlFor='status'>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: SectionStatus) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='active'>Active</SelectItem>
                    <SelectItem value='inactive'>Inactive</SelectItem>
                    <SelectItem value='suspended'>Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='flex justify-end gap-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => router.push(`/admin/sections/${id}`)}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
