import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
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
import { assessment_status, assessment_type } from '@prisma/client';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  totalMarks: z.string().min(1, 'Total marks is required'),
  instructions: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

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

interface EditAssessmentFormProps {
  assessment: any;
  onSubmit: (data: FormData) => Promise<void>;
  isLoading?: boolean;
}

export function EditAssessmentForm({
  assessment,
  onSubmit,
  isLoading = false,
}: EditAssessmentFormProps) {
  const form = useForm<FormData & { type: string }>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: assessment.title,
      description: assessment.description,
      dueDate: new Date(assessment.dueDate).toISOString().split('T')[0],
      totalMarks: assessment.totalMarks.toString(),
      instructions: assessment.instructions || '',
      type: assessment.type || '',
    },
  });

  const handleSubmit = async (data: FormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      toast.error('Failed to update assessment');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
        <FormField
          control={form.control}
          name='title'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='description'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='dueDate'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Due Date</FormLabel>
              <FormControl>
                <Input type='date' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='totalMarks'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Total Marks</FormLabel>
              <FormControl>
                <Input type='number' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='instructions'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instructions (Optional)</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='type'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assessment Type</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
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
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type='submit' disabled={isLoading}>
          {isLoading ? 'Updating...' : 'Update Assessment'}
        </Button>
      </form>
    </Form>
  );
}
