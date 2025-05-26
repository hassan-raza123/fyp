'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Program {
  id: number;
  name: string;
  code: string;
  department: {
    id: number;
    name: string;
    code: string;
  };
}

export default function CreateBatchPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    programId: '',
    startDate: '',
    endDate: '',
    maxStudents: '',
    description: '',
    status: 'upcoming',
  });

  // Fetch programs for dropdown
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await fetch('/api/programs', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch programs');
        }

        const text = await response.text();
        if (!text) {
          throw new Error('Empty response from server');
        }

        const { data } = JSON.parse(text);
        if (Array.isArray(data)) {
          setPrograms(data);
        } else {
          console.error('Invalid programs data format:', data);
          toast.error('Failed to load programs');
        }
      } catch (error) {
        console.error('Error fetching programs:', error);
        toast.error('Failed to load programs');
      }
    };

    fetchPrograms();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate form data
      if (
        !formData.name ||
        !formData.code ||
        !formData.programId ||
        !formData.startDate ||
        !formData.endDate ||
        !formData.maxStudents
      ) {
        throw new Error('Please fill in all required fields');
      }

      // Validate dates
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      if (startDate >= endDate) {
        throw new Error('End date must be after start date');
      }

      // Validate maxStudents
      const maxStudentsNum = parseInt(formData.maxStudents);
      if (isNaN(maxStudentsNum) || maxStudentsNum <= 0) {
        throw new Error('Maximum students must be a positive number');
      }

      console.log('Sending batch creation request...');
      const response = await fetch('/api/batches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name.trim(),
          code: formData.code.trim(),
          programId: parseInt(formData.programId),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          maxStudents: maxStudentsNum,
          description: formData.description
            ? formData.description.trim()
            : null,
          status: formData.status,
        }),
      });

      console.log('Response status:', response.status);

      // First check if the response is ok
      if (!response.ok) {
        console.error('Response not OK:', response.status, response.statusText);
        const errorText = await response.text();
        console.log('Error response text:', errorText);

        let errorMessage = 'Failed to create batch';
        if (errorText) {
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            console.error('Error parsing error response:', e);
            // Use the raw text if parsing fails
            errorMessage = errorText || errorMessage;
          }
        }
        throw new Error(errorMessage);
      }

      // Now get the response text for successful response
      console.log('Getting response text...');
      const responseText = await response.text();
      console.log('Response text length:', responseText?.length);

      if (!responseText || responseText.trim() === '') {
        console.error('Empty response from server');
        throw new Error('Empty response from server');
      }

      try {
        // Try to parse the JSON response
        console.log('Parsing response JSON...');
        const data = JSON.parse(responseText);
        console.log('Response data:', data);

        if (!data.success) {
          throw new Error(data.error || 'Failed to create batch');
        }

        toast.success('Batch created successfully');
        router.push('/admin/batches');
      } catch (parseError) {
        console.error('Error parsing success response:', parseError);
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Error creating batch:', error);
      toast.error(error.message || 'Failed to create batch');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-4'>
        <Link
          href='/admin/batches'
          className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
        >
          <ArrowLeft className='w-5 h-5' />
        </Link>
        <h1 className='text-2xl font-bold'>Create New Batch</h1>
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
              placeholder='Enter batch name'
            />
          </div>

          <div className='space-y-2'>
            <label htmlFor='code' className='block text-sm font-medium'>
              Batch Code
            </label>
            <input
              type='text'
              id='code'
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
              className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
              required
              placeholder='Enter batch code'
            />
          </div>

          <div className='space-y-2'>
            <label htmlFor='programId' className='block text-sm font-medium'>
              Program
            </label>
            <select
              id='programId'
              value={formData.programId}
              onChange={(e) =>
                setFormData({ ...formData, programId: e.target.value })
              }
              className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
              required
            >
              <option value=''>Select Program</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.code} - {program.name} ({program.department.code})
                </option>
              ))}
            </select>
          </div>

          <div className='space-y-2'>
            <label htmlFor='status' className='block text-sm font-medium'>
              Status
            </label>
            <select
              id='status'
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
              required
            >
              <option value='upcoming'>Upcoming</option>
              <option value='active'>Active</option>
              <option value='inactive'>Inactive</option>
              <option value='completed'>Completed</option>
            </select>
          </div>

          <div className='space-y-2'>
            <label htmlFor='startDate' className='block text-sm font-medium'>
              Start Date
            </label>
            <input
              type='date'
              id='startDate'
              value={formData.startDate}
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
              value={formData.endDate}
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
                setFormData({ ...formData, maxStudents: e.target.value })
              }
              className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
              required
              min='1'
              placeholder='Enter maximum number of students'
            />
          </div>
        </div>

        <div className='space-y-2'>
          <label htmlFor='description' className='block text-sm font-medium'>
            Description (Optional)
          </label>
          <textarea
            id='description'
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={4}
            className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
            placeholder='Enter batch description'
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
            disabled={isLoading}
            className='px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isLoading ? 'Creating...' : 'Create Batch'}
          </button>
        </div>
      </form>
    </div>
  );
}
