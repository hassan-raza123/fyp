'use client';

import { useEffect, useState } from 'react';
import { EditAssessmentForm } from '@/components/assessments/EditAssessmentForm';
import { notFound, useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function EditAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const [assessment, setAssessment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const response = await fetch(`/api/assessments/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch assessment');
        }
        const data = await response.json();
        setAssessment(data);
      } catch (error) {
        toast.error('Failed to load assessment');
        console.error('Error fetching assessment:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) fetchAssessment();
  }, [params.id]);

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/assessments/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update assessment');
      }

      toast.success('Assessment updated successfully');
      router.push('/admin/assessments');
    } catch (error) {
      toast.error('Failed to update assessment');
      console.error('Error updating assessment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!assessment) {
    return notFound();
  }

  return (
    <div className='container mx-auto py-6'>
      <div className='flex items-center gap-4 mb-6'>
        <Button variant='ghost' size='icon' onClick={() => router.back()}>
          <ArrowLeft className='h-4 w-4' />
        </Button>
        <h1 className='text-3xl font-bold'>Edit Assessment</h1>
      </div>
      <div className='max-w-2xl'>
        <EditAssessmentForm
          assessment={assessment}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
        />
      </div>
    </div>
  );
}
