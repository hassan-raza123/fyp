'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Edit2, FileText, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

interface Assessment {
  id: number;
  title: string;
  description: string;
  type: string;
  totalMarks: number;
  dueDate: string;
  weightage: number;
}

export function AssessmentList() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchAssessments = async () => {
    try {
      const response = await fetch('/api/assessments');
      if (!response.ok) {
        throw new Error('Failed to fetch assessments');
      }
      const data = await response.json();
      setAssessments(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to load assessments');
      console.error('Error fetching assessments:', error);
      setAssessments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this assessment?')) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await fetch(`/api/assessments/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete assessment');
      }

      toast.success('Assessment deleted successfully');
      fetchAssessments();
    } catch (error) {
      toast.error('Failed to delete assessment');
      console.error('Error deleting assessment:', error);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className='h-6 w-3/4' />
              <Skeleton className='h-4 w-1/2 mt-2' />
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-full' />
                <div className='flex justify-between'>
                  <Skeleton className='h-4 w-1/4' />
                  <Skeleton className='h-4 w-1/4' />
                </div>
                <Skeleton className='h-4 w-1/3' />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!Array.isArray(assessments) || assessments.length === 0) {
    return (
      <div className='text-center py-10'>
        <p className='text-muted-foreground'>No assessments found</p>
      </div>
    );
  }

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
      {assessments.map((assessment) => (
        <Card key={assessment.id}>
          <CardHeader>
            <CardTitle className='flex items-center justify-between'>
              <span>{assessment.title}</span>
              <div className='flex gap-2'>
                <Button variant='ghost' size='icon' asChild>
                  <Link href={`/admin/assessments/${assessment.id}/edit`}>
                    <Edit2 className='h-4 w-4' />
                  </Link>
                </Button>
                <Button variant='ghost' size='icon' asChild>
                  <Link href={`/admin/assessments/${assessment.id}/items`}>
                    <FileText className='h-4 w-4' />
                  </Link>
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => handleDelete(assessment.id)}
                  disabled={deletingId === assessment.id}
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>
            </CardTitle>
            <CardDescription>{assessment.type}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <p className='text-sm text-muted-foreground'>
                {assessment.description}
              </p>
              <div className='flex justify-between text-sm'>
                <span>Total Marks: {assessment.totalMarks}</span>
                <span>Weightage: {assessment.weightage}%</span>
              </div>
              <p className='text-sm'>
                Due: {format(new Date(assessment.dueDate), 'PPP')}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
