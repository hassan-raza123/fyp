'use client';

import { useState, useEffect, use } from 'react';
import { notFound } from 'next/navigation';
import { department_status } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Users,
  GraduationCap,
  BookOpen,
  Pencil,
  UserPlus,
  UserMinus,
} from 'lucide-react';
import Link from 'next/link';
import { EditFacultyModal } from '../components/EditFacultyModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface Faculty {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  designation: string;
  status: string;
}

interface Department {
  id: number;
  name: string;
  code: string;
  description: string | null;
  status: department_status;
  createdAt: Date;
  updatedAt: Date;
  adminId: number | null;
  _count: {
    faculty: number;
    students: number;
    courses: number;
  };
}

interface Program {
  id: number;
  name: string;
  code: string;
  _count: {
    students: number;
  };
}

export default function DepartmentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [isEditFacultyModalOpen, setIsEditFacultyModalOpen] = useState(false);
  const [department, setDepartment] = useState<Department | null>(null);
  const [formattedAdmins, setFormattedAdmins] = useState<any[]>([]);
  const [formattedFaculty, setFormattedFaculty] = useState<Faculty[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isChangingHOD, setIsChangingHOD] = useState(false);
  const [selectedHOD, setSelectedHOD] = useState<string>('');
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    async function fetchDepartmentData() {
      try {
        const departmentId = parseInt(id);
        if (isNaN(departmentId)) {
          throw new Error('Invalid department ID');
        }

        const response = await fetch(`/api/departments/${departmentId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch department');
        }
        const data = await response.json();
        setDepartment(data.department);
        setFormattedAdmins(data.admins);
        setFormattedFaculty(data.faculty);
        setPrograms(data.programs || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchDepartmentData();
  }, [id]);

  const fetchAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch('/api/departments/users/available');
      if (!response.ok) {
        throw new Error('Failed to fetch available users');
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch available users');
      }
      setAvailableUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching available users:', error);
      toast.error('Failed to fetch available users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleChangeHOD = async () => {
    if (!selectedHOD) {
      toast.error('Please select a user');
      return;
    }

    try {
      // First assign the department admin role with faculty details
      const roleResponse = await fetch(`/api/users/${selectedHOD}/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roles: ['department_admin'],
          facultyDetails: {
            departmentId: parseInt(id),
            designation: 'Department Admin',
            status: 'active',
          },
        }),
      });

      if (!roleResponse.ok) {
        const errorData = await roleResponse.json();
        throw new Error(
          errorData.error || 'Failed to assign department admin role'
        );
      }

      // Then update the department's admin
      const deptResponse = await fetch(`/api/departments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: department?.name,
          code: department?.code,
          description: department?.description,
          status: department?.status,
          adminId: parseInt(selectedHOD),
        }),
      });

      if (!deptResponse.ok) {
        const errorData = await deptResponse.json();
        throw new Error(errorData.error || 'Failed to update department head');
      }

      toast.success('Department head updated successfully');
      setIsChangingHOD(false);
      setSelectedHOD('');
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Error updating department head:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update department head'
      );
    }
  };

  const handleRemoveFaculty = async (facultyId: number) => {
    if (
      !confirm(
        'Are you sure you want to remove this faculty member? This will remove their faculty record entirely and revoke ALL their roles from the system. The user account will remain but will have no assigned role.'
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/faculty/${facultyId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Get the response text
      const responseText = await response.text();

      // Try to parse it as JSON
      let result;
      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(result?.error || 'Failed to remove faculty member');
      }

      if (result?.success) {
        toast.success(
          'Faculty member removed successfully and all roles revoked'
        );
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        throw new Error(result?.error || 'Failed to remove faculty member');
      }
    } catch (error) {
      console.error('Error removing faculty member:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to remove faculty member'
      );
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error || !department) {
    return <div>Error: {error || 'Department not found'}</div>;
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='mb-6'>
        <Link
          href='/admin/departments'
          className='inline-flex items-center text-sm text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='mr-2 h-4 w-4' />
          Back to Departments
        </Link>
      </div>

      <div className='grid gap-6'>
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle className='text-2xl'>{department.name}</CardTitle>
                <CardDescription>
                  Department Code: {department.code}
                </CardDescription>
              </div>
              <Badge
                variant={
                  department.status === 'active' ? 'default' : 'secondary'
                }
              >
                {department.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className='grid gap-6 md:grid-cols-3'>
              <div className='flex items-center gap-4'>
                <div className='rounded-full bg-primary/10 p-3'>
                  <Users className='h-6 w-6 text-primary' />
                </div>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Faculty Members
                  </p>
                  <p className='text-2xl font-bold'>
                    {department._count.faculty}
                  </p>
                </div>
              </div>
              <div className='flex items-center gap-4'>
                <div className='rounded-full bg-primary/10 p-3'>
                  <GraduationCap className='h-6 w-6 text-primary' />
                </div>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Students
                  </p>
                  <p className='text-2xl font-bold'>
                    {department._count.students}
                  </p>
                </div>
              </div>
              <div className='flex items-center gap-4'>
                <div className='rounded-full bg-primary/10 p-3'>
                  <BookOpen className='h-6 w-6 text-primary' />
                </div>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Courses
                  </p>
                  <p className='text-2xl font-bold'>
                    {department._count.courses}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue='overview'>
          <TabsList>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='faculty'>Faculty</TabsTrigger>
            <TabsTrigger value='programs'>Programs</TabsTrigger>
          </TabsList>

          <TabsContent value='overview'>
            <Card>
              <CardHeader>
                <CardTitle>Department Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-6'>
                  <div>
                    <h3 className='text-lg font-semibold'>Description</h3>
                    <p className='mt-1 text-muted-foreground'>
                      {department.description || 'No description available'}
                    </p>
                  </div>

                  <div>
                    <div className='flex items-center justify-between'>
                      <h3 className='text-lg font-semibold'>
                        Head of Department
                      </h3>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => {
                          setIsChangingHOD(!isChangingHOD);
                          if (!isChangingHOD) {
                            fetchAvailableUsers();
                          }
                        }}
                      >
                        {isChangingHOD ? 'Cancel' : 'Change HOD'}
                      </Button>
                    </div>
                    {isChangingHOD ? (
                      <div className='mt-4 space-y-4'>
                        <Select
                          value={selectedHOD}
                          onValueChange={setSelectedHOD}
                          disabled={loadingUsers}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder='Select new HOD' />
                          </SelectTrigger>
                          <SelectContent>
                            {loadingUsers ? (
                              <SelectItem value='loading' disabled>
                                Loading users...
                              </SelectItem>
                            ) : availableUsers.length === 0 ? (
                              <SelectItem value='none' disabled>
                                No available users
                              </SelectItem>
                            ) : (
                              availableUsers.map((user) => (
                                <SelectItem
                                  key={user.id}
                                  value={user.id.toString()}
                                >
                                  {`${user.first_name} ${user.last_name}`}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={handleChangeHOD}
                          disabled={!selectedHOD || loadingUsers}
                        >
                          Update HOD
                        </Button>
                      </div>
                    ) : (
                      <div className='mt-1'>
                        {department.adminId ? (
                          <div>
                            <p className='font-medium'>
                              {`${
                                formattedAdmins.find(
                                  (admin) => admin.id === department.adminId
                                )?.first_name
                              } ${
                                formattedAdmins.find(
                                  (admin) => admin.id === department.adminId
                                )?.last_name
                              }`}
                            </p>
                            <p className='text-sm text-muted-foreground'>
                              {
                                formattedAdmins.find(
                                  (admin) => admin.id === department.adminId
                                )?.email
                              }
                            </p>
                          </div>
                        ) : (
                          <p className='mt-1 text-muted-foreground'>
                            No head of department assigned
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='faculty'>
            <Card>
              <CardHeader>
                <CardTitle>Faculty Members</CardTitle>
              </CardHeader>
              <CardContent>
                {department._count.faculty > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Designation</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className='text-right'>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formattedFaculty.map((faculty) => (
                        <TableRow key={faculty.id}>
                          <TableCell>{`${faculty.first_name} ${faculty.last_name}`}</TableCell>
                          <TableCell>{faculty.email}</TableCell>
                          <TableCell>{faculty.designation}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                faculty.status === 'active'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {faculty.status}
                            </Badge>
                          </TableCell>
                          <TableCell className='text-right space-x-2'>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => {
                                setSelectedFaculty(faculty);
                                setIsEditFacultyModalOpen(true);
                              }}
                            >
                              <Pencil className='h-4 w-4' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleRemoveFaculty(faculty.id)}
                            >
                              <UserMinus className='h-4 w-4 text-destructive' />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className='text-center text-muted-foreground py-4'>
                    No faculty members found
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='programs'>
            <Card>
              <CardHeader>
                <CardTitle>Programs</CardTitle>
              </CardHeader>
              <CardContent>
                {programs.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Students</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {programs.map((program) => (
                        <TableRow key={program.id}>
                          <TableCell>{program.name}</TableCell>
                          <TableCell>{program.code}</TableCell>
                          <TableCell>{program._count.students}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className='text-center text-muted-foreground py-4'>
                    No programs found
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {selectedFaculty && (
          <EditFacultyModal
            open={isEditFacultyModalOpen}
            onClose={() => {
              setIsEditFacultyModalOpen(false);
              setSelectedFaculty(null);
            }}
            onSuccess={() => {
              setIsEditFacultyModalOpen(false);
              setSelectedFaculty(null);
              // Refresh the page to show updated data
              window.location.reload();
            }}
            faculty={selectedFaculty}
          />
        )}
      </div>
    </div>
  );
}
