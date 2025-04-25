'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

const formSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    first_name: z.string().min(2, 'First name must be at least 2 characters'),
    last_name: z.string().min(2, 'Last name must be at least 2 characters'),
    role: z.enum([
      'sub_admin',
      'department_admin',
      'child_admin',
      'teacher',
      'student',
    ]),
    departmentId: z.string().optional(),
    programId: z.string().optional(),
    employeeId: z.string().optional(),
    rollNumber: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Validate departmentId
    if (
      ['teacher', 'student', 'department_admin'].includes(data.role) &&
      !data.departmentId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Department is required for this role',
        path: ['departmentId'],
      });
    }

    // Validate programId
    if (['student', 'child_admin'].includes(data.role) && !data.programId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Program is required for this role',
        path: ['programId'],
      });
    }

    // Validate employeeId
    if (data.role === 'teacher' && !data.employeeId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Employee ID is required for teachers',
        path: ['employeeId'],
      });
    }

    // Validate rollNumber
    if (data.role === 'student' && !data.rollNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Roll Number is required for students',
        path: ['rollNumber'],
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

export default function CreateUser() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      first_name: '',
      last_name: '',
      role: 'student',
      departmentId: '',
      programId: '',
      employeeId: '',
      rollNumber: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      toast.success('User created successfully');
      router.push('/admin/users');
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='container mx-auto py-10'>
      <div className='p-6 space-y-6'>
        <div className='flex justify-between items-center'>
          <div>
            <h1 className='text-3xl font-bold'>Create New User</h1>
            <p className='text-muted-foreground'>
              Add a new user to the system
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <FormField
                control={form.control}
                name='first_name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder='John' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='last_name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Doe' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder='john@example.com' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='role'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <select
                        className='w-full p-2 border rounded-md'
                        {...field}
                      >
                        <option value='sub_admin'>Sub Admin</option>
                        <option value='department_admin'>
                          Department Admin
                        </option>
                        <option value='child_admin'>Child Admin</option>
                        <option value='teacher'>Teacher</option>
                        <option value='student'>Student</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {form.watch('role') === 'teacher' && (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <FormField
                  control={form.control}
                  name='employeeId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee ID</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='departmentId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <select
                          className='w-full p-2 border rounded-md'
                          {...field}
                        >
                          <option value='1'>Computer Science</option>
                          <option value='2'>Mathematics</option>
                          <option value='3'>Physics</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {form.watch('role') === 'student' && (
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                <FormField
                  control={form.control}
                  name='rollNumber'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Roll Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='departmentId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <select
                          className='w-full p-2 border rounded-md'
                          {...field}
                        >
                          <option value='1'>Computer Science</option>
                          <option value='2'>Mathematics</option>
                          <option value='3'>Physics</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='programId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Program</FormLabel>
                      <FormControl>
                        <select
                          className='w-full p-2 border rounded-md'
                          {...field}
                        >
                          <option value='1'>BS Computer Science</option>
                          <option value='2'>BS Mathematics</option>
                          <option value='3'>BS Physics</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className='flex justify-end gap-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => router.push('/admin/users')}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
