'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateAssessmentFormProps {
  sectionId?: number;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  onCancel?: () => void;
}

interface CourseOffering {
  id: number;
  course: {
    id: number;
    code: string;
    name: string;
  };
  semester: {
    id: number;
    name: string;
  };
  sections: Array<{
    id: number;
    name: string;
  }>;
}

const ASSESSMENT_TYPES = [
  'quiz',
  'assignment',
  'sessional_exam',
  'mid_exam',
  'final_exam',
  'project',
  'presentation',
  'lab_report',
  'lab_exam',
  'viva',
  'class_participation',
  'case_study',
];

export function CreateAssessmentForm({
  sectionId,
  onSubmit,
  isLoading = false,
  onCancel,
}: CreateAssessmentFormProps) {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const primaryColorDark = isDarkMode
    ? 'var(--orange-dark)'
    : 'var(--blue-dark)';

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    totalMarks: 0,
    dueDate: new Date(),
    instructions: '',
    weightage: 0,
    courseOfferingId: '',
  });
  const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>([]);
  const [loadingOfferings, setLoadingOfferings] = useState(true);
  const [usedWeightage, setUsedWeightage] = useState<number | null>(null);
  const [loadingWeightage, setLoadingWeightage] = useState(false);

  useEffect(() => {
    const fetchCourseOfferings = async () => {
      try {
        const response = await fetch('/api/faculty/course-offerings', {
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch course offerings');
        const data = await response.json();
        if (data.success) setCourseOfferings(data.data);
      } catch (error) {
        console.error('Error fetching course offerings:', error);
      } finally {
        setLoadingOfferings(false);
      }
    };

    if (!sectionId) {
      fetchCourseOfferings();
    } else {
      setLoadingOfferings(false);
    }
  }, [sectionId]);

  // Fetch used weightage when course offering changes
  useEffect(() => {
    const offeringId = sectionId || formData.courseOfferingId;
    if (!offeringId) {
      setUsedWeightage(null);
      return;
    }
    const fetchWeightage = async () => {
      setLoadingWeightage(true);
      try {
        const res = await fetch(`/api/assessments?courseOfferingId=${offeringId}`, {
          credentials: 'include',
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.usedWeightage !== undefined) {
          setUsedWeightage(data.usedWeightage);
        }
      } catch {
        // silent fail
      } finally {
        setLoadingWeightage(false);
      }
    };
    fetchWeightage();
  }, [formData.courseOfferingId, sectionId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionId && !formData.courseOfferingId) {
      alert('Please select a course offering');
      return;
    }
    onSubmit({
      ...formData,
      courseOfferingId: sectionId || Number(formData.courseOfferingId),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      {!sectionId && (
        <div className="grid gap-1.5">
          <Label htmlFor="courseOfferingId" className="text-xs text-secondary-text">
            Course Offering *
          </Label>
          <Select
            value={formData.courseOfferingId}
            onValueChange={(value) =>
              setFormData({ ...formData, courseOfferingId: value })
            }
            disabled={loadingOfferings}
          >
            <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
              <SelectValue placeholder="Select course offering" />
            </SelectTrigger>
            <SelectContent className="bg-card border-card-border">
              {courseOfferings.map((offering) => (
                <SelectItem
                  key={offering.id}
                  value={offering.id.toString()}
                  className="text-primary-text hover:bg-card/50 text-xs"
                >
                  {offering.course.code} - {offering.course.name} (
                  {offering.semester.name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid gap-1.5">
        <Label htmlFor="title" className="text-xs text-secondary-text">
          Assessment Title *
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter assessment title"
          required
          className="h-8 text-xs bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="description" className="text-xs text-secondary-text">
          Description *
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Enter assessment description"
          required
          rows={2}
          className="text-xs bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary resize-none"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="type" className="text-xs text-secondary-text">
          Assessment Type *
        </Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value })}
        >
          <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
            <SelectValue placeholder="Select assessment type" />
          </SelectTrigger>
          <SelectContent className="bg-card border-card-border">
            {ASSESSMENT_TYPES.map((type) => (
              <SelectItem
                key={type}
                value={type}
                className="text-primary-text hover:bg-card/50 text-xs"
              >
                {type
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (c) => c.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="totalMarks" className="text-xs text-secondary-text">
            Total Marks *
          </Label>
          <Input
            id="totalMarks"
            type="number"
            min={0}
            value={formData.totalMarks || ''}
            onChange={(e) =>
              setFormData({ ...formData, totalMarks: Number(e.target.value) || 0 })
            }
            required
            placeholder="0"
            className="h-8 text-xs bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
          />
        </div>
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="weightage" className="text-xs text-secondary-text">
              Weightage (%) *
            </Label>
            {usedWeightage !== null && !loadingWeightage && (
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor:
                    100 - usedWeightage < formData.weightage
                      ? 'rgba(239,68,68,0.12)'
                      : 'rgba(16,185,129,0.12)',
                  color:
                    100 - usedWeightage < formData.weightage
                      ? '#ef4444'
                      : '#10b981',
                }}
              >
                {usedWeightage}% used · {(100 - usedWeightage).toFixed(0)}% left
              </span>
            )}
          </div>
          <Input
            id="weightage"
            type="number"
            min={0}
            max={100}
            value={formData.weightage || ''}
            onChange={(e) =>
              setFormData({ ...formData, weightage: Number(e.target.value) || 0 })
            }
            required
            placeholder="0"
            className={cn(
              'h-8 text-xs bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary',
              usedWeightage !== null &&
                100 - usedWeightage < formData.weightage &&
                'border-red-500'
            )}
          />
          {usedWeightage !== null && 100 - usedWeightage < formData.weightage && (
            <p className="text-[10px] text-red-500">
              Exceeds available weightage. Reduce to {(100 - usedWeightage).toFixed(0)}% or less.
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label className="text-xs text-secondary-text">Due Date *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                'w-full h-8 px-3 rounded-md border text-xs text-left flex items-center gap-2 transition-colors',
                'bg-card border-card-border text-primary-text',
                !formData.dueDate && 'text-secondary-text'
              )}
            >
              <CalendarIcon className="h-3.5 w-3.5 text-muted-text" />
              {formData.dueDate ? (
                format(formData.dueDate, 'PPP')
              ) : (
                <span className="text-muted-text">Pick a date</span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-card border-card-border" align="start">
            <Calendar
              mode="single"
              selected={formData.dueDate}
              onSelect={(date) =>
                date && setFormData({ ...formData, dueDate: date })
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="instructions" className="text-xs text-secondary-text">
          Instructions *
        </Label>
        <Textarea
          id="instructions"
          value={formData.instructions}
          onChange={(e) =>
            setFormData({ ...formData, instructions: e.target.value })
          }
          placeholder="Enter assessment instructions"
          required
          rows={2}
          className="text-xs bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary resize-none"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-card-border">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 border border-card-border bg-transparent text-primary-text"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 disabled:opacity-50"
          style={{ backgroundColor: primaryColor, color: '#ffffff' }}
          onMouseEnter={(e) => {
            if (!isLoading)
              e.currentTarget.style.backgroundColor = primaryColorDark;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = primaryColor;
          }}
        >
          {isLoading ? 'Creating...' : 'Create Assessment'}
        </button>
      </div>
    </form>
  );
}
