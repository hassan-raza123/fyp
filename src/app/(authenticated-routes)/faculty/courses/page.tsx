'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Course {
  id: number;
  code: string;
  name: string;
  creditHours: number;
  type: 'THEORY' | 'LAB' | 'PROJECT' | 'THESIS';
  department: {
    id: number;
    name: string;
    code: string;
  };
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  prerequisites: {
    prerequisite: {
      id: number;
      code: string;
      name: string;
    };
  }[];
  corequisites: {
    corequisite: {
      id: number;
      code: string;
      name: string;
    };
  }[];
}

interface Department {
  id: number;
  name: string;
  code: string;
}

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState<string>('all');
  const [type, setType] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [search, departmentId, type, status, page]);

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

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (search) params.append('search', search);
      if (departmentId && departmentId !== 'all')
        params.append('departmentId', departmentId);
      if (type && type !== 'all') params.append('type', type);
      if (status && status !== 'all') params.append('status', status);

      const response = await fetch(`/api/courses?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      const data = await response.json();
      if (data.success) {
        setCourses(data.data);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCourse) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/courses/${selectedCourse.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete course');
      }

      toast.success('Course deleted successfully');
      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete course'
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setSelectedCourse(null);
    }
  };

  const getTypeBadge = (type: 'THEORY' | 'LAB' | 'PROJECT' | 'THESIS') => {
    switch (type) {
      case 'THEORY':
        return <Badge variant='default'>Theory</Badge>;
      case 'LAB':
        return <Badge variant='success'>Lab</Badge>;
      case 'PROJECT':
        return <Badge variant='secondary'>Project</Badge>;
      case 'THESIS':
        return <Badge variant='destructive'>Thesis</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const getStatusBadge = (status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED') => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant='success'>Active</Badge>;
      case 'INACTIVE':
        return <Badge variant='secondary'>Inactive</Badge>;
      case 'ARCHIVED':
        return <Badge variant='destructive'>Archived</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className='container mx-auto py-10'>
        <div className='text-center'>Loading...</div>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-10'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-3xl font-bold'>Courses</h1>
        <Button onClick={() => router.push('/admin/courses/create')}>
          <Plus className='mr-2 h-4 w-4' />
          Create Course
        </Button>
      </div>

      <div className='flex gap-4 mb-6'>
        <div className='flex-1'>
          <div className='relative'>
            <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Search courses...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-8'
            />
          </div>
        </div>
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
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Course Type' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Types</SelectItem>
            <SelectItem value='THEORY'>Theory</SelectItem>
            <SelectItem value='LAB'>Lab</SelectItem>
            <SelectItem value='PROJECT'>Project</SelectItem>
            <SelectItem value='THESIS'>Thesis</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Status</SelectItem>
            <SelectItem value='ACTIVE'>Active</SelectItem>
            <SelectItem value='INACTIVE'>Inactive</SelectItem>
            <SelectItem value='ARCHIVED'>Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Credit Hours</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((course) => (
              <TableRow key={course.id}>
                <TableCell>{course.code}</TableCell>
                <TableCell>{course.name}</TableCell>
                <TableCell>
                  {course.department.name} ({course.department.code})
                </TableCell>
                <TableCell>{course.creditHours}</TableCell>
                <TableCell>{getTypeBadge(course.type)}</TableCell>
                <TableCell>{getStatusBadge(course.status)}</TableCell>
                <TableCell>
                  <div className='flex gap-2'>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => router.push(`/admin/courses/${course.id}`)}
                    >
                      <Eye className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() =>
                        router.push(`/admin/courses/${course.id}/edit`)
                      }
                    >
                      <Edit className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => {
                        setSelectedCourse(course);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className='flex justify-center mt-4'>
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

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              course "{selectedCourse?.name}" and all its associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Course'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
