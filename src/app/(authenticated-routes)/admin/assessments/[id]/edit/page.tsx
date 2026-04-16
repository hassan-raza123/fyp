'use client';

import { useEffect, useState } from 'react';
import { EditAssessmentForm } from '@/components/assessments/EditAssessmentForm';
import { notFound, useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PageLoading } from '@/components/ui/page-loading';
import { PageHeader } from '@/components/ui/page-header';

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
    return <PageLoading message="Loading assessment..." />;
  }

  if (!assessment) {
    return notFound();
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Edit Assessment"
        subtitle={assessment.title || 'Update assessment details'}
      />
      <div className="max-w-2xl">
        <EditAssessmentForm
          assessment={assessment}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
        />
      </div>
    </div>
  );
}
