'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { FileText } from 'lucide-react';
import { AssessmentList } from '@/components/assessments/AssessmentList';

export default function AssessmentsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = mounted && resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: iconBgColor }}
          >
            <FileText className="h-5 w-5" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary-text">My Assessments</h1>
            <p className="text-xs text-secondary-text mt-0.5">
              View all assessments for your enrolled courses
            </p>
          </div>
        </div>
      </div>
      <AssessmentList />
    </div>
  );
}
