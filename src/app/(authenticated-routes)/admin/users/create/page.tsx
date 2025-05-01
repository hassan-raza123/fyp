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
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Step 1: Basic user information
const basicUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  phone_number: z.string().optional(),
});

// Step 2: Role and role-specific details
const roleSchema = z.object({
  roles: z.array(z.string()).min(1, 'At least one role is required'),
  studentDetails: z
    .object({
      rollNumber: z.string(),
      departmentId: z.string(),
      programId: z.string(),
    })
    .optional(),
  facultyDetails: z
    .object({
      departmentId: z.string(),
      designation: z.string(),
    })
    .optional(),
});

type BasicUserForm = z.infer<typeof basicUserSchema>;
type RoleForm = z.infer<typeof roleSchema>;

export default function CreateUser() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const basicForm = useForm<BasicUserForm>({
    resolver: zodResolver(basicUserSchema),
    defaultValues: {
      email: '',
      first_name: '',
      last_name: '',
      phone_number: '',
    },
  });

  const roleForm = useForm<RoleForm>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      roles: [],
      studentDetails: undefined,
      facultyDetails: undefined,
    },
  });

  const onSubmitBasic = async (values: BasicUserForm) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          password: '11223344', // Set default password
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      const data = await response.json();
      setUserId(data.data.id);
      setStep(2);
      toast.success('User created successfully');
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create user'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitRoles = async (values: RoleForm) => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Failed to assign roles');
      }

      toast.success('Roles assigned successfully');
      router.push('/admin/users');
    } catch (error) {
      console.error('Error assigning roles:', error);
      toast.error('Failed to assign roles');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='container mx-auto py-10'>
      <div className='p-6 space-y-6'>
        <div className='flex justify-between items-center'>
          <div>
            <h1 className='text-3xl font-bold'>
              {step === 1 ? 'Create New User' : 'Assign Roles'}
            </h1>
            <p className='text-muted-foreground'>
              {step === 1
                ? 'Add a new user to the system'
                : 'Assign roles and details to the user'}
            </p>
          </div>
        </div>

        {step === 1 ? (
          <Form {...basicForm}>
            <form
              onSubmit={basicForm.handleSubmit(onSubmitBasic)}
              className='space-y-6'
            >
              <Card className='p-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <FormField
                    control={basicForm.control}
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
                    control={basicForm.control}
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
                    control={basicForm.control}
                    name='email'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type='email'
                            placeholder='john@example.com'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={basicForm.control}
                    name='phone_number'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder='03001234567' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Card>

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
        ) : (
          <Form {...roleForm}>
            <form
              onSubmit={roleForm.handleSubmit(onSubmitRoles)}
              className='space-y-6'
            >
              <Card className='p-6'>
                <div className='space-y-6'>
                  <FormField
                    control={roleForm.control}
                    name='roles'
                    render={({ field }) => {
                      const selectedRoles = Array.isArray(field.value)
                        ? field.value
                        : [];

                      return (
                        <FormItem>
                          <FormLabel>Roles</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              if (selectedRoles.includes(value)) {
                                field.onChange(
                                  selectedRoles.filter((role) => role !== value)
                                );
                              } else {
                                field.onChange([...selectedRoles, value]);
                              }
                            }}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder='Select roles' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value='sub_admin'>
                                Sub Admin
                              </SelectItem>
                              <SelectItem value='department_admin'>
                                Department Admin
                              </SelectItem>
                              <SelectItem value='teacher'>Teacher</SelectItem>
                              <SelectItem value='student'>Student</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className='flex flex-wrap gap-2 mt-2'>
                            {selectedRoles.map((role) => (
                              <span
                                key={role}
                                className='px-2 py-1 bg-primary text-primary-foreground rounded-md text-sm'
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  {roleForm.watch('roles').includes('student') && (
                    <div className='space-y-4'>
                      <h3 className='text-lg font-medium'>Student Details</h3>
                      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                        <FormField
                          control={roleForm.control}
                          name='studentDetails.rollNumber'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Roll Number</FormLabel>
                              <FormControl>
                                <Input placeholder='2023-CS-001' {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={roleForm.control}
                          name='studentDetails.departmentId'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Department</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder='Select department' />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value='1'>
                                    Computer Science
                                  </SelectItem>
                                  <SelectItem value='2'>Mathematics</SelectItem>
                                  <SelectItem value='3'>Physics</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={roleForm.control}
                          name='studentDetails.programId'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Program</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder='Select program' />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value='1'>
                                    BS Computer Science
                                  </SelectItem>
                                  <SelectItem value='2'>
                                    BS Mathematics
                                  </SelectItem>
                                  <SelectItem value='3'>BS Physics</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  {(roleForm.watch('roles').includes('teacher') ||
                    roleForm.watch('roles').includes('department_admin')) && (
                    <div className='space-y-4'>
                      <h3 className='text-lg font-medium'>Faculty Details</h3>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <FormField
                          control={roleForm.control}
                          name='facultyDetails.departmentId'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Department</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder='Select department' />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value='1'>
                                    Computer Science
                                  </SelectItem>
                                  <SelectItem value='2'>Mathematics</SelectItem>
                                  <SelectItem value='3'>Physics</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={roleForm.control}
                          name='facultyDetails.designation'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Designation</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder={
                                    roleForm
                                      .watch('roles')
                                      .includes('department_admin')
                                      ? 'Department Admin'
                                      : 'Professor'
                                  }
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              <div className='flex justify-end gap-4'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button type='submit' disabled={isLoading}>
                  {isLoading ? 'Assigning Roles...' : 'Assign Roles'}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
}
