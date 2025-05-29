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
  studentDetails: z
    .object({
      rollNumber: z.string().min(1, 'Roll number is required'),
      departmentId: z.string().min(1, 'Department is required'),
      programId: z.string().min(1, 'Program is required'),
      batchId: z.string().min(1, 'Batch is required'),
    })
    .optional(),
  facultyDetails: z
    .object({
      departmentId: z.string(),
      designation: z.string(),
    })
    .optional(),
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
  const [programs, setPrograms] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [fetchingDepartments, setFetchingDepartments] = useState(false);
  const [fetchingPrograms, setFetchingPrograms] = useState(false);
  const [fetchingBatches, setFetchingBatches] = useState(false);

  const form = useForm<RoleForm>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      role: '',
      studentDetails: {
        rollNumber: '',
        departmentId: '',
        programId: '',
        batchId: '',
      },
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
          if (currentRole === 'student' && data.student) {
            form.setValue('studentDetails', {
              rollNumber: data.student.rollNumber || '',
              departmentId: String(data.student.departmentId || ''),
              programId: String(data.student.programId || ''),
              batchId: String(data.student.batchId || ''),
            });
          } else if (
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

  const fetchPrograms = async (departmentId: string) => {
    try {
      setFetchingPrograms(true);
      const response = await fetch(`/api/departments/${departmentId}/programs`);
      if (!response.ok) {
        throw new Error('Failed to fetch programs');
      }
      const data = await response.json();
      if (data.success) {
        setPrograms(data.data);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
      toast.error('Failed to fetch programs');
    } finally {
      setFetchingPrograms(false);
    }
  };

  const fetchBatches = async (programId: string) => {
    try {
      setFetchingBatches(true);
      const response = await fetch(`/api/programs/${programId}/batches`);
      if (!response.ok) {
        throw new Error('Failed to fetch batches');
      }
      const data = await response.json();
      if (data.success) {
        setBatches(data.data);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast.error('Failed to fetch batches');
    } finally {
      setFetchingBatches(false);
    }
  };

  // Watch for department and program changes
  const selectedDepartmentId = form.watch('studentDetails.departmentId');
  const selectedProgramId = form.watch('studentDetails.programId');

  useEffect(() => {
    if (selectedDepartmentId) {
      fetchPrograms(selectedDepartmentId);
    } else {
      setPrograms([]);
      form.setValue('studentDetails.programId', '');
    }
  }, [selectedDepartmentId]);

  useEffect(() => {
    if (selectedProgramId) {
      fetchBatches(selectedProgramId);
    } else {
      setBatches([]);
      form.setValue('studentDetails.batchId', '');
    }
  }, [selectedProgramId]);

  const onSubmit = async (values: RoleForm) => {
    setIsLoading(true);
    try {
      // Validate role-specific details
      if (values.role === 'student' && !values.studentDetails) {
        toast.error('Student details are required for student role');
        setIsLoading(false);
        return;
      }

      if (
        (values.role === 'teacher' || values.role === 'department_admin') &&
        !values.facultyDetails
      ) {
        toast.error(
          'Faculty details are required for teacher/department admin role'
        );
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/users/${userId}/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roles: [values.role],
          studentDetails:
            values.role === 'student' ? values.studentDetails : undefined,
          facultyDetails:
            values.role === 'teacher' || values.role === 'department_admin'
              ? values.facultyDetails
              : undefined,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to assign role';

        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const responseData = await response.json();

      if (responseData.error) {
        throw new Error(responseData.error);
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
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Clear role-specific details when role changes
                        if (value !== 'student') {
                          form.setValue('studentDetails', {
                            rollNumber: '',
                            departmentId: '',
                            programId: '',
                            batchId: '',
                          });
                        }
                        if (
                          value !== 'teacher' &&
                          value !== 'department_admin'
                        ) {
                          form.setValue('facultyDetails', {
                            departmentId: '',
                            designation: '',
                          });
                        }
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
                        <SelectItem value='student'>Student</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch('role') === 'student' && (
                <div className='space-y-4'>
                  <h3 className='text-lg font-medium'>Student Details</h3>
                  <FormField
                    control={form.control}
                    name='studentDetails.rollNumber'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Roll Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder='Enter roll number' />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='studentDetails.departmentId'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue('studentDetails.programId', '');
                            form.setValue('studentDetails.batchId', '');
                          }}
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
                    name='studentDetails.programId'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Program</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue('studentDetails.batchId', '');
                          }}
                          value={field.value}
                          disabled={fetchingPrograms || !selectedDepartmentId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder='Select program' />
                          </SelectTrigger>
                          <SelectContent>
                            {programs.map((program) => (
                              <SelectItem
                                key={program.id}
                                value={program.id.toString()}
                              >
                                {program.name} ({program.code})
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
                    name='studentDetails.batchId'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Batch</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={fetchingBatches || !selectedProgramId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder='Select batch' />
                          </SelectTrigger>
                          <SelectContent>
                            {batches.map((batch) => (
                              <SelectItem key={batch.id} value={batch.id}>
                                {batch.name} ({batch.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {(form.watch('role') === 'teacher' ||
                form.watch('role') === 'department_admin') && (
                <div className='space-y-4'>
                  <h3 className='text-lg font-medium'>Faculty Details</h3>
                  <FormField
                    control={form.control}
                    name='facultyDetails.departmentId'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
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
                        <FormLabel>Designation</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
