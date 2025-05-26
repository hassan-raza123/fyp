'use client';

import React, { useState, useEffect } from 'react';
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

interface Batch {
  id: string;
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive' | 'completed' | 'upcoming';
  program: {
    name: string;
    code: string;
  };
  _count: {
    students: number;
  };
}

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/batches');
      if (!response.ok) {
        throw new Error('Failed to fetch batches');
      }
      const { data } = await response.json();
      if (Array.isArray(data)) {
        setBatches(data);
      } else {
        console.error('Invalid batches data format:', data);
        toast.error('Failed to load batches');
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast.error('Failed to fetch batches');
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
      batch.program.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      selectedStatus === 'all' || batch.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Batches</h1>
        <Link
          href='/admin/batches/create'
          className='flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors'
        >
          <Plus className='w-5 h-5 mr-2' />
          Create Batch
        </Link>
      </div>

      <div className='flex flex-col md:flex-row gap-4'>
        <div className='relative flex-1'>
          <Search
            className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
            size={20}
          />
          <input
            type='text'
            placeholder='Search batches...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
          />
        </div>
        <div className='flex gap-2'>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className='px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
          >
            <option value='all'>All Status</option>
            <option value='active'>Active</option>
            <option value='inactive'>Inactive</option>
            <option value='completed'>Completed</option>
            <option value='upcoming'>Upcoming</option>
          </select>
          <button className='px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors'>
            <Filter size={20} />
          </button>
          <button className='px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors'>
            <Download size={20} />
          </button>
        </div>
      </div>

      <div className='bg-white rounded-lg border'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b'>
                <th className='px-6 py-3 text-left text-sm font-medium text-gray-500'>
                  Name
                </th>
                <th className='px-6 py-3 text-left text-sm font-medium text-gray-500'>
                  Code
                </th>
                <th className='px-6 py-3 text-left text-sm font-medium text-gray-500'>
                  Program
                </th>
                <th className='px-6 py-3 text-left text-sm font-medium text-gray-500'>
                  Start Date
                </th>
                <th className='px-6 py-3 text-left text-sm font-medium text-gray-500'>
                  End Date
                </th>
                <th className='px-6 py-3 text-left text-sm font-medium text-gray-500'>
                  Status
                </th>
                <th className='px-6 py-3 text-left text-sm font-medium text-gray-500'>
                  Students
                </th>
                <th className='px-6 py-3 text-left text-sm font-medium text-gray-500'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.map((batch) => (
                <tr key={batch.id} className='border-b hover:bg-gray-50'>
                  <td className='px-6 py-4 text-sm font-medium'>
                    {batch.name}
                  </td>
                  <td className='px-6 py-4 text-sm text-gray-500'>
                    {batch.code}
                  </td>
                  <td className='px-6 py-4 text-sm text-gray-500'>
                    {batch.program.name}
                  </td>
                  <td className='px-6 py-4 text-sm text-gray-500'>
                    {new Date(batch.startDate).toLocaleDateString()}
                  </td>
                  <td className='px-6 py-4 text-sm text-gray-500'>
                    {new Date(batch.endDate).toLocaleDateString()}
                  </td>
                  <td className='px-6 py-4'>
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
                      {batch.status.charAt(0).toUpperCase() +
                        batch.status.slice(1)}
                    </span>
                  </td>
                  <td className='px-6 py-4 text-sm text-gray-500'>
                    {batch._count.students}
                  </td>
                  <td className='px-6 py-4'>
                    <div className='flex items-center gap-2'>
                      <Link
                        href={`/admin/batches/${batch.id}`}
                        className='p-1 hover:bg-gray-100 rounded-lg transition-colors'
                      >
                        <Eye size={18} className='text-gray-500' />
                      </Link>
                      <Link
                        href={`/admin/batches/${batch.id}/edit`}
                        className='p-1 hover:bg-gray-100 rounded-lg transition-colors'
                      >
                        <Edit size={18} className='text-gray-500' />
                      </Link>
                      <button
                        onClick={() => handleDelete(batch.id)}
                        className='p-1 hover:bg-gray-100 rounded-lg transition-colors'
                      >
                        <Trash2 size={18} className='text-red-500' />
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
