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
import { useParams } from 'next/navigation';

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

type RoleForm = z.infer<typeof roleSchema>;

interface Department {
  id: number;
  name: string;
  code: string;
  status: 'active' | 'inactive';
}

export default function AssignRoles() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [fetchingDepartments, setFetchingDepartments] = useState(false);

  const roleForm = useForm<RoleForm>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      roles: [],
      studentDetails: {
        rollNumber: '',
        departmentId: '',
        programId: '',
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
        setUser(data);

        // Set existing roles and details if any
        if (data.userrole) {
          const existingRoles = data.userrole.map((ur: any) => ur.role.name);
          roleForm.setValue('roles', existingRoles);
        }

        // Safely set student details if they exist
        if (
          data.student &&
          data.student.rollNumber &&
          data.student.departmentId &&
          data.student.programId
        ) {
          roleForm.setValue('studentDetails', {
            rollNumber: data.student.rollNumber,
            departmentId: String(data.student.departmentId),
            programId: String(data.student.programId),
          });
        }

        // Safely set faculty details if they exist
        if (
          data.faculty &&
          data.faculty.departmentId &&
          data.faculty.designation
        ) {
          roleForm.setValue('facultyDetails', {
            departmentId: String(data.faculty.departmentId),
            designation: data.faculty.designation,
          });
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

    fetchUser();
    fetchDepartments();
  }, [userId]);

  const onSubmit = async (values: RoleForm) => {
    setIsLoading(true);
    try {
      // Validate role-specific details
      if (values.roles.includes('student') && !values.studentDetails) {
        toast.error('Student details are required for student role');
        return;
      }

      if (
        (values.roles.includes('teacher') ||
          values.roles.includes('department_admin')) &&
        !values.facultyDetails
      ) {
        toast.error(
          'Faculty details are required for teacher/department admin role'
        );
        return;
      }

      const response = await fetch(`/api/users/${userId}/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to assign roles';

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

      toast.success('Roles assigned successfully');
      router.push('/admin/users');
    } catch (error) {
      console.error('Error assigning roles:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to assign roles'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className='container mx-auto py-10'>
      <div className='p-6 space-y-6'>
        <div className='flex justify-between items-center'>
          <div>
            <h1 className='text-3xl font-bold'>
              Assign Roles to {user?.first_name} {user?.last_name}
            </h1>
            <p className='text-muted-foreground'>
              Assign roles and details to the user
            </p>
          </div>
        </div>

        <Form {...roleForm}>
          <form
            onSubmit={roleForm.handleSubmit(onSubmit)}
            className='space-y-6'
          >
            <Card className='p-6'>
              <div className='space-y-6'>
                <FormField
                  control={roleForm.control}
                  name='roles'
                  render={({ field }) => {
                    const selectedRoles = field.value || [];
                    const availableRoles = [
                      { value: 'sub_admin', label: 'Sub Admin' },
                      { value: 'department_admin', label: 'Department Admin' },
                      { value: 'teacher', label: 'Teacher' },
                      { value: 'student', label: 'Student' },
                    ].filter((role) => !selectedRoles.includes(role.value));

                    return (
                      <FormItem>
                        <FormLabel>Roles</FormLabel>
                        <div className='space-y-4'>
                          {selectedRoles.length > 0 && (
                            <div className='flex flex-wrap gap-2'>
                              {selectedRoles.map((role) => (
                                <div
                                  key={role}
                                  className='flex items-center gap-2 px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm'
                                >
                                  <span>{role}</span>
                                  <button
                                    type='button'
                                    onClick={() => {
                                      const newRoles = selectedRoles.filter(
                                        (r) => r !== role
                                      );
                                      field.onChange(newRoles);
                                    }}
                                    className='hover:text-red-500'
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {availableRoles.length > 0 && (
                            <Select
                              onValueChange={(value) => {
                                field.onChange([...selectedRoles, value]);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder='Select a role' />
                              </SelectTrigger>
                              <SelectContent>
                                {availableRoles.map((role) => (
                                  <SelectItem
                                    key={role.value}
                                    value={role.value}
                                  >
                                    {role.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </FormItem>
                    );
                  }}
                />

                {roleForm.watch('roles').includes('student') && (
                  <div className='space-y-4'>
                    <h3 className='text-lg font-medium'>Student Details</h3>
                    <FormField
                      control={roleForm.control}
                      name='studentDetails.rollNumber'
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
                      control={roleForm.control}
                      name='studentDetails.departmentId'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
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
                      control={roleForm.control}
                      name='studentDetails.programId'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Program</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {(roleForm.watch('roles').includes('teacher') ||
                  roleForm.watch('roles').includes('department_admin')) && (
                  <div className='space-y-4'>
                    <h3 className='text-lg font-medium'>Faculty Details</h3>
                    <FormField
                      control={roleForm.control}
                      name='facultyDetails.departmentId'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
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
                      control={roleForm.control}
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
              </div>
            </Card>

            <div className='flex justify-end'>
              <Button type='submit' disabled={isLoading}>
                {isLoading ? 'Assigning...' : 'Assign Roles'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
