'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { semester_status } from '@prisma/client';

interface Semester {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: semester_status;
  description?: string;
  _count: {
    courseOfferings: number;
  };
}

export default function SemestersPage() {
  const router = useRouter();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchSemesters();
  }, [search, status, page]);

  const fetchSemesters = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (search) params.append('search', search);
      if (status && status !== 'all') params.append('status', status);

      const response = await fetch(`/api/semesters?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch semesters');
      }
      const data = await response.json();
      if (data.success) {
        setSemesters(data.data);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching semesters:', error);
      toast.error('Failed to fetch semesters');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this semester?')) return;

    try {
      const response = await fetch(`/api/semesters?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete semester');
      }

      toast.success('Semester deleted successfully');
      fetchSemesters();
    } catch (error) {
      console.error('Error deleting semester:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete semester'
      );
    }
  };

  const getStatusBadge = (status: semester_status) => {
    switch (status) {
      case semester_status.active:
        return <Badge variant='success'>Active</Badge>;
      case semester_status.inactive:
        return <Badge variant='secondary'>Inactive</Badge>;
      case semester_status.completed:
        return <Badge variant='destructive'>Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className='container mx-auto py-10'>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-3xl font-bold'>Semesters</h1>
          <p className='text-muted-foreground'>
            Manage academic semesters and their details
          </p>
        </div>
        <Button onClick={() => router.push('/admin/semesters/new')}>
          <Plus className='mr-2 h-4 w-4' />
          Create Semester
        </Button>
      </div>

      <Card className='p-6 mb-6'>
        <div className='flex flex-col md:flex-row gap-4'>
          <div className='flex-1'>
            <div className='relative'>
              <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search semesters...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='pl-8'
              />
            </div>
          </div>
          <div className='flex gap-4'>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='Status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Status</SelectItem>
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
        </div>
      </Card>

      <Card>
        <div className='relative w-full overflow-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Course Offerings</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className='text-center'>
                    Loading...
                  </TableCell>
                </TableRow>
              ) : semesters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='text-center'>
                    No semesters found
                  </TableCell>
                </TableRow>
              ) : (
                semesters.map((semester) => (
                  <TableRow key={semester.id}>
                    <TableCell className='font-medium'>
                      {semester.name}
                    </TableCell>
                    <TableCell>
                      {format(new Date(semester.startDate), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {format(new Date(semester.endDate), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>{getStatusBadge(semester.status)}</TableCell>
                    <TableCell>{semester._count.courseOfferings}</TableCell>
                    <TableCell className='text-right'>
                      <Button
                        variant='ghost'
                        onClick={() =>
                          router.push(`/admin/semesters/${semester.id}`)
                        }
                      >
                        Edit
                      </Button>
                      <Button
                        variant='ghost'
                        className='text-red-600 hover:text-red-700'
                        onClick={() => handleDelete(semester.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className='flex items-center justify-end space-x-2 p-4'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
