'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2 } from 'lucide-react';

const formSchema = z.object({
  studentId: z.string().min(1, 'Please select a student'),
});

interface Student {
  id: number;
  rollNumber: string;
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface StudentSection {
  id: number;
  studentId: number;
  status: 'active' | 'inactive';
  student: {
    id: number;
    rollNumber: string;
    user: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

interface Section {
  id: number;
  name: string;
  maxStudents: number;
  status: 'active' | 'inactive' | 'suspended' | 'deleted';
  courseOffering: {
    id: number;
    course: {
      id: number;
      code: string;
      name: string;
    };
    semester: {
      id: number;
      name: string;
    };
  };
  faculty: {
    id: number;
    user: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
    };
  } | null;
  batch: {
    id: string;
    name: string;
  };
  studentsections: StudentSection[];
  _count: {
    studentsections: number;
  };
}

export default function SectionDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const [section, setSection] = useState<Section | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentId: '',
    },
  });

  const fetchSection = async () => {
    try {
      const response = await fetch(`/api/sections/${params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch section');
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch section');
      }
      setSection(data.data);
    } catch (error) {
      console.error('Error fetching section:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to fetch section'
      );
    }
  };

  useEffect(() => {
    fetchSection();
  }, [params.id]);

  // Fetch students from the same batch
  const { data: students } = useQuery<Student[]>({
    queryKey: ['students', section?.batch.id],
    queryFn: async () => {
      if (!section?.batch.id) return [];
      const response = await fetch(`/api/students?batchId=${section.batch.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      const data = await response.json();
      return data.data;
    },
    enabled: !!section?.batch.id,
  });

  const addStudentMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const response = await fetch(`/api/sections/${params.id}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['section', params.id] });
      toast.success('Student added successfully');
      setIsAddDialogOpen(false);
      form.reset();
      fetchSection();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add student');
    },
  });

  const removeStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const response = await fetch(
        `/api/sections/${params.id}/students?studentId=${studentId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to remove student');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['section', params.id] });
      toast.success('Student removed successfully');
      fetchSection();
    },
    onError: (error) => {
      console.error('Error removing student:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to remove student'
      );
    },
  });

  if (section === null) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Loader2 className='w-8 h-8 animate-spin' />
      </div>
    );
  }

  if (!section) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen'>
        <h1 className='text-2xl font-bold mb-4'>Section not found</h1>
        <Button onClick={() => window.history.back()}>Go Back</Button>
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
    <div className='container mx-auto py-8'>
      <div className='flex justify-between items-center mb-8'>
        <div>
          <h1 className='text-3xl font-bold mb-2'>{section.name}</h1>
          <p className='text-gray-500'>
            {section.courseOffering.course.name} -{' '}
            {section.courseOffering.semester.name}
          </p>
        </div>
        <div className='flex gap-4'>
          <Button variant='outline' onClick={() => router.back()}>
            Back
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className='w-4 h-4 mr-2' />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Student to Section</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((data) =>
                    addStudentMutation.mutate(data)
                  )}
                  className='space-y-4'
                >
                  <FormField
                    control={form.control}
                    name='studentId'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Student</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select a student' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {students?.map((student) => (
                              <SelectItem
                                key={student.id}
                                value={student.id.toString()}
                              >
                                <div className='flex flex-col'>
                                  <span className='font-medium'>
                                    {student.user.first_name}{' '}
                                    {student.user.last_name}
                                  </span>
                                  <span className='text-sm text-gray-500'>
                                    Roll No: {student.rollNumber} | Email:{' '}
                                    {student.user.email}
                                  </span>
                                </div>
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
                    disabled={addStudentMutation.isPending}
                  >
                    {addStudentMutation.isPending && (
                      <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    )}
                    Add Student
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className='grid gap-6'>
        <Card>
          <CardHeader>
            <CardTitle>Section Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-sm text-gray-500'>Course</p>
                <p className='font-medium'>
                  {section.courseOffering.course.name}
                </p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Semester</p>
                <p className='font-medium'>
                  {section.courseOffering.semester.name}
                </p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Faculty</p>
                <p className='font-medium'>
                  {section.faculty
                    ? `${section.faculty.user.first_name} ${section.faculty.user.last_name}`
                    : 'Not assigned'}
                </p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Batch</p>
                <p className='font-medium'>{section.batch.name}</p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Students</p>
                <p className='font-medium'>
                  {section._count.studentsections} / {section.maxStudents}
                </p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Status</p>
                <Badge
                  variant={
                    section.status === 'active' ? 'default' : 'secondary'
                  }
                >
                  {section.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enrolled Students</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Roll Number</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='w-[100px]'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {section.studentsections.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell>
                      {enrollment.student.user.first_name}{' '}
                      {enrollment.student.user.last_name}
                    </TableCell>
                    <TableCell>{enrollment.student.rollNumber}</TableCell>
                    <TableCell>{enrollment.student.user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          enrollment.status === 'active'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {enrollment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => {
                          if (
                            window.confirm(
                              'Are you sure you want to remove this student from the section?'
                            )
                          ) {
                            removeStudentMutation.mutate(
                              enrollment.student.id.toString()
                            );
                          }
                        }}
                        disabled={removeStudentMutation.isPending}
                      >
                        {removeStudentMutation.isPending ? (
                          <Loader2 className='w-4 h-4 animate-spin' />
                        ) : (
                          <Trash2 className='w-4 h-4 text-red-500' />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {section.studentsections.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className='text-center text-gray-500'
                    >
                      No students enrolled
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
