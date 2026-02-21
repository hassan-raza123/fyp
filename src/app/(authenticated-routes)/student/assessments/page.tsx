'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { AssessmentList } from '@/components/assessments/AssessmentList';

export default function AssessmentsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-primary-text">My Assessments</h1>
          <p className="text-xs text-secondary-text mt-0.5">
            View all assessments for your enrolled courses
          </p>
        </div>
      </div>
      <AssessmentList />
    </div>
  );
}
