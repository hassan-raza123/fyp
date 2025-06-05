'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { semester_status } from '@prisma/client';
import { use } from 'react';

interface FormData {
  name: string;
  startDate: string;
  endDate: string;
  status: semester_status;
}

export default function EditSemesterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    startDate: '',
    endDate: '',
    status: semester_status.active,
  });

  useEffect(() => {
    fetchSemester();
  }, [resolvedParams.id]);

  const fetchSemester = async () => {
    try {
      const response = await fetch(`/api/semesters?id=${resolvedParams.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch semester');
      }
      const data = await response.json();
      if (data.success && data.data) {
        const semester = data.data;
        setFormData({
          name: semester.name,
          startDate: new Date(semester.startDate).toISOString().split('T')[0],
          endDate: new Date(semester.endDate).toISOString().split('T')[0],
          status: semester.status,
        });
      }
    } catch (error) {
      console.error('Error fetching semester:', error);
      toast.error('Failed to fetch semester');
      router.push('/admin/semesters');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`/api/semesters?id=${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update semester');
      }

      toast.success('Semester updated successfully');
      router.push('/admin/semesters');
    } catch (error) {
      console.error('Error updating semester:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update semester'
      );
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className='container mx-auto py-10'>
        <div className='text-center'>Loading...</div>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-10'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold'>Edit Semester</h1>
        <p className='text-muted-foreground'>Update semester information</p>
      </div>

      <Card className='p-6'>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Semester Name</Label>
              <Input
                id='name'
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder='e.g., Fall 2024'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='status'>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: semester_status) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id='status'>
                  <SelectValue placeholder='Select status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={semester_status.active}>Active</SelectItem>
                  <SelectItem value={semester_status.inactive}>
                    Inactive
                  </SelectItem>
                  <SelectItem value={semester_status.completed}>
                    Completed
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='startDate'>Start Date</Label>
              <Input
                id='startDate'
                type='date'
                required
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='endDate'>End Date</Label>
              <Input
                id='endDate'
                type='date'
                required
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
              />
            </div>
          </div>

          <div className='flex justify-end space-x-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => router.push('/admin/semesters')}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
