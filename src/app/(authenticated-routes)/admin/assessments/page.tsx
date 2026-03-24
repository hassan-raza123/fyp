'use client';

import { useEffect, useState } from 'react';
import { AssessmentList } from '@/components/assessments/AssessmentList';

export default function AssessmentsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-primary-text">Assessments</h1>
        <p className="text-xs text-secondary-text mt-0.5">
          View and monitor assessments across the department
        </p>
      </div>
      <AssessmentList />
    </div>
  );
}
