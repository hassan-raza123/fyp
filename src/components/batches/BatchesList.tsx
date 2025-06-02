'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PlusCircle,
  Search,
  Filter,
  Loader2,
  Users,
  CalendarClock,
  BookOpen,
  Pencil,
  Trash,
  Eye,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Batch {
  id: number;
  name: string;
  code: string;
  status: string;
  startDate: string;
  endDate?: string | null;
  program_name?: string;
  program_code?: string;
  programId: number;
  student_count: number;
}

export default function BatchesList() {
  const router = useRouter();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [programs, setPrograms] = useState<
    { id: number; name: string; code: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Fetch batches
  const fetchBatches = async () => {
    setLoading(true);
    try {
      let url = '/api/batches?';

      if (searchTerm) {
        url += `search=${encodeURIComponent(searchTerm)}&`;
      }

      if (selectedProgram) {
        url += `programId=${selectedProgram}&`;
      }

      if (selectedStatus) {
        url += `status=${selectedStatus}&`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch batches');
      }

      const data = await response.json();
      setBatches(data);
    } catch (err) {
      console.error('Error fetching batches:', err);
      setError('Failed to load batches. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch programs for filter
  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/programs');

      if (!response.ok) {
        throw new Error('Failed to fetch programs');
      }

      const data = await response.json();
      setPrograms(data);
    } catch (err) {
      console.error('Error fetching programs:', err);
    }
  };

  useEffect(() => {
    fetchPrograms();
    fetchBatches();
  }, []);

  // Apply filters when they change
  useEffect(() => {
    fetchBatches();
  }, [searchTerm, selectedProgram, selectedStatus]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this batch?')) {
      return;
    }

    try {
      const response = await fetch(`/api/batches/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete batch');
      }

      // Remove the deleted batch from state
      setBatches(batches.filter((batch) => batch.id !== id));
    } catch (err: any) {
      console.error('Error deleting batch:', err);
      alert(err.message || 'Failed to delete batch');
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get badge color based on status
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      case 'upcoming':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  return (
    <div>
      {/* Header with actions */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4'>
        {/* Search input */}
        <div className='relative w-full sm:w-auto sm:min-w-[300px]'>
          <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search batches...'
            className='pl-8 w-full sm:w-auto sm:min-w-[300px]'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className='flex flex-col sm:flex-row gap-3 w-full sm:w-auto'>
          <Select value={selectedProgram} onValueChange={setSelectedProgram}>
            <SelectTrigger className='w-full sm:w-[180px]'>
              <SelectValue placeholder='Program' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=''>All Programs</SelectItem>
              {programs.map((program) => (
                <SelectItem key={program.id} value={program.id.toString()}>
                  {program.code} - {program.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className='w-full sm:w-[150px]'>
              <SelectValue placeholder='Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=''>All Statuses</SelectItem>
              <SelectItem value='active'>Active</SelectItem>
              <SelectItem value='inactive'>Inactive</SelectItem>
              <SelectItem value='completed'>Completed</SelectItem>
              <SelectItem value='upcoming'>Upcoming</SelectItem>
            </SelectContent>
          </Select>

          <Button variant='default' asChild>
            <Link href='/admin/batches/create'>
              <PlusCircle className='mr-2 h-4 w-4' />
              New Batch
            </Link>
          </Button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className='rounded-md bg-red-50 p-4 mb-6 text-red-700'>
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className='flex justify-center items-center py-12'>
          <Loader2 className='h-8 w-8 animate-spin text-primary' />
        </div>
      )}

      {/* Empty state */}
      {!loading && batches.length === 0 && (
        <div className='text-center py-12 border rounded-lg'>
          <BookOpen className='mx-auto h-12 w-12 text-muted-foreground' />
          <h3 className='mt-4 text-lg font-medium'>No batches found</h3>
          <p className='mt-2 text-muted-foreground'>
            Get started by creating a new batch
          </p>
          <Button variant='outline' className='mt-4' asChild>
            <Link href='/admin/batches/create'>
              <PlusCircle className='mr-2 h-4 w-4' />
              Create New Batch
            </Link>
          </Button>
        </div>
      )}

      {/* Batches grid */}
      {!loading && batches.length > 0 && (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {batches.map((batch) => (
            <Card key={batch.id} className='overflow-hidden'>
              <CardHeader className='pb-3'>
                <div className='flex justify-between'>
                  <Badge
                    variant='outline'
                    className={`${getStatusBadge(batch.status)}`}
                  >
                    {batch.status}
                  </Badge>
                  <div className='flex space-x-1'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => router.push(`/admin/batches/${batch.id}`)}
                    >
                      <Eye className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() =>
                        router.push(`/admin/batches/${batch.id}/edit`)
                      }
                    >
                      <Pencil className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleDelete(batch.id)}
                    >
                      <Trash className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
                <CardTitle className='mt-2'>{batch.name}</CardTitle>
                <CardDescription>Code: {batch.code}</CardDescription>
              </CardHeader>
              <CardContent className='pb-2'>
                <div className='space-y-2'>
                  <div className='flex items-center'>
                    <BookOpen className='h-4 w-4 mr-2 text-muted-foreground' />
                    <span className='text-sm'>
                      {batch.program_code} - {batch.program_name}
                    </span>
                  </div>
                  <div className='flex items-center'>
                    <CalendarClock className='h-4 w-4 mr-2 text-muted-foreground' />
                    <span className='text-sm'>
                      {formatDate(batch.startDate)}
                      {batch.endDate
                        ? ` - ${formatDate(batch.endDate)}`
                        : ' - Ongoing'}
                    </span>
                  </div>
                  <div className='flex items-center'>
                    <Users className='h-4 w-4 mr-2 text-muted-foreground' />
                    <span className='text-sm'>
                      {batch.student_count} Students
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className='pt-3 border-t flex justify-end'>
                <Button size='sm' variant='outline' asChild>
                  <Link href={`/admin/batches/${batch.id}/students`}>
                    <Users className='h-4 w-4 mr-2' />
                    Manage Students
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
