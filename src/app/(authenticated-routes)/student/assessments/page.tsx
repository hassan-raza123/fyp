'use client';

import { AssessmentList } from '@/components/assessments/AssessmentList';

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
