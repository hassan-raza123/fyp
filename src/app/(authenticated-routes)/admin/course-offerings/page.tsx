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
import { course_offering_status } from '@prisma/client';

interface CourseOffering {
  id: number;
  course: {
    id: number;
    code: string;
    name: string;
  };
  semester: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
  };
  status: course_offering_status;
  _count: {
    sections: number;
  };
}

export default function CourseOfferingsPage() {
  const router = useRouter();
  const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');

  const fetchCourseOfferings = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(status && { status }),
      });

      const response = await fetch(`/api/courses/offerings?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        setCourseOfferings(data.data);
        setTotalPages(data.pagination.totalPages);
      } else {
        toast.error(data.error || 'Failed to fetch course offerings');
      }
    } catch (error) {
      toast.error('Failed to fetch course offerings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseOfferings();
  }, [page, search, status]);

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPage(1);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const getStatusColor = (status: course_offering_status) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className='container mx-auto py-10'>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-3xl font-bold'>Course Offerings</h1>
          <p className='text-muted-foreground'>
            Manage course offerings for each semester
          </p>
        </div>
        <Button onClick={() => router.push('/admin/course-offerings/create')}>
          <Plus className='mr-2 h-4 w-4' />
          Create Course Offering
        </Button>
      </div>

      <Card className='p-6'>
        <div className='flex gap-4 mb-6'>
          <div className='flex-1'>
            <div className='relative'>
              <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search by course code or name...'
                className='pl-8'
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Filter by status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Status</SelectItem>
              <SelectItem value='active'>Active</SelectItem>
              <SelectItem value='inactive'>Inactive</SelectItem>
              <SelectItem value='cancelled'>Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sections</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className='text-center'>
                    Loading...
                  </TableCell>
                </TableRow>
              ) : courseOfferings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='text-center'>
                    No course offerings found
                  </TableCell>
                </TableRow>
              ) : (
                courseOfferings.map((offering) => (
                  <TableRow key={offering.id}>
                    <TableCell>
                      <div>
                        <div className='font-medium'>
                          {offering.course.code}
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          {offering.course.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className='font-medium'>
                          {offering.semester.name}
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          {format(
                            new Date(offering.semester.startDate),
                            'MMM d, yyyy'
                          )}{' '}
                          -{' '}
                          {format(
                            new Date(offering.semester.endDate),
                            'MMM d, yyyy'
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(
                        new Date(offering.semester.startDate),
                        'MMM d, yyyy'
                      )}{' '}
                      -{' '}
                      {format(
                        new Date(offering.semester.endDate),
                        'MMM d, yyyy'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(offering.status)}>
                        {offering.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{offering._count.sections}</TableCell>
                    <TableCell>
                      <Button
                        variant='ghost'
                        onClick={() =>
                          router.push(`/admin/course-offerings/${offering.id}`)
                        }
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className='flex justify-center gap-2 mt-4'>
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
        )}
      </Card>
    </div>
  );
}
