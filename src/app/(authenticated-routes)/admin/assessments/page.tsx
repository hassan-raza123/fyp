'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { AssessmentList } from '@/components/assessments/AssessmentList';
import { CreateAssessmentForm } from '@/components/assessments/CreateAssessmentForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { PlusIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface CourseOffering {
  id: number;
  course: {
    code: string;
    name: string;
  };
  semester: {
    name: string;
  };
}

export default function AssessmentsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>([]);
  const [selectedCourseOffering, setSelectedCourseOffering] =
    useState<string>('');
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchCourseOfferings();
  }, []);

  const fetchCourseOfferings = async () => {
    try {
      const response = await fetch('/api/courses/offerings?status=active');
      if (!response.ok) throw new Error('Failed to fetch course offerings');
      const data = await response.json();
      if (data.success) {
        setCourseOfferings(data.data);
      }
    } catch (error) {
      console.error('Error fetching course offerings:', error);
      toast.error('Failed to load course offerings');
    }
  };

  const handleCreateAssessment = async (data: any) => {
    if (!selectedCourseOffering) {
      toast.error('Please select a course offering');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          courseOfferingId: parseInt(selectedCourseOffering),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create assessment');
      }

      toast.success('Assessment created successfully');
      setIsDialogOpen(false);
      setSelectedCourseOffering('');
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create assessment'
      );
      console.error('Error creating assessment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode
    ? 'rgba(252, 153, 40, 0.15)'
    : 'rgba(38, 40, 149, 0.15)';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-primary-text">Assessments</h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Create and manage assessment tools to measure learning outcomes
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <button
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 flex items-center gap-1.5"
              style={{ backgroundColor: iconBgColor, color: primaryColor }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = iconBgColor;
              }}
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Create Assessment
            </button>
          </DialogTrigger>
          <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto p-5">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-primary-text">Create New Assessment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="courseOffering" className="text-xs text-primary-text">Course Offering *</Label>
                <Select
                  value={selectedCourseOffering}
                  onValueChange={setSelectedCourseOffering}
                >
                  <SelectTrigger className="bg-card border-card-border text-primary-text">
                    <SelectValue placeholder="Select course offering" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-card-border">
                    {courseOfferings.map((offering) => (
                      <SelectItem
                        key={offering.id}
                        value={offering.id.toString()}
                        className="text-primary-text hover:bg-card/50"
                      >
                        {offering.course.code} - {offering.course.name} (
                        {offering.semester.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedCourseOffering && (
                <CreateAssessmentForm
                  sectionId={parseInt(selectedCourseOffering)}
                  onSubmit={handleCreateAssessment}
                  isLoading={isLoading}
                  onCancel={() => setIsDialogOpen(false)}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <AssessmentList />
    </div>
  );
}
