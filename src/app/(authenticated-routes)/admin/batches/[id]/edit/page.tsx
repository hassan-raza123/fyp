'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { batches_status } from '@prisma/client';

interface Program {
  id: number;
  name: string;
  code: string;
  department: {
    name: string;
    code: string;
  };
}

interface Batch {
  id: string;
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  maxStudents: number;
  description: string | null;
  status: batches_status;
  program: {
    id: number;
    name: string;
    code: string;
  };
}

interface FormData {
  name: string;
  code: string;
  programId: number;
  maxStudents: number;
  startDate: string;
  endDate: string;
  status: batches_status;
  description: string;
}

export default function EditBatchPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    code: '',
    programId: 0,
    maxStudents: 0,
    startDate: '',
    endDate: '',
    status: 'upcoming',
    description: '',
  });

  useEffect(() => {
    fetchBatchAndPrograms();
  }, [params.id]);

  const fetchBatchAndPrograms = async () => {
    try {
      const [batchResponse, programsResponse] = await Promise.all([
        fetch(`/api/batches/${params.id}`),
        fetch('/api/programs'),
      ]);

      if (!batchResponse.ok || !programsResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const [{ data: batch }, { data: programsData }] = await Promise.all([
        batchResponse.json(),
        programsResponse.json(),
      ]);

      setPrograms(programsData);
      setFormData({
        name: batch.name,
        code: batch.code,
        programId: batch.program.id,
        maxStudents: batch.maxStudents,
        startDate: batch.startDate.split('T')[0],
        endDate: batch.endDate ? batch.endDate.split('T')[0] : '',
        status: batch.status,
        description: batch.description || '',
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load batch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form data
      if (!formData.name || !formData.code || !formData.programId) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (formData.maxStudents <= 0) {
        toast.error('Maximum students must be greater than 0');
        return;
      }

      if (
        formData.endDate &&
        new Date(formData.endDate) < new Date(formData.startDate)
      ) {
        toast.error('End date cannot be before start date');
        return;
      }

      const response = await fetch(`/api/batches/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update batch');
      }

      toast.success('Batch updated successfully');
      router.push(`/admin/batches/${params.id}`);
    } catch (error) {
      console.error('Error updating batch:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update batch'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'programId' || name === 'maxStudents' ? Number(value) : value,
    }));
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
          href={`/admin/batches/${params.id}`}
          className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
        >
          <ArrowLeft className='w-5 h-5' />
        </Link>
        <h1 className='text-2xl font-bold'>Edit Batch</h1>
      </div>

      <form onSubmit={handleSubmit} className='space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-2'>
            <label
              htmlFor='name'
              className='block text-sm font-medium text-gray-700'
            >
              Batch Name *
            </label>
            <input
              type='text'
              id='name'
              name='name'
              value={formData.name}
              onChange={handleChange}
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary'
              required
            />
          </div>

          <div className='space-y-2'>
            <label
              htmlFor='code'
              className='block text-sm font-medium text-gray-700'
            >
              Batch Code *
            </label>
            <input
              type='text'
              id='code'
              name='code'
              value={formData.code}
              onChange={handleChange}
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary'
              required
            />
          </div>

          <div className='space-y-2'>
            <label
              htmlFor='programId'
              className='block text-sm font-medium text-gray-700'
            >
              Program *
            </label>
            <select
              id='programId'
              name='programId'
              value={formData.programId}
              onChange={handleChange}
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary'
              required
            >
              <option value=''>Select a program</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name} ({program.code}) - {program.department.name}
                </option>
              ))}
            </select>
          </div>

          <div className='space-y-2'>
            <label
              htmlFor='maxStudents'
              className='block text-sm font-medium text-gray-700'
            >
              Maximum Students *
            </label>
            <input
              type='number'
              id='maxStudents'
              name='maxStudents'
              value={formData.maxStudents}
              onChange={handleChange}
              min='1'
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary'
              required
            />
          </div>

          <div className='space-y-2'>
            <label
              htmlFor='startDate'
              className='block text-sm font-medium text-gray-700'
            >
              Start Date *
            </label>
            <input
              type='date'
              id='startDate'
              name='startDate'
              value={formData.startDate}
              onChange={handleChange}
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary'
              required
            />
          </div>

          <div className='space-y-2'>
            <label
              htmlFor='endDate'
              className='block text-sm font-medium text-gray-700'
            >
              End Date
            </label>
            <input
              type='date'
              id='endDate'
              name='endDate'
              value={formData.endDate}
              onChange={handleChange}
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary'
            />
          </div>

          <div className='space-y-2'>
            <label
              htmlFor='status'
              className='block text-sm font-medium text-gray-700'
            >
              Status *
            </label>
            <select
              id='status'
              name='status'
              value={formData.status}
              onChange={handleChange}
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary'
              required
            >
              <option value='upcoming'>Upcoming</option>
              <option value='active'>Active</option>
              <option value='completed'>Completed</option>
            </select>
          </div>
        </div>

        <div className='space-y-2'>
          <label
            htmlFor='description'
            className='block text-sm font-medium text-gray-700'
          >
            Description
          </label>
          <textarea
            id='description'
            name='description'
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary'
          />
        </div>

        <div className='flex justify-end gap-4'>
          <Link
            href={`/admin/batches/${params.id}`}
            className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary'
          >
            Cancel
          </Link>
          <button
            type='submit'
            disabled={isSubmitting}
            className='px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
