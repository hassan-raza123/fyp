import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
  sectionId: number;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

// Static assessment types (must match backend)
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
}: CreateAssessmentFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    totalMarks: 0,
    dueDate: new Date(),
    instructions: '',
    weightage: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      courseOfferingId: sectionId,
    });
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <div className='space-y-2'>
        <Label htmlFor='title'>Assessment Title</Label>
        <Input
          id='title'
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder='Enter assessment title'
          required
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='description'>Description</Label>
        <Textarea
          id='description'
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder='Enter assessment description'
          required
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='type'>Assessment Type</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder='Select assessment type' />
          </SelectTrigger>
          <SelectContent>
            {ASSESSMENT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (c) => c.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor='totalMarks'>Total Marks</Label>
          <Input
            id='totalMarks'
            type='number'
            value={formData.totalMarks}
            onChange={(e) =>
              setFormData({ ...formData, totalMarks: Number(e.target.value) })
            }
            required
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='weightage'>Weightage (%)</Label>
          <Input
            id='weightage'
            type='number'
            value={formData.weightage}
            onChange={(e) =>
              setFormData({ ...formData, weightage: Number(e.target.value) })
            }
            required
          />
        </div>
      </div>

      <div className='space-y-2'>
        <Label>Due Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={'outline'}
              className={cn(
                'w-full justify-start text-left font-normal',
                !formData.dueDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className='mr-2 h-4 w-4' />
              {formData.dueDate ? (
                format(formData.dueDate, 'PPP')
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-auto p-0'>
            <Calendar
              mode='single'
              selected={formData.dueDate}
              onSelect={(date) =>
                date && setFormData({ ...formData, dueDate: date })
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='instructions'>Instructions</Label>
        <Textarea
          id='instructions'
          value={formData.instructions}
          onChange={(e) =>
            setFormData({ ...formData, instructions: e.target.value })
          }
          placeholder='Enter assessment instructions'
          required
        />
      </div>

      <Button type='submit' className='w-full' disabled={isLoading}>
        {isLoading ? 'Creating Assessment...' : 'Create Assessment'}
      </Button>
    </form>
  );
}
