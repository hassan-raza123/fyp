'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { batches_status } from '@prisma/client';

interface Batch {
  id: string;
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  status: batches_status;
  program: {
    name: string;
    code: string;
    department: {
      name: string;
      code: string;
    };
  };
  _count: {
    students: number;
    sections: number;
  };
}

export default function BatchesPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/batches');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch batches');
      }
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setBatches(result.data);
      } else {
        console.error('Invalid batches data format:', result);
        toast.error('Failed to load batches: Invalid data format');
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to fetch batches'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this batch?')) {
      return;
    }

    try {
      const response = await fetch(`/api/batches/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete batch');
      }

      toast.success('Batch deleted successfully');
      fetchBatches();
    } catch (error) {
      console.error('Error deleting batch:', error);
      toast.error('Failed to delete batch');
    }
  };

  const filteredBatches = batches.filter((batch) => {
    const matchesSearch =
      batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.program.department.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesStatus =
      selectedStatus === 'all' || batch.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  if (!mounted || isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[400px] bg-page'>
        <div 
          className='animate-spin rounded-full h-8 w-8 border-2 border-t-transparent'
          style={{
            borderTopColor: isDarkMode ? 'var(--orange)' : 'var(--blue)',
            borderBottomColor: isDarkMode ? 'var(--orange)' : 'var(--blue)',
            borderRightColor: 'transparent',
            borderLeftColor: 'transparent',
          }}
        ></div>
      </div>
    );
  }

  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const primaryColorDark = isDarkMode ? 'var(--orange-dark)' : 'var(--blue-dark)';

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold text-primary-text'>Batches</h1>
        <Link
          href='/admin/batches/create'
          className='flex items-center px-4 py-2 text-white rounded-lg transition-colors'
          style={{
            backgroundColor: primaryColor,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = primaryColorDark;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = primaryColor;
          }}
        >
          <Plus className='w-5 h-5 mr-2' />
          Create Batch
        </Link>
      </div>

      <div className='flex flex-col md:flex-row gap-4'>
        <div className='relative flex-1'>
          <Search
            className='absolute left-3 top-1/2 -translate-y-1/2'
            size={20}
            style={{ color: 'var(--muted-text)' }}
          />
          <input
            type='text'
            placeholder='Search batches...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none transition-colors bg-card border border-card-border text-primary-text'
            style={{
              focusRingColor: primaryColor,
            }}
          />
        </div>
        <div className='flex gap-2'>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className='px-4 py-2 rounded-lg focus:outline-none transition-colors bg-card border border-card-border text-primary-text'
            style={{
              focusRingColor: primaryColor,
            }}
          >
            <option value='all'>All Status</option>
            <option value='active'>Active</option>
            <option value='completed'>Completed</option>
            <option value='upcoming'>Upcoming</option>
          </select>
          <button 
            className='px-4 py-2 rounded-lg transition-colors border border-card-border'
            style={{
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Filter size={20} style={{ color: 'var(--muted-text)' }} />
          </button>
          <button 
            className='px-4 py-2 rounded-lg transition-colors border border-card-border'
            style={{
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Download size={20} style={{ color: 'var(--muted-text)' }} />
          </button>
        </div>
      </div>

      <div className='bg-card rounded-lg border border-card-border'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b' style={{ borderColor: 'var(--border-color)' }}>
                <th className='px-6 py-3 text-left text-sm font-medium text-secondary-text'>
                  Name
                </th>
                <th className='px-6 py-3 text-left text-sm font-medium text-secondary-text'>
                  Code
                </th>
                <th className='px-6 py-3 text-left text-sm font-medium text-secondary-text'>
                  Program
                </th>
                <th className='px-6 py-3 text-left text-sm font-medium text-secondary-text'>
                  Department
                </th>
                <th className='px-6 py-3 text-left text-sm font-medium text-secondary-text'>
                  Start Date
                </th>
                <th className='px-6 py-3 text-left text-sm font-medium text-secondary-text'>
                  End Date
                </th>
                <th className='px-6 py-3 text-left text-sm font-medium text-secondary-text'>
                  Status
                </th>
                <th className='px-6 py-3 text-left text-sm font-medium text-secondary-text'>
                  Students
                </th>
                <th className='px-6 py-3 text-left text-sm font-medium text-secondary-text'>
                  Sections
                </th>
                <th className='px-6 py-3 text-left text-sm font-medium text-secondary-text'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.map((batch) => (
                <tr 
                  key={batch.id} 
                  className='border-b transition-colors'
                  style={{ 
                    borderColor: 'var(--border-color)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <td className='px-6 py-4 text-sm font-medium text-primary-text'>
                    {batch.name}
                  </td>
                  <td className='px-6 py-4 text-sm text-secondary-text'>
                    {batch.code}
                  </td>
                  <td className='px-6 py-4 text-sm text-secondary-text'>
                    {batch.program.name}
                  </td>
                  <td className='px-6 py-4 text-sm text-secondary-text'>
                    {batch.program.department.name}
                  </td>
                  <td className='px-6 py-4 text-sm text-secondary-text'>
                    {batch.startDate
                      ? new Date(batch.startDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'N/A'}
                  </td>
                  <td className='px-6 py-4 text-sm text-secondary-text'>
                    {batch.endDate
                      ? new Date(batch.endDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'N/A'}
                  </td>
                  <td className='px-6 py-4'>
                    <span
                      className='px-2 py-1 text-xs font-medium rounded-full'
                      style={{
                        backgroundColor: batch.status === 'active'
                          ? 'var(--success-green-opacity-20)'
                          : batch.status === 'completed'
                          ? 'var(--brand-primary-opacity-10)'
                          : batch.status === 'upcoming'
                          ? isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)'
                          : 'var(--brand-primary-opacity-10)',
                        color: batch.status === 'active'
                          ? 'var(--success-green)'
                          : batch.status === 'completed'
                          ? primaryColor
                          : batch.status === 'upcoming'
                          ? primaryColor
                          : primaryColor,
                      }}
                    >
                      {batch.status.charAt(0).toUpperCase() +
                        batch.status.slice(1)}
                    </span>
                  </td>
                  <td className='px-6 py-4 text-sm text-secondary-text'>
                    {batch._count.students}
                  </td>
                  <td className='px-6 py-4 text-sm text-secondary-text'>
                    {batch._count.sections}
                  </td>
                  <td className='px-6 py-4'>
                    <div className='flex items-center gap-2'>
                      <Link
                        href={`/admin/batches/${batch.id}`}
                        className='p-1 rounded-lg transition-colors'
                        style={{
                          backgroundColor: 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Eye size={18} style={{ color: 'var(--muted-text)' }} />
                      </Link>
                      <Link
                        href={`/admin/batches/${batch.id}/edit`}
                        className='p-1 rounded-lg transition-colors'
                        style={{
                          backgroundColor: 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Edit size={18} style={{ color: 'var(--muted-text)' }} />
                      </Link>
                      <button
                        onClick={() => handleDelete(batch.id)}
                        className='p-1 rounded-lg transition-colors'
                        style={{
                          backgroundColor: 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Trash2 size={18} style={{ color: 'var(--error)' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
