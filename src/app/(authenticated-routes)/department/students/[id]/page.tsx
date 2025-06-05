'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DialogTrigger } from '@/components/ui/dialog';
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';

interface Batch {
  id: string;
  name: string;
}

interface Department {
  id: number;
  name: string;
}

interface Program {
  id: number;
  name: string;
}

interface Section {
  id: number;
  name: string;
  courseOffering: {
    course: {
      name: string;
      code: string;
    };
  };
}

interface Student {
  id: number;
  rollNumber: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  batch: {
    id: string;
    name: string;
  } | null;
  department: {
    id: number;
    name: string;
  } | null;
  program: {
    id: number;
    name: string;
  } | null;
  status: 'active' | 'inactive';
  sections: Section[];
  studentsections: {
    id: number;
    section: {
      id: number;
      name: string;
      courseOffering: {
        course: {
          code: string;
          name: string;
        };
        semester: {
          name: string;
        };
      };
    };
  }[];
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  rollNumber: string;
  batchId: string;
  departmentId: string;
  programId: string;
  status: 'active' | 'inactive';
}

const formSchema = z.object({
  sectionId: z.string().min(1, 'Section is required'),
});

export default function StudentDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    rollNumber: '',
    batchId: '',
    departmentId: '',
    programId: '',
    status: 'active',
  });
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    fetchStudent();
    fetchBatches();
    fetchDepartments();
  }, [id]);

  useEffect(() => {
    if (formData.departmentId) {
      fetchPrograms(formData.departmentId);
    }
  }, [formData.departmentId]);

  const fetchStudent = async () => {
    try {
      const response = await fetch(`/api/students/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch student');
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch student');
      }
      setStudent(data.data);
      setFormData({
        firstName: data.data.user.firstName,
        lastName: data.data.user.lastName,
        email: data.data.user.email,
        rollNumber: data.data.rollNumber,
        batchId: data.data.batch?.id || '',
        departmentId: data.data.department?.id.toString() || '',
        programId: data.data.program?.id.toString() || '',
        status: data.data.status,
      });
    } catch (error) {
      console.error('Error fetching student:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to fetch student'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/batches?status=active');
      if (!response.ok) {
        throw new Error('Failed to fetch batches');
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch batches');
      }
      setBatches(data.data);
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to fetch batches'
      );
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch departments');
      }
      setDepartments(data.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to fetch departments'
      );
    }
  };

  const fetchPrograms = async (departmentId: string) => {
    try {
      const response = await fetch(`/api/departments/${departmentId}/programs`);
      if (!response.ok) {
        throw new Error('Failed to fetch programs');
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch programs');
      }
      setPrograms(data.data);
    } catch (error) {
      console.error('Error fetching programs:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to fetch programs'
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/students/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          departmentId: formData.departmentId
            ? parseInt(formData.departmentId)
            : null,
          programId: formData.programId ? parseInt(formData.programId) : null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update student');
      }

      toast.success('Student updated successfully');
      fetchStudent();
      setEditing(false);
    } catch (error) {
      console.error('Error updating student:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update student'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);

    try {
      const response = await fetch(`/api/students/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete student');
      }

      toast.success('Student deleted successfully');
      router.push('/admin/students');
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete student'
      );
    } finally {
      setDeleting(false);
    }
  };

  // Fetch available sections for the student's batch
  const { data: sections } = useQuery({
    queryKey: ['sections', student?.batch.id],
    queryFn: async () => {
      if (!student?.batch.id) return [];
      const response = await fetch(`/api/sections?batchId=${student.batch.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sections');
      }
      const data = await response.json();
      return data.data;
    },
    enabled: !!student?.batch.id,
  });

  const addSection = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const response = await fetch(
        `/api/sections/${values.sectionId}/students`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ studentId: params.id }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add student to section');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students', params.id] });
      setOpen(false);
      form.reset();
      toast.success('Student added to section successfully');
      fetchStudent();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    addSection.mutate(values);
  }

  if (loading) {
    return (
      <div className='container mx-auto py-10'>
        <div className='flex items-center justify-center h-[50vh]'>
          <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className='container mx-auto py-10'>
        <div className='flex items-center justify-center h-[50vh]'>
          <p className='text-muted-foreground'>Student not found</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-gray-500';
      case 'suspended':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className='container mx-auto py-10'>
      <div className='flex items-center gap-4 mb-6'>
        <Button
          variant='ghost'
          size='icon'
          onClick={() => router.push('/admin/students')}
        >
          <ArrowLeft className='h-4 w-4' />
        </Button>
        <div>
          <h1 className='text-3xl font-bold'>
            {student.user.firstName} {student.user.lastName}
          </h1>
          <p className='text-muted-foreground'>
            Roll Number: {student.rollNumber}
          </p>
        </div>
      </div>

      <div className='grid gap-6'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between'>
            <CardTitle>Student Information</CardTitle>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setEditing(!editing)}
                disabled={saving}
              >
                <Pencil className='h-4 w-4 mr-2' />
                {editing ? 'Cancel' : 'Edit'}
              </Button>
              <Button
                variant='destructive'
                size='sm'
                onClick={() => setShowDeleteDialog(true)}
                disabled={editing || saving}
              >
                <Trash2 className='h-4 w-4 mr-2' />
                Delete
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {editing ? (
              <form onSubmit={handleSubmit} className='space-y-6'>
                <div className='grid grid-cols-2 gap-6'>
                  <div className='space-y-2'>
                    <Label htmlFor='firstName'>First Name</Label>
                    <Input
                      id='firstName'
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='lastName'>Last Name</Label>
                    <Input
                      id='lastName'
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='email'>Email</Label>
                    <Input
                      id='email'
                      type='email'
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='rollNumber'>Roll Number</Label>
                    <Input
                      id='rollNumber'
                      value={formData.rollNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, rollNumber: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='departmentId'>Department</Label>
                    <Select
                      value={formData.departmentId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, departmentId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select department' />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((department) => (
                          <SelectItem
                            key={department.id}
                            value={department.id.toString()}
                          >
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='programId'>Program</Label>
                    <Select
                      value={formData.programId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, programId: value })
                      }
                      disabled={!formData.departmentId}
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
                            {program.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='batchId'>Batch</Label>
                    <Select
                      value={formData.batchId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, batchId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select batch' />
                      </SelectTrigger>
                      <SelectContent>
                        {batches.map((batch) => (
                          <SelectItem key={batch.id} value={batch.id}>
                            {batch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='status'>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: 'active' | 'inactive') =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select status' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='active'>Active</SelectItem>
                        <SelectItem value='inactive'>Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className='flex justify-end gap-4'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setEditing(false)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button type='submit' disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <div className='grid grid-cols-2 gap-6'>
                <div>
                  <h3 className='text-sm font-medium text-muted-foreground'>
                    Name
                  </h3>
                  <p className='mt-1'>
                    {student.user.firstName} {student.user.lastName}
                  </p>
                </div>

                <div>
                  <h3 className='text-sm font-medium text-muted-foreground'>
                    Email
                  </h3>
                  <p className='mt-1'>{student.user.email}</p>
                </div>

                <div>
                  <h3 className='text-sm font-medium text-muted-foreground'>
                    Roll Number
                  </h3>
                  <p className='mt-1'>{student.rollNumber}</p>
                </div>

                <div>
                  <h3 className='text-sm font-medium text-muted-foreground'>
                    Department
                  </h3>
                  <p className='mt-1'>
                    {student.department?.name || 'Not assigned'}
                  </p>
                </div>

                <div>
                  <h3 className='text-sm font-medium text-muted-foreground'>
                    Program
                  </h3>
                  <p className='mt-1'>
                    {student.program?.name || 'Not assigned'}
                  </p>
                </div>

                <div>
                  <h3 className='text-sm font-medium text-muted-foreground'>
                    Batch
                  </h3>
                  <p className='mt-1'>
                    {student.batch?.name || 'Not assigned'}
                  </p>
                </div>

                <div>
                  <h3 className='text-sm font-medium text-muted-foreground'>
                    Status
                  </h3>
                  <Badge
                    className={`mt-1 ${getStatusColor(student.status)}`}
                    variant='secondary'
                  >
                    {student.status}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle>Enrolled Sections</CardTitle>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className='w-4 h-4 mr-2' />
                    Add Section
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Student to Section</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className='space-y-4'
                    >
                      <FormField
                        control={form.control}
                        name='sectionId'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Section</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder='Select a section' />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {sections?.map((section: any) => (
                                  <SelectItem
                                    key={section.id}
                                    value={section.id.toString()}
                                  >
                                    {section.name} -{' '}
                                    {section.courseOffering.course.code} (
                                    {section.courseOffering.semester.name})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type='submit'
                        className='w-full'
                        disabled={addSection.isPending}
                      >
                        {addSection.isPending ? 'Adding...' : 'Add Section'}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Section</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {student.studentsections.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className='text-center'>
                        No sections enrolled
                      </TableCell>
                    </TableRow>
                  ) : (
                    student.studentsections.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell>{enrollment.section.name}</TableCell>
                        <TableCell>
                          {enrollment.section.courseOffering.course.code} -{' '}
                          {enrollment.section.courseOffering.course.name}
                        </TableCell>
                        <TableCell>
                          {enrollment.section.courseOffering.semester.name}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={async () => {
                              try {
                                const response = await fetch(
                                  `/api/sections/${enrollment.section.id}/students?studentId=${params.id}`,
                                  {
                                    method: 'DELETE',
                                  }
                                );
                                if (!response.ok) {
                                  throw new Error('Failed to remove student');
                                }
                                toast.success(
                                  'Student removed from section successfully'
                                );
                                fetchStudent();
                              } catch (error) {
                                console.error('Error removing student:', error);
                                toast.error(
                                  error instanceof Error
                                    ? error.message
                                    : 'Failed to remove student'
                                );
                              }
                            }}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Student</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this student? This action cannot
              be undone.
              {student.sections.length > 0 && (
                <span className='block text-red-500 mt-2'>
                  Warning: This student is enrolled in {student.sections.length}{' '}
                  section(s). You must remove them from all sections before
                  deleting.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={handleDelete}
              disabled={deleting || student.sections.length > 0}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
