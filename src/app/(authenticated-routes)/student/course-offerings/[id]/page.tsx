'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, ArrowLeft, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { course_offering_status } from '@prisma/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CreateSectionDialog } from '@/components/sections/create-section-dialog';

interface CourseOffering {
  id: number;
  course: {
    id: number;
    code: string;
    name: string;
    description: string | null;
    creditHours: number;
    type: 'THEORY' | 'LAB' | 'PROJECT' | 'THESIS';
    department: {
      id: number;
      name: string;
      code: string;
    };
  };
  semester: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
  };
  status: course_offering_status;
  sections: {
    id: number;
    name: string;
    maxStudents: number;
    currentStudents: number;
    faculty: {
      id: number;
      user: {
        first_name: string;
        last_name: string;
        email: string;
      };
    } | null;
  }[];
}

export default function CourseOfferingDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [courseOffering, setCourseOffering] = useState<CourseOffering | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCourseOffering = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses/offerings/${params.id}`);
      const data = await response.json();

      if (data.success) {
        setCourseOffering(data.data);
      } else {
        toast.error(data.error || 'Failed to fetch course offering');
        router.push('/admin/course-offerings');
      }
    } catch (error) {
      toast.error('Failed to fetch course offering');
      router.push('/admin/course-offerings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseOffering();
  }, [params.id]);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/courses/offerings?id=${params.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Course offering deleted successfully');
        router.push('/admin/course-offerings');
      } else {
        toast.error(data.error || 'Failed to delete course offering');
      }
    } catch (error) {
      toast.error('Failed to delete course offering');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
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

  if (loading) {
    return (
      <div className='container mx-auto py-10'>
        <div className='flex items-center justify-center h-64'>
          <p className='text-muted-foreground'>Loading...</p>
        </div>
      </div>
    );
  }

  if (!courseOffering) {
    return (
      <div className='container mx-auto py-10'>
        <div className='flex items-center justify-center h-64'>
          <p className='text-muted-foreground'>Course offering not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-10'>
      <div className='flex items-center gap-4 mb-6'>
        <Button
          variant='ghost'
          size='icon'
          onClick={() => router.push('/admin/course-offerings')}
        >
          <ArrowLeft className='h-4 w-4' />
        </Button>
        <div>
          <h1 className='text-3xl font-bold'>
            {courseOffering.course.code} - {courseOffering.course.name}
          </h1>
          <p className='text-muted-foreground'>
            {courseOffering.semester.name} •{' '}
            {courseOffering.course.department.name}
          </p>
        </div>
      </div>

      <div className='grid gap-6'>
        <Card className='p-6'>
          <h2 className='text-xl font-semibold mb-4'>Course Details</h2>
          <div className='space-y-4'>
            <div>
              <p className='text-sm text-muted-foreground'>Course Code</p>
              <p className='font-medium'>{courseOffering.course.code}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Course Name</p>
              <p className='font-medium'>{courseOffering.course.name}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Description</p>
              <p className='font-medium'>
                {courseOffering.course.description ||
                  'No description available'}
              </p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Credit Hours</p>
              <p className='font-medium'>{courseOffering.course.creditHours}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Course Type</p>
              <p className='font-medium'>{courseOffering.course.type}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Department</p>
              <p className='font-medium'>
                {courseOffering.course.department.name} (
                {courseOffering.course.department.code})
              </p>
            </div>
          </div>
        </Card>

        <Card className='p-6'>
          <h2 className='text-xl font-semibold mb-4'>Semester Details</h2>
          <div className='space-y-4'>
            <div>
              <p className='text-sm text-muted-foreground'>Semester Name</p>
              <p className='font-medium'>{courseOffering.semester.name}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Duration</p>
              <p className='font-medium'>
                {format(
                  new Date(courseOffering.semester.startDate),
                  'MMM d, yyyy'
                )}{' '}
                -{' '}
                {format(
                  new Date(courseOffering.semester.endDate),
                  'MMM d, yyyy'
                )}
              </p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Status</p>
              <Badge className={getStatusColor(courseOffering.status)}>
                {courseOffering.status}
              </Badge>
            </div>
          </div>
        </Card>

        <Card className='p-6'>
          <div className='flex justify-between items-center mb-6'>
            <h2 className='text-xl font-semibold'>Sections</h2>
            <CreateSectionDialog
              courseOfferingId={courseOffering.id}
              onSuccess={fetchCourseOffering}
            />
          </div>

          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Section Name</TableHead>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courseOffering.sections.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className='text-center'>
                      No sections found
                    </TableCell>
                  </TableRow>
                ) : (
                  courseOffering.sections.map((section) => (
                    <TableRow key={section.id}>
                      <TableCell>{section.name}</TableCell>
                      <TableCell>
                        {section.faculty
                          ? `${section.faculty.user.first_name} ${section.faculty.user.last_name}`
                          : 'Not assigned'}
                      </TableCell>
                      <TableCell>
                        {section.currentStudents} / {section.maxStudents}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant='ghost'
                          onClick={() =>
                            router.push(`/admin/sections/${section.id}`)
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
        </Card>
      </div>

      <div className='flex justify-end gap-4 mt-6'>
        <Button
          variant='outline'
          onClick={() =>
            router.push(`/admin/courses/${courseOffering.course.id}`)
          }
        >
          View Course Details
        </Button>
        <Button
          variant='outline'
          onClick={() =>
            router.push(`/admin/semesters/${courseOffering.semester.id}`)
          }
        >
          View Semester Details
        </Button>
        <Button variant='destructive' onClick={() => setShowDeleteDialog(true)}>
          <Trash2 className='mr-2 h-4 w-4' />
          Delete Course Offering
        </Button>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              course offering and all its associated sections.
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
              {isDeleting ? 'Deleting...' : 'Delete Course Offering'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
