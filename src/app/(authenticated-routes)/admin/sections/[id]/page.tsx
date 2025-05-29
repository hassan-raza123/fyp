'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

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
  };
}

interface Faculty {
  id: number;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface Batch {
  id: string;
  name: string;
}

interface Section {
  id: number;
  name: string;
  maxStudents: number;
  status: 'active' | 'inactive' | 'suspended' | 'deleted';
  courseOffering: CourseOffering;
  faculty: Faculty | null;
  batch: Batch;
  _count: {
    studentsections: number;
  };
}

export default function SectionDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [section, setSection] = useState<Section | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    fetchSectionDetails();
  }, [id]);

  const fetchSectionDetails = async () => {
    try {
      const response = await fetch(`/api/sections/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch section details');
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch section details');
      }
      setSection(data.data);
    } catch (error) {
      console.error('Error fetching section details:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to fetch section details'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/sections/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete section');
      }

      toast.success('Section deleted successfully');
      router.push('/admin/sections');
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete section'
      );
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
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

  if (!section) {
    return (
      <div className='container mx-auto py-10'>
        <div className='flex items-center justify-center h-64'>
          <p className='text-muted-foreground'>Section not found</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-gray-500';
      case 'suspended':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className='container mx-auto py-10'>
      <div className='flex items-center gap-4 mb-6'>
        <Button
          variant='ghost'
          size='icon'
          onClick={() => router.push('/admin/sections')}
        >
          <ArrowLeft className='h-4 w-4' />
        </Button>
        <div>
          <h1 className='text-3xl font-bold'>Section Details</h1>
          <p className='text-muted-foreground'>
            {section.courseOffering.course.code} -{' '}
            {section.courseOffering.course.name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle>Section Information</CardTitle>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => router.push(`/admin/sections/${id}/edit`)}
              >
                <Pencil className='h-4 w-4 mr-2' />
                Edit
              </Button>
              <Dialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
              >
                <DialogTrigger asChild>
                  <Button variant='destructive' size='sm'>
                    <Trash2 className='h-4 w-4 mr-2' />
                    Delete
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Section</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this section? This action
                      cannot be undone.
                      {section._count.studentsections > 0 && (
                        <span className='block text-red-500 mt-2'>
                          Warning: This section has{' '}
                          {section._count.studentsections} enrolled students.
                          You cannot delete a section with enrolled students.
                        </span>
                      )}
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant='outline'
                      onClick={() => setShowDeleteDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant='destructive'
                      onClick={handleDelete}
                      disabled={deleting || section._count.studentsections > 0}
                    >
                      {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 gap-6'>
            <div>
              <h3 className='text-sm font-medium text-muted-foreground'>
                Section Name
              </h3>
              <p className='mt-1'>{section.name}</p>
            </div>

            <div>
              <h3 className='text-sm font-medium text-muted-foreground'>
                Course
              </h3>
              <p className='mt-1'>
                {section.courseOffering.course.code} -{' '}
                {section.courseOffering.course.name}
              </p>
            </div>

            <div>
              <h3 className='text-sm font-medium text-muted-foreground'>
                Semester
              </h3>
              <p className='mt-1'>{section.courseOffering.semester.name}</p>
            </div>

            <div>
              <h3 className='text-sm font-medium text-muted-foreground'>
                Faculty
              </h3>
              <p className='mt-1'>
                {section.faculty
                  ? `${section.faculty.user.first_name} ${section.faculty.user.last_name}`
                  : 'Not assigned'}
              </p>
            </div>

            <div>
              <h3 className='text-sm font-medium text-muted-foreground'>
                Batch
              </h3>
              <p className='mt-1'>{section.batch.name}</p>
            </div>

            <div>
              <h3 className='text-sm font-medium text-muted-foreground'>
                Students
              </h3>
              <p className='mt-1'>
                {section._count.studentsections} / {section.maxStudents}
              </p>
            </div>

            <div>
              <h3 className='text-sm font-medium text-muted-foreground'>
                Status
              </h3>
              <Badge
                className={`mt-1 ${getStatusColor(section.status)}`}
                variant='secondary'
              >
                {section.status.charAt(0).toUpperCase() +
                  section.status.slice(1)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
