'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { AssessmentList } from '@/components/assessments/AssessmentList';
import { CreateAssessmentForm } from '@/components/assessments/CreateAssessmentForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function AssessmentsPage() {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const isDarkMode = resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode
    ? 'rgba(252, 153, 40, 0.15)'
    : 'rgba(38, 40, 149, 0.15)';

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
    <div className="space-y-4">
      {/* Header - same as My Courses / admin CLO */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-primary-text">My Assessments</h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Create and manage your assessments
          </p>
        </div>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 flex items-center gap-1.5"
          style={{ backgroundColor: iconBgColor, color: primaryColor }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = iconBgColor;
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          Create Assessment
        </button>
      </div>

      <AssessmentList />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl bg-card border-card-border text-primary-text p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-primary-text">Create New Assessment</DialogTitle>
            <p className="text-xs text-secondary-text mt-0.5">Fill in the details below to create a new assessment.</p>
          </DialogHeader>
          <CreateAssessmentForm
            onSubmit={handleCreateAssessment}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
