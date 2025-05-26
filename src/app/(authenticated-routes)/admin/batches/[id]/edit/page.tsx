'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Batch {
  id: string;
  name: string;
  program: {
    id: number;
    name: string;
    code: string;
  };
  startDate: string;
  endDate: string;
  maxStudents: number;
  description: string;
  status: 'active' | 'completed' | 'upcoming';
}

export default function EditBatchPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Batch>({
    id: '',
    name: '',
    program: {
      id: 0,
      name: '',
      code: '',
    },
    startDate: '',
    endDate: '',
    maxStudents: 0,
    description: '',
    status: 'upcoming',
  });

  useEffect(() => {
    fetchBatch();
  }, [params.id]);

  const fetchBatch = async () => {
    try {
      const response = await fetch(`/api/batches/${params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch batch');
      }
      const data = await response.json();
      setFormData(data);
    } catch (error) {
      console.error('Error fetching batch:', error);
      toast.error('Failed to load batch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`/api/batches/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          program: formData.program.id,
          startDate: formData.startDate,
          endDate: formData.endDate,
          maxStudents: formData.maxStudents,
          description: formData.description,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update batch');
      }

      toast.success('Batch updated successfully');
      router.push('/admin/batches');
    } catch (error) {
      console.error('Error updating batch:', error);
      toast.error('Failed to update batch');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-4'>
        <Link
          href='/admin/batches'
          className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
        >
          <ArrowLeft className='w-5 h-5' />
        </Link>
        <h1 className='text-2xl font-bold'>Edit Batch</h1>
      </div>

      <form onSubmit={handleSubmit} className='space-y-6 max-w-2xl'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-2'>
            <label htmlFor='name' className='block text-sm font-medium'>
              Batch Name
            </label>
            <input
              type='text'
              id='name'
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
              required
            />
          </div>

          <div className='space-y-2'>
            <label htmlFor='program' className='block text-sm font-medium'>
              Program
            </label>
            <select
              id='program'
              value={formData.program.id}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  program: {
                    ...formData.program,
                    id: parseInt(e.target.value),
                  },
                })
              }
              className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
              required
            >
              <option value=''>Select Program</option>
              <option value='1'>Computer Science</option>
              <option value='2'>Information Technology</option>
              <option value='3'>Software Engineering</option>
            </select>
          </div>

          <div className='space-y-2'>
            <label htmlFor='startDate' className='block text-sm font-medium'>
              Start Date
            </label>
            <input
              type='date'
              id='startDate'
              value={formData.startDate.split('T')[0]}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
              required
            />
          </div>

          <div className='space-y-2'>
            <label htmlFor='endDate' className='block text-sm font-medium'>
              End Date
            </label>
            <input
              type='date'
              id='endDate'
              value={formData.endDate.split('T')[0]}
              onChange={(e) =>
                setFormData({ ...formData, endDate: e.target.value })
              }
              className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
              required
            />
          </div>

          <div className='space-y-2'>
            <label htmlFor='maxStudents' className='block text-sm font-medium'>
              Maximum Students
            </label>
            <input
              type='number'
              id='maxStudents'
              value={formData.maxStudents}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxStudents: parseInt(e.target.value),
                })
              }
              className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
              required
              min='1'
            />
          </div>
        </div>

        <div className='space-y-2'>
          <label htmlFor='description' className='block text-sm font-medium'>
            Description
          </label>
          <textarea
            id='description'
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={4}
            className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
          />
        </div>

        <div className='flex justify-end gap-4'>
          <Link
            href='/admin/batches'
            className='px-6 py-2 border rounded-lg hover:bg-gray-50 transition-colors'
          >
            Cancel
          </Link>
          <button
            type='submit'
            disabled={isSaving}
            className='px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isSaving ? 'Saving...' : 'Update Batch'}
          </button>
        </div>
      </form>
    </div>
  );
}
