'use client';

import { useEffect, useState } from 'react';
import { AssessmentItemForm } from '@/components/assessments/AssessmentItemForm';
import { notFound, useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PageLoading } from '@/components/ui/page-loading';
import { PageHeader } from '@/components/ui/page-header';

export default function AssessmentItemsPage() {
  const params = useParams();
  const router = useRouter();
  const [assessment, setAssessment] = useState<any>(null);
  const [clos, setClos] = useState<any[]>([]);
  const [llos, setLlos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assessmentRes, closRes, llosRes] = await Promise.all([
          fetch(`/api/assessments/${params.id}`),
          fetch('/api/clos'),
          fetch('/api/llos'),
        ]);

        if (!assessmentRes.ok || !closRes.ok || !llosRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const [assessmentData, closData, llosData] = await Promise.all([
          assessmentRes.json(),
          closRes.json(),
          llosRes.json(),
        ]);

        setAssessment(assessmentData);
        setClos(Array.isArray(closData.data) ? closData.data : []);
        setLlos(Array.isArray(llosData.data) ? llosData.data : []);
      } catch (error) {
        toast.error('Failed to load data');
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) fetchData();
  }, [params.id]);

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/assessments/${params.id}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create assessment item');
      }

      toast.success('Assessment item created successfully');
      router.refresh();
    } catch (error) {
      toast.error('Failed to create assessment item');
      console.error('Error creating assessment item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <PageLoading message="Loading assessment items..." />;
  }

  if (!assessment) {
    return notFound();
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Assessment Items"
        subtitle={assessment.title ? `Items for: ${assessment.title}` : 'Manage assessment items'}
      />
      <div className="max-w-2xl">
        <AssessmentItemForm
          assessmentId={
            typeof params.id === 'string'
              ? parseInt(params.id)
              : Array.isArray(params.id)
              ? parseInt(params.id[0])
              : 0
          }
          clos={clos}
          llos={llos}
          isLabAssessment={['lab_exam', 'lab_report'].includes(assessment?.type)}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
        />
      </div>
    </div>
  );
}
