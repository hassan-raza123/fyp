'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { batches_status } from '@prisma/client';

interface Student {
  id: number;
  rollNumber: string;
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface Section {
  id: number;
  name: string;
  courseOffering: {
    course: {
      name: string;
      code: string;
    };
  };
  faculty: {
    user: {
      first_name: string;
      last_name: string;
    };
  } | null;
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
    name: string;
    code: string;
    department: {
      name: string;
      code: string;
    };
  };
  students: Student[];
  sections: Section[];
  _count: {
    students: number;
    sections: number;
  };
}

export default function BatchDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBatchDetails();
  }, [params.id]);

  const fetchBatchDetails = async () => {
    try {
      const response = await fetch(`/api/batches/${params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch batch details');
      }
      const { data } = await response.json();
      setBatch(data);
    } catch (error) {
      console.error('Error fetching batch details:', error);
      toast.error('Failed to load batch details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this batch?')) {
      return;
    }

    try {
      const response = await fetch(`/api/batches/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete batch');
      }

      toast.success('Batch deleted successfully');
      router.push('/admin/batches');
    } catch (error) {
      console.error('Error deleting batch:', error);
      toast.error('Failed to delete batch');
    }
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className='text-center py-12'>
        <h2 className='text-2xl font-semibold text-gray-900'>
          Batch not found
        </h2>
        <p className='mt-2 text-gray-600'>
          The batch you're looking for doesn't exist or has been deleted.
        </p>
        <Link
          href='/admin/batches'
          className='mt-4 inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors'
        >
          <ArrowLeft className='w-5 h-5 mr-2' />
          Back to Batches
        </Link>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Link
            href='/admin/batches'
            className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
          >
            <ArrowLeft className='w-5 h-5' />
          </Link>
          <div>
            <h1 className='text-2xl font-bold'>{batch.name}</h1>
            <p className='text-gray-500'>{batch.code}</p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Link
            href={`/admin/batches/${batch.id}/edit`}
            className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
          >
            <Edit className='w-5 h-5 text-gray-500' />
          </Link>
          <button
            onClick={handleDelete}
            className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
          >
            <Trash2 className='w-5 h-5 text-red-500' />
          </button>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <div className='bg-white p-4 rounded-lg border'>
          <h3 className='text-sm font-medium text-gray-500'>Program</h3>
          <p className='mt-1 text-lg font-semibold'>{batch.program.name}</p>
          <p className='text-sm text-gray-500'>{batch.program.code}</p>
        </div>

        <div className='bg-white p-4 rounded-lg border'>
          <h3 className='text-sm font-medium text-gray-500'>Department</h3>
          <p className='mt-1 text-lg font-semibold'>
            {batch.program.department.name}
          </p>
          <p className='text-sm text-gray-500'>
            {batch.program.department.code}
          </p>
        </div>

        <div className='bg-white p-4 rounded-lg border'>
          <h3 className='text-sm font-medium text-gray-500'>Status</h3>
          <p className='mt-1'>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                batch.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : batch.status === 'completed'
                  ? 'bg-gray-100 text-gray-800'
                  : batch.status === 'upcoming'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
            </span>
          </p>
        </div>

        <div className='bg-white p-4 rounded-lg border'>
          <h3 className='text-sm font-medium text-gray-500'>Students</h3>
          <p className='mt-1 text-lg font-semibold'>{batch._count.students}</p>
          <p className='text-sm text-gray-500'>Max: {batch.maxStudents}</p>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='bg-white rounded-lg border'>
          <div className='p-4 border-b'>
            <h2 className='text-lg font-semibold'>Students</h2>
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b'>
                  <th className='px-6 py-3 text-left text-sm font-medium text-gray-500'>
                    Roll Number
                  </th>
                  <th className='px-6 py-3 text-left text-sm font-medium text-gray-500'>
                    Name
                  </th>
                  <th className='px-6 py-3 text-left text-sm font-medium text-gray-500'>
                    Email
                  </th>
                </tr>
              </thead>
              <tbody>
                {batch.students.map((student) => (
                  <tr key={student.id} className='border-b hover:bg-gray-50'>
                    <td className='px-6 py-4 text-sm font-medium'>
                      {student.rollNumber}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-500'>
                      {student.user.first_name} {student.user.last_name}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-500'>
                      {student.user.email}
                    </td>
                  </tr>
                ))}
                {batch.students.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className='px-6 py-4 text-sm text-gray-500 text-center'
                    >
                      No students enrolled
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className='bg-white rounded-lg border'>
          <div className='p-4 border-b'>
            <h2 className='text-lg font-semibold'>Sections</h2>
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b'>
                  <th className='px-6 py-3 text-left text-sm font-medium text-gray-500'>
                    Section
                  </th>
                  <th className='px-6 py-3 text-left text-sm font-medium text-gray-500'>
                    Course
                  </th>
                  <th className='px-6 py-3 text-left text-sm font-medium text-gray-500'>
                    Faculty
                  </th>
                </tr>
              </thead>
              <tbody>
                {batch.sections.map((section) => (
                  <tr key={section.id} className='border-b hover:bg-gray-50'>
                    <td className='px-6 py-4 text-sm font-medium'>
                      {section.name}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-500'>
                      {section.courseOffering.course.name} (
                      {section.courseOffering.course.code})
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-500'>
                      {section.faculty
                        ? `${section.faculty.user.first_name} ${section.faculty.user.last_name}`
                        : 'Not assigned'}
                    </td>
                  </tr>
                ))}
                {batch.sections.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className='px-6 py-4 text-sm text-gray-500 text-center'
                    >
                      No sections created
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {batch.description && (
        <div className='bg-white rounded-lg border p-4'>
          <h2 className='text-lg font-semibold mb-2'>Description</h2>
          <p className='text-gray-600'>{batch.description}</p>
        </div>
      )}
    </div>
  );
}
