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
  return (
    <div className='container mx-auto py-6 space-y-6'>
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold'>My Assessments</h1>
          <p className='text-gray-500 mt-1'>
            View all assessments for your enrolled courses
          </p>
        </div>
      </div>
      <AssessmentList />
    </div>
  );
}
