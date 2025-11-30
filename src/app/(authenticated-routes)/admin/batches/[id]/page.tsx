'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
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
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  
  const router = useRouter();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted || isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2' style={{ borderTopColor: 'var(--blue)', borderBottomColor: 'var(--blue)' }}></div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className='text-center py-12'>
        <h2 className='text-2xl font-semibold text-primary-text'>
          Batch not found
        </h2>
        <p className='mt-2 text-secondary-text'>
          The batch you're looking for doesn't exist or has been deleted.
        </p>
        <Link
          href='/admin/batches'
          className='mt-4 inline-flex items-center px-4 py-2 rounded-lg transition-colors'
          style={{ backgroundColor: 'var(--blue)', color: 'var(--white)' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--blue-dark)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--blue)'}
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
            <h1 className='text-2xl font-bold text-primary-text'>{batch.name}</h1>
            <p className='text-secondary-text'>{batch.code}</p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Link
            href={`/admin/batches/${batch.id}/edit`}
            className='p-2 rounded-lg transition-colors'
            style={{ backgroundColor: 'transparent' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Edit className='w-5 h-5' style={{ color: 'var(--text-secondary)' }} />
          </Link>
          <button
            onClick={handleDelete}
            className='p-2 rounded-lg transition-colors'
            style={{ backgroundColor: 'transparent' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Trash2 className='w-5 h-5' style={{ color: 'var(--error)' }} />
          </button>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <div className='bg-card p-4 rounded-lg border border-card-border'>
          <h3 className='text-sm font-medium text-secondary-text'>Program</h3>
          <p className='mt-1 text-lg font-semibold text-primary-text'>{batch.program.name}</p>
          <p className='text-sm text-secondary-text'>{batch.program.code}</p>
        </div>

        <div className='bg-card p-4 rounded-lg border border-card-border'>
          <h3 className='text-sm font-medium text-secondary-text'>Department</h3>
          <p className='mt-1 text-lg font-semibold text-primary-text'>
            {batch.program.department.name}
          </p>
          <p className='text-sm text-secondary-text'>
            {batch.program.department.code}
          </p>
        </div>

        <div className='bg-card p-4 rounded-lg border border-card-border'>
          <h3 className='text-sm font-medium text-secondary-text'>Status</h3>
          <p className='mt-1'>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                batch.status === 'active'
                  ? 'bg-[var(--success-green)] text-white'
                  : batch.status === 'completed'
                  ? 'bg-[var(--gray-500)] text-white'
                  : batch.status === 'upcoming'
                  ? 'bg-[var(--blue)] text-white'
                  : 'bg-[var(--gray-500)] text-white'
              }`}
            >
              {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
            </span>
          </p>
        </div>

        <div className='bg-card p-4 rounded-lg border border-card-border'>
          <h3 className='text-sm font-medium text-secondary-text'>Students</h3>
          <p className='mt-1 text-lg font-semibold text-primary-text'>{batch._count.students}</p>
          <p className='text-sm text-secondary-text'>Max: {batch.maxStudents}</p>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='bg-card rounded-lg border border-card-border'>
          <div className='p-4 border-b border-card-border'>
            <h2 className='text-lg font-semibold text-primary-text'>Students</h2>
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-card-border'>
                  <th className='px-6 py-3 text-left text-sm font-medium text-secondary-text'>
                    Roll Number
                  </th>
                  <th className='px-6 py-3 text-left text-sm font-medium text-secondary-text'>
                    Name
                  </th>
                  <th className='px-6 py-3 text-left text-sm font-medium text-secondary-text'>
                    Email
                  </th>
                </tr>
              </thead>
              <tbody>
                {batch.students.map((student) => (
                  <tr 
                    key={student.id} 
                    className='border-b border-card-border'
                    style={{ backgroundColor: 'transparent' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td className='px-6 py-4 text-sm font-medium text-primary-text'>
                      {student.rollNumber}
                    </td>
                    <td className='px-6 py-4 text-sm text-secondary-text'>
                      {student.user.first_name} {student.user.last_name}
                    </td>
                    <td className='px-6 py-4 text-sm text-secondary-text'>
                      {student.user.email}
                    </td>
                  </tr>
                ))}
                {batch.students.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className='px-6 py-4 text-sm text-secondary-text text-center'
                    >
                      No students enrolled
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className='bg-card rounded-lg border border-card-border'>
          <div className='p-4 border-b border-card-border'>
            <h2 className='text-lg font-semibold text-primary-text'>Sections</h2>
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-card-border'>
                  <th className='px-6 py-3 text-left text-sm font-medium text-secondary-text'>
                    Section
                  </th>
                  <th className='px-6 py-3 text-left text-sm font-medium text-secondary-text'>
                    Course
                  </th>
                  <th className='px-6 py-3 text-left text-sm font-medium text-secondary-text'>
                    Faculty
                  </th>
                </tr>
              </thead>
              <tbody>
                {batch.sections.map((section) => (
                  <tr 
                    key={section.id} 
                    className='border-b border-card-border'
                    style={{ backgroundColor: 'transparent' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td className='px-6 py-4 text-sm font-medium text-primary-text'>
                      {section.name}
                    </td>
                    <td className='px-6 py-4 text-sm text-secondary-text'>
                      {section.courseOffering.course.name} (
                      {section.courseOffering.course.code})
                    </td>
                    <td className='px-6 py-4 text-sm text-secondary-text'>
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
                      className='px-6 py-4 text-sm text-secondary-text text-center'
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
        <div className='bg-card rounded-lg border border-card-border p-4'>
          <h2 className='text-lg font-semibold mb-2 text-primary-text'>Description</h2>
          <p className='text-secondary-text'>{batch.description}</p>
        </div>
      )}
    </div>
  );
}
