'use client';

import { useEffect, useState } from 'react';
import { Metadata } from 'next';
import { AssessmentItemForm } from '@/components/assessments/AssessmentItemForm';
import { notFound, useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function AssessmentItemsPage() {
  const params = useParams();
  const router = useRouter();
  const [assessment, setAssessment] = useState<any>(null);
  const [clos, setClos] = useState<any[]>([]);
  const [plos, setPlos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assessmentRes, closRes, plosRes] = await Promise.all([
          fetch(`/api/assessments/${params.id}`),
          fetch('/api/clos'),
          fetch('/api/plos'),
        ]);

        if (!assessmentRes.ok || !closRes.ok || !plosRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const [assessmentData, closData, plosData] = await Promise.all([
          assessmentRes.json(),
          closRes.json(),
          plosRes.json(),
        ]);

        setAssessment(assessmentData);
        setClos(Array.isArray(closData.data) ? closData.data : []);
        setPlos(Array.isArray(plosData.data) ? plosData.data : []);
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
        <h1 className='text-3xl font-bold'>Assessment Items</h1>
      </div>
      <div className='max-w-2xl'>
        <AssessmentItemForm
          assessmentId={
            typeof params.id === 'string'
              ? parseInt(params.id)
              : Array.isArray(params.id)
              ? parseInt(params.id[0])
              : 0
          }
          clos={clos}
          plos={plos}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
        />
      </div>
    </div>
  );
}
