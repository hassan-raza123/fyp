'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
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

interface Section {
  id: number;
  name: string;
  maxStudents: number;
  status: 'active' | 'inactive' | 'suspended' | 'deleted';
  courseOffering: {
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
  };
  faculty: {
    id: number;
    user: {
      first_name: string;
      last_name: string;
      email: string;
    };
  } | null;
  batch: {
    id: string;
    name: string;
  };
  _count: {
    studentsections: number;
  };
}

export default function SectionDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [section, setSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSection = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sections/${params.id}`);
      const data = await response.json();

      if (data.success) {
        setSection(data.data);
      } else {
        toast.error(data.error || 'Failed to fetch section');
        router.push('/admin/sections');
      }
    } catch (error) {
      toast.error('Failed to fetch section');
      router.push('/admin/sections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSection();
  }, [params.id]);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/sections?id=${params.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Section deleted successfully');
        router.push('/admin/sections');
      } else {
        toast.error(data.error || 'Failed to delete section');
      }
    } catch (error) {
      toast.error('Failed to delete section');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const getStatusColor = (status: Section['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-yellow-500';
      case 'suspended':
        return 'bg-orange-500';
      case 'deleted':
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

  if (!section) {
    return (
      <div className='container mx-auto py-10'>
        <div className='flex items-center justify-center h-64'>
          <p className='text-muted-foreground'>Section not found</p>
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
          onClick={() => router.push('/admin/sections')}
        >
          <ArrowLeft className='h-4 w-4' />
        </Button>
        <div>
          <h1 className='text-3xl font-bold'>{section.name}</h1>
          <p className='text-muted-foreground'>
            {section.courseOffering.course.code} -{' '}
            {section.courseOffering.course.name}
          </p>
        </div>
      </div>

      <div className='grid gap-6'>
        <Card className='p-6'>
          <h2 className='text-xl font-semibold mb-4'>Section Details</h2>
          <div className='space-y-4'>
            <div>
              <p className='text-sm text-muted-foreground'>Section Name</p>
              <p className='font-medium'>{section.name}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Course</p>
              <p className='font-medium'>
                {section.courseOffering.course.code} -{' '}
                {section.courseOffering.course.name}
              </p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Semester</p>
              <p className='font-medium'>
                {section.courseOffering.semester.name}
              </p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Faculty</p>
              <p className='font-medium'>
                {section.faculty
                  ? `${section.faculty.user.first_name} ${section.faculty.user.last_name}`
                  : 'Not assigned'}
              </p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Batch</p>
              <p className='font-medium'>{section.batch.name}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Students</p>
              <p className='font-medium'>
                {section._count.studentsections} / {section.maxStudents}
              </p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Status</p>
              <Badge className={getStatusColor(section.status)}>
                {section.status}
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      <div className='flex justify-end gap-4 mt-6'>
        <Button
          variant='outline'
          onClick={() =>
            router.push(`/admin/course-offerings/${section.courseOffering.id}`)
          }
        >
          View Course Offering
        </Button>
        <Button variant='destructive' onClick={() => setShowDeleteDialog(true)}>
          <Trash2 className='mr-2 h-4 w-4' />
          Delete Section
        </Button>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              section and all its associated data.
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
              {isDeleting ? 'Deleting...' : 'Delete Section'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
