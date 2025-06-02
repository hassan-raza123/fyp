'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Edit, Trash2, BookOpen } from 'lucide-react';
import { programs_status } from '@prisma/client';
import { use } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  status: programs_status;
  description: string | null;
  stats: {
    students: number;
    courses: number;
  };
}

export default function ProgramDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const programId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<Program | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    fetchProgram();
  }, [programId]);

  const fetchProgram = async () => {
    try {
      const response = await fetch(`/api/programs/${programId}`);
      if (!response.ok) throw new Error('Failed to fetch program');
      const data = await response.json();
      if (data.success) {
        setProgram(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch program');
      }
    } catch (error) {
      console.error('Error fetching program:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to fetch program'
      );
      router.push('/admin/programs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/programs/${programId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete program');
      }

      toast.success('Program deleted successfully');
      router.push('/admin/programs');
    } catch (error) {
      console.error('Error deleting program:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete program'
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const getStatusBadge = (status: programs_status) => {
    switch (status) {
      case programs_status.active:
        return <Badge variant='success'>Active</Badge>;
      case programs_status.inactive:
        return <Badge variant='secondary'>Inactive</Badge>;
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

  if (!program) {
    return (
      <div className='container mx-auto py-10'>
        <div className='text-center'>Program not found</div>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-10'>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-3xl font-bold'>{program.name}</h1>
          <p className='text-muted-foreground'>Program Code: {program.code}</p>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={() => router.push(`/admin/programs/${program.id}/plos`)}
          >
            <BookOpen className='mr-2 h-4 w-4' />
            Manage PLOs
          </Button>
          <Button
            variant='outline'
            onClick={() => router.push(`/admin/programs/${program.id}/edit`)}
          >
            <Edit className='mr-2 h-4 w-4' />
            Edit
          </Button>
          <Button
            variant='destructive'
            onClick={(e) => {
              e.preventDefault();
              setShowDeleteDialog(true);
            }}
          >
            <Trash2 className='mr-2 h-4 w-4' />
            Delete
          </Button>
        </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              program "{program.name}" and all its associated data.
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
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Program'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <Card className='p-6'>
          <h2 className='text-xl font-semibold mb-4'>Program Information</h2>
          <div className='space-y-4'>
            <div>
              <p className='text-sm text-muted-foreground'>Department</p>
              <p className='font-medium'>
                {program.department.name} ({program.department.code})
              </p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>
                Total Credit Hours
              </p>
              <p className='font-medium'>{program.totalCreditHours}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Duration</p>
              <p className='font-medium'>{program.duration} years</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Status</p>
              <div className='mt-1'>{getStatusBadge(program.status)}</div>
            </div>
          </div>
        </Card>

        <Card className='p-6'>
          <h2 className='text-xl font-semibold mb-4'>Program Statistics</h2>
          <div className='space-y-4'>
            <div>
              <p className='text-sm text-muted-foreground'>Total Courses</p>
              <p className='font-medium'>{program.stats.courses}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Total Students</p>
              <p className='font-medium'>{program.stats.students}</p>
            </div>
          </div>
        </Card>

        {program.description && (
          <Card className='p-6 md:col-span-2'>
            <h2 className='text-xl font-semibold mb-4'>Description</h2>
            <p className='text-muted-foreground'>{program.description}</p>
          </Card>
        )}
      </div>
    </div>
  );
}
