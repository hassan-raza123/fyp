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
  'lab_performance',
  'lab_exam',
  'viva',
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {!sectionId && (
        <div className="grid gap-2">
          <Label htmlFor="courseOfferingId" className="text-xs text-primary-text">
            Course Offering *
          </Label>
          <Select
            value={formData.courseOfferingId}
            onValueChange={(value) =>
              setFormData({ ...formData, courseOfferingId: value })
            }
            disabled={loadingOfferings}
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
      )}

      <div className="grid gap-2">
        <Label htmlFor="title" className="text-xs text-primary-text">
          Assessment Title *
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter assessment title"
          required
          className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description" className="text-xs text-primary-text">
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
          rows={3}
          className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="type" className="text-xs text-primary-text">
          Assessment Type *
        </Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value })}
        >
          <SelectTrigger className="bg-card border-card-border text-primary-text">
            <SelectValue placeholder="Select assessment type" />
          </SelectTrigger>
          <SelectContent className="bg-card border-card-border">
            {ASSESSMENT_TYPES.map((type) => (
              <SelectItem
                key={type}
                value={type}
                className="text-primary-text hover:bg-card/50"
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
        <div className="grid gap-2">
          <Label htmlFor="totalMarks" className="text-xs text-primary-text">
            Total Marks *
          </Label>
          <Input
            id="totalMarks"
            type="number"
            value={formData.totalMarks}
            onChange={(e) =>
              setFormData({ ...formData, totalMarks: Number(e.target.value) })
            }
            required
            className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="weightage" className="text-xs text-primary-text">
            Weightage (%) *
          </Label>
          <Input
            id="weightage"
            type="number"
            value={formData.weightage}
            onChange={(e) =>
              setFormData({ ...formData, weightage: Number(e.target.value) })
            }
            required
            className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label className="text-xs text-primary-text">Due Date *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                'w-full h-9 px-3 rounded-md border text-xs text-left flex items-center gap-2 transition-colors',
                'bg-card border-card-border text-primary-text',
                !formData.dueDate && 'text-secondary-text'
              )}
            >
              <CalendarIcon className="h-3.5 w-3.5 text-secondary-text" />
              {formData.dueDate ? (
                format(formData.dueDate, 'PPP')
              ) : (
                <span className="text-secondary-text">Pick a date</span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-card border-card-border">
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

      <div className="grid gap-2">
        <Label htmlFor="instructions" className="text-xs text-primary-text">
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
          rows={3}
          className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 border border-card-border bg-transparent"
            style={{
              color: isDarkMode ? '#ffffff' : '#111827',
              borderColor: isDarkMode ? '#404040' : '#e5e7eb',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.05)';
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
          className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8"
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
