'use client';

import { useEffect, useState } from 'react';
import { AssessmentList } from '@/components/assessments/AssessmentList';
import { CreateAssessmentForm } from '@/components/assessments/CreateAssessmentForm';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PlusIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function AssessmentsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreateAssessment = async (data: any) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create assessment');
      }

      toast.success('Assessment created successfully');
      setIsDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast.error('Failed to create assessment');
      console.error('Error creating assessment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='container mx-auto py-6 space-y-6'>
      <div className='flex justify-between items-center'>
        <h1 className='text-3xl font-bold'>Assessments</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className='mr-2 h-4 w-4' />
              Create Assessment
            </Button>
          </DialogTrigger>
          <DialogContent className='max-w-2xl'>
            <DialogHeader>
              <DialogTitle>Create New Assessment</DialogTitle>
            </DialogHeader>
            <CreateAssessmentForm
              sectionId={1} // This should be dynamic based on the selected section
              onSubmit={handleCreateAssessment}
              isLoading={isLoading}
            />
          </DialogContent>
        </Dialog>
      </div>
      <AssessmentList />
    </div>
  );
}
