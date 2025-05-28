'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  courseId: z.string().min(1, 'Course is required'),
  facultyId: z.string().optional(),
  semester: z.string().min(1, 'Semester is required'),
  maxStudents: z.string().min(1, 'Max students is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
});

export function CreateSectionDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      courseId: '',
      facultyId: '',
      semester: '',
      maxStudents: '',
      startDate: '',
      endDate: '',
    },
  });

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const response = await fetch('/api/courses');
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      return response.json();
    },
  });

  const { data: faculties } = useQuery({
    queryKey: ['faculties'],
    queryFn: async () => {
      const response = await fetch('/api/faculties');
      if (!response.ok) {
        throw new Error('Failed to fetch faculties');
      }
      return response.json();
    },
  });

  const createSection = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const response = await fetch('/api/sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          courseId: parseInt(values.courseId),
          facultyId: values.facultyId ? parseInt(values.facultyId) : null,
          semester: parseInt(values.semester),
          maxStudents: parseInt(values.maxStudents),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create section');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      setOpen(false);
      form.reset();
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createSection.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Section</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Section</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Section Name</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g., Section A' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='courseId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select a course' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {courses?.map((course: any) => (
                        <SelectItem
                          key={course.id}
                          value={course.id.toString()}
                        >
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='facultyId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Faculty</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select a faculty' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {faculties?.map((faculty: any) => (
                        <SelectItem
                          key={faculty.id}
                          value={faculty.id.toString()}
                        >
                          {`${faculty.user.first_name} ${faculty.user.last_name}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='semester'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Semester</FormLabel>
                  <FormControl>
                    <Input type='number' min='1' max='8' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='maxStudents'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Students</FormLabel>
                  <FormControl>
                    <Input type='number' min='1' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='startDate'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input type='date' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='endDate'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <Input type='date' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type='submit' className='w-full'>
              Create Section
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
