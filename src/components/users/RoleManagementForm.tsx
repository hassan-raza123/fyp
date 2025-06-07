'use client';

import { useEffect, useState } from 'react';
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
import { Loader2 } from 'lucide-react';

const roleSchema = z.object({
  role: z.string().min(1, 'Role is required'),
  facultyDetails: z
    .object({
      departmentId: z.string().min(1, 'Department is required'),
      designation: z.string().min(1, 'Designation is required'),
    })
    .optional()
    .nullable(),
});

type RoleForm = z.infer<typeof roleSchema>;

interface Department {
  id: number;
  name: string;
  code: string;
  status: 'active' | 'inactive';
}

interface RoleManagementFormProps {
  userId: string;
  mode: 'assign' | 'edit';
  onSuccess?: () => void;
}

export default function RoleManagementForm({
  userId,
  mode,
  onSuccess,
}: RoleManagementFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [fetchingDepartments, setFetchingDepartments] = useState(false);

  const form = useForm<RoleForm>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      role: '',
      facultyDetails: {
        departmentId: '',
        designation: '',
      },
    },
  });

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;

      try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }
        const data = await response.json();

        // Set existing role if any
        if (data.userrole && data.userrole.length > 0) {
          const currentRole = data.userrole[0].role.name;
          form.setValue('role', currentRole);

          // Set role-specific details based on current role
          if (
            (currentRole === 'teacher' || currentRole === 'department_admin') &&
            data.faculty
          ) {
            form.setValue('facultyDetails', {
              departmentId: String(data.faculty.departmentId || ''),
              designation: data.faculty.designation || '',
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        toast.error('Failed to fetch user details');
      }
    };

    const fetchDepartments = async () => {
      try {
        setFetchingDepartments(true);
        const response = await fetch('/api/departments');
        if (!response.ok) {
          throw new Error('Failed to fetch departments');
        }
        const data = await response.json();
        if (data.success) {
          setDepartments(data.data);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
        toast.error('Failed to fetch departments');
      } finally {
        setFetchingDepartments(false);
      }
    };

    if (mode === 'edit') {
      fetchUser();
    }
    fetchDepartments();
  }, [userId, mode, form]);

  const onSubmit = async (values: RoleForm) => {
    setIsLoading(true);
    try {
      // Create request body based on role
      const requestBody: any = {
        roles: [values.role],
      };

      // Add role-specific details only if they are required
      switch (values.role) {
        case 'teacher':
        case 'department_admin':
          if (
            !values.facultyDetails?.departmentId ||
            !values.facultyDetails?.designation
          ) {
            toast.error('Please fill in all required faculty details');
            setIsLoading(false);
            return;
          }
          requestBody.facultyDetails = values.facultyDetails;
          break;

        case 'sub_admin':
          // No additional details needed for sub_admin
          break;
      }

      console.log('Submitting form with data:', requestBody);

      const response = await fetch(`/api/users/${userId}/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to assign role');
      }

      if (!responseData.success) {
        throw new Error(responseData.error || 'Failed to assign role');
      }

      toast.success(
        mode === 'assign'
          ? 'Role assigned successfully'
          : 'Role updated successfully'
      );

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/admin/users');
      }
    } catch (error) {
      console.error('Error managing role:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to manage role'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='p-6'>
      <Card>
        <div className='p-6'>
          <h2 className='text-2xl font-bold mb-6'>
            {mode === 'assign' ? 'Assign Role' : 'Edit Role'}
          </h2>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <FormField
                control={form.control}
                name='role'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Role <span className='text-red-500'>*</span>
                    </FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Clear role-specific details when role changes
                        form.setValue('facultyDetails', null);
                      }}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select a role' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='sub_admin'>Sub Admin</SelectItem>
                        <SelectItem value='department_admin'>
                          Department Admin
                        </SelectItem>
                        <SelectItem value='teacher'>Teacher</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(form.watch('role') === 'teacher' ||
                form.watch('role') === 'department_admin') && (
                <div className='space-y-4 border rounded-lg p-4'>
                  <h3 className='text-lg font-medium'>Faculty Details</h3>
                  <FormField
                    control={form.control}
                    name='facultyDetails.departmentId'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Department <span className='text-red-500'>*</span>
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={fetchingDepartments}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder='Select department' />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem
                                key={dept.id}
                                value={dept.id.toString()}
                              >
                                {dept.name} ({dept.code})
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
                    name='facultyDetails.designation'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Designation <span className='text-red-500'>*</span>
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder='Enter designation' />
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
                >
                  Cancel
                </Button>
                <Button type='submit' disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      {mode === 'assign' ? 'Assigning...' : 'Updating...'}
                    </>
                  ) : mode === 'assign' ? (
                    'Assign Role'
                  ) : (
                    'Update Role'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </Card>
    </div>
  );
}
