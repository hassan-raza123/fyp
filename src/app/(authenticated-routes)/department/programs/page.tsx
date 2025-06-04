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

interface Program {
  id: number;
  name: string;
  code: string;
  department: {
    id: number;
    name: string;
    code: string;
  };
  totalCreditHours: number;
  duration: number;
  status: string;
  _count: {
    students: number;
    courses: number;
  };
}

interface Department {
  id: number;
  name: string;
  code: string;
}

export default function ProgramsPage() {
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchPrograms();
  }, [search, departmentId, status, page]);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }
      const data = await response.json();
      if (data.success) {
        setDepartments(data.data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to fetch departments');
    }
  };

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (search) params.append('search', search);
      if (departmentId && departmentId !== 'all')
        params.append('departmentId', departmentId);
      if (status && status !== 'all') params.append('status', status);

      const response = await fetch(`/api/programs?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch programs');
      }
      const data = await response.json();
      if (data.success) {
        setPrograms(data.data);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
      toast.error('Failed to fetch programs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this program?')) return;

    try {
      const response = await fetch(`/api/programs/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete program');
      }

      toast.success('Program deleted successfully');
      fetchPrograms();
    } catch (error) {
      console.error('Error deleting program:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete program'
      );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant='success'>Active</Badge>;
      case 'inactive':
        return <Badge variant='secondary'>Inactive</Badge>;
      case 'archived':
        return <Badge variant='destructive'>Archived</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className='container mx-auto py-10'>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-3xl font-bold'>Programs</h1>
          <p className='text-muted-foreground'>
            Manage academic programs and their details
          </p>
        </div>
        <Button onClick={() => router.push('/admin/programs/new')}>
          <Plus className='mr-2 h-4 w-4' />
          Create Program
        </Button>
      </div>

      <Card className='p-6 mb-6'>
        <div className='flex flex-col md:flex-row gap-4'>
          <div className='flex-1'>
            <div className='relative'>
              <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search programs...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='pl-8'
              />
            </div>
          </div>
          <div className='flex gap-4'>
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='Department' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='Status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Status</SelectItem>
                <SelectItem value='active'>Active</SelectItem>
                <SelectItem value='inactive'>Inactive</SelectItem>
                <SelectItem value='archived'>Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Program ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Credit Hours</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Courses</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className='text-center'>
                  Loading...
                </TableCell>
              </TableRow>
            ) : programs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className='text-center'>
                  No programs found
                </TableCell>
              </TableRow>
            ) : (
              programs.map((program) => (
                <TableRow key={program.id}>
                  <TableCell>{program.id}</TableCell>
                  <TableCell>{program.name}</TableCell>
                  <TableCell>{program.code}</TableCell>
                  <TableCell>
                    {program.department.name} ({program.department.code})
                  </TableCell>
                  <TableCell>{program.totalCreditHours}</TableCell>
                  <TableCell>{program.duration} years</TableCell>
                  <TableCell>{program._count.courses}</TableCell>
                  <TableCell>{program._count.students}</TableCell>
                  <TableCell>{getStatusBadge(program.status)}</TableCell>
                  <TableCell>
                    <div className='flex gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() =>
                          router.push(`/admin/programs/${program.id}`)
                        }
                      >
                        View
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() =>
                          router.push(`/admin/programs/${program.id}/edit`)
                        }
                      >
                        Edit
                      </Button>
                      <Button
                        variant='destructive'
                        size='sm'
                        onClick={() => handleDelete(program.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {totalPages > 1 && (
        <div className='flex justify-center mt-6'>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant='outline'
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
