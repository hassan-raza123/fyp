'use client';

import { useState } from 'react';
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

interface FormData {
  name: string;
  startDate: string;
  endDate: string;
  status: semester_status;
}

export default function NewSemesterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    startDate: '',
    endDate: '',
    status: semester_status.active,
  });

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Semester name is required');
      return false;
    }
    if (!formData.startDate) {
      toast.error('Start date is required');
      return false;
    }
    if (!formData.endDate) {
      toast.error('End date is required');
      return false;
    }
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      toast.error('End date must be after start date');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await fetch('/api/semesters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      let data;
      try {
        data = await response.json();
      } catch (error) {
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create semester');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create semester');
      }

      toast.success('Semester created successfully');
      router.push('/admin/semesters');
    } catch (error) {
      console.error('Error creating semester:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create semester'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='container mx-auto py-10'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold'>Create New Semester</h1>
        <p className='text-muted-foreground'>
          Add a new academic semester to the system
        </p>
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
                placeholder='Enter semester name'
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
              {loading ? 'Creating...' : 'Create Semester'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
