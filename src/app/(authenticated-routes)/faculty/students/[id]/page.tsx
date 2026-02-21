'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTheme } from 'next-themes';
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
import { ArrowLeft, Pencil, Trash2, Loader2, TrendingUp, Target, BarChart2, Users, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

interface StudentAnalytics {
  student: {
    id: number;
    rollNumber: string;
    name: string;
    email: string;
    batch: {
      id: string;
      name: string;
    };
    department: {
      id: number;
      name: string;
      code: string;
    };
  };
  overallPerformance: number;
  totalAssessments: number;
  completedAssessments: number;
  coursePerformance: Array<{
    courseId: number;
    courseCode: string;
    courseName: string;
    averagePercentage: number;
    totalAssessments: number;
    completedAssessments: number;
    classAverage: number;
    difference: number;
  }>;
  cloAttainmentSummary: Array<{
    courseId: number;
    courseCode: string;
    courseName: string;
    clos: Array<{
      cloCode: string;
      cloDescription: string;
      attainmentPercent: number;
      threshold: number;
      status: string;
      calculatedAt: string;
    }>;
  }>;
  performanceTrends: Array<{
    semester: string;
    averagePercentage: number;
    totalAssessments: number;
  }>;
  enrollmentHistory: Array<{
    sectionId: number;
    sectionName: string;
    course: {
      id: number;
      code: string;
      name: string;
    };
    semester: string;
    status: string;
    enrolledAt: string;
  }>;
  assessmentResults: Array<{
    id: number;
    assessmentTitle: string;
    assessmentType: string;
    course: {
      code: string;
      name: string;
    };
    semester: string;
    obtainedMarks: number;
    totalMarks: number;
    percentage: number;
    status: string;
    submittedAt: string | null;
    evaluatedAt: string | null;
  }>;
}

export default function StudentDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = mounted && resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
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
    setMounted(true);
  }, []);
  useEffect(() => {
    fetchStudent();
    fetchBatches();
    fetchDepartments();
    fetchAnalytics();
  }, [id]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/students/${id}/analytics`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

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
      router.push('/faculty/students');
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
    queryKey: ['sections', student?.batch?.id],
    queryFn: async () => {
      const batchId = student?.batch?.id;
      if (!batchId) return [];
      const response = await fetch(`/api/sections?batchId=${batchId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sections');
      }
      const data = await response.json();
      return data.data;
    },
    enabled: !!student?.batch?.id,
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

  if (!mounted || loading) {
    return (
      <div className='flex items-center justify-center min-h-[50vh] bg-page'>
        <div className='flex flex-col items-center gap-3'>
          <Loader2 className='h-8 w-8 animate-spin text-primary-text' style={{ color: primaryColor }} />
          <p className='text-xs text-secondary-text'>Loading...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[50vh] bg-page gap-4'>
        <p className='text-sm text-secondary-text'>Student not found</p>
        <button
          type='button'
          onClick={() => router.push('/faculty/students')}
          className='px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border text-primary-text hover:bg-[var(--hover-bg)]'
        >
          Go Back
        </button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-[var(--gray-500)]';
      case 'suspended':
        return 'bg-yellow-500';
      default:
        return 'bg-[var(--gray-500)]';
    }
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-3'>
        <button
          type='button'
          onClick={() => router.push('/faculty/students')}
          className='p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors'
          style={{ color: primaryColor }}
        >
          <ArrowLeft className='h-4 w-4' />
        </button>
        <div
          className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg'
          style={{ backgroundColor: iconBgColor }}
        >
          <Users className='h-5 w-5' style={{ color: primaryColor }} />
        </div>
        <div>
          <h1 className='text-lg font-bold text-primary-text'>
            {student.user.firstName} {student.user.lastName}
          </h1>
          <p className='text-xs text-secondary-text mt-0.5'>Roll Number: {student.rollNumber}</p>
        </div>
      </div>

      <div className='grid gap-4'>
        <div className='rounded-lg border border-card-border bg-card overflow-hidden'>
          <div className='p-4 border-b border-card-border flex flex-row items-center justify-between flex-wrap gap-2'>
            <h2 className='text-sm font-semibold text-primary-text'>Student Information</h2>
            <div className='flex gap-2'>
              <button
                type='button'
                onClick={() => setEditing(!editing)}
                disabled={saving}
                className='px-3 py-1.5 rounded-lg text-xs font-medium h-8 inline-flex items-center gap-1.5 border border-card-border text-primary-text hover:bg-[var(--hover-bg)] disabled:opacity-50'
              >
                <Pencil className='h-3.5 w-3.5' />
                {editing ? 'Cancel' : 'Edit'}
              </button>
              <button
                type='button'
                onClick={() => setShowDeleteDialog(true)}
                disabled={editing || saving}
                className='px-3 py-1.5 rounded-lg text-xs font-medium h-8 inline-flex items-center gap-1.5 border border-[var(--error)]/50 text-[var(--error)] hover:bg-[var(--error-opacity-05)] disabled:opacity-50'
              >
                <Trash2 className='h-3.5 w-3.5' />
                Delete
              </button>
            </div>
          </div>
          <div className='p-4'>
            {editing ? (
              <form onSubmit={handleSubmit} className='space-y-6'>
                <div className='grid grid-cols-2 gap-6'>
                  <div className='space-y-2'>
                    <Label htmlFor='firstName' className='text-xs text-secondary-text'>First Name</Label>
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

                <div className='flex justify-end gap-2'>
                  <button
                    type='button'
                    onClick={() => setEditing(false)}
                    disabled={saving}
                    className='px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border bg-transparent text-primary-text hover:bg-[var(--hover-bg)] disabled:opacity-50'
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    disabled={saving}
                    className='px-3 py-1.5 rounded-lg text-xs font-medium h-8 inline-flex items-center gap-2 disabled:opacity-50'
                    style={{ backgroundColor: primaryColor, color: '#fff' }}
                  >
                    {saving ? (
                      <>
                        <Loader2 className='h-3.5 w-3.5 animate-spin' />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className='grid grid-cols-2 gap-6'>
                <div>
                  <h3 className='text-sm font-medium text-secondary-text'>
                    Name
                  </h3>
                  <p className='mt-1'>
                    {student.user.firstName} {student.user.lastName}
                  </p>
                </div>

                <div>
                  <h3 className='text-sm font-medium text-secondary-text'>
                    Email
                  </h3>
                  <p className='mt-1'>{student.user.email}</p>
                </div>

                <div>
                  <h3 className='text-sm font-medium text-secondary-text'>
                    Roll Number
                  </h3>
                  <p className='mt-1'>{student.rollNumber}</p>
                </div>

                <div>
                  <h3 className='text-sm font-medium text-secondary-text'>
                    Department
                  </h3>
                  <p className='mt-1'>
                    {student.department?.name || 'Not assigned'}
                  </p>
                </div>

                <div>
                  <h3 className='text-sm font-medium text-secondary-text'>
                    Program
                  </h3>
                  <p className='mt-1'>
                    {student.program?.name || 'Not assigned'}
                  </p>
                </div>

                <div>
                  <h3 className='text-sm font-medium text-secondary-text'>
                    Batch
                  </h3>
                  <p className='mt-1'>
                    {student.batch?.name || 'Not assigned'}
                  </p>
                </div>

                <div>
                  <h3 className='text-sm font-medium text-secondary-text'>
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
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-card border border-card-border p-1 rounded-lg">
            <TabsTrigger value="profile" className="text-xs data-[state=active]:bg-[var(--hover-bg)] data-[state=active]:text-primary-text rounded-md">Profile</TabsTrigger>
            <TabsTrigger value="performance" className="text-xs data-[state=active]:bg-[var(--hover-bg)] data-[state=active]:text-primary-text rounded-md">Performance</TabsTrigger>
            <TabsTrigger value="clo-attainments" className="text-xs data-[state=active]:bg-[var(--hover-bg)] data-[state=active]:text-primary-text rounded-md">CLO Attainments</TabsTrigger>
            <TabsTrigger value="assessments" className="text-xs data-[state=active]:bg-[var(--hover-bg)] data-[state=active]:text-primary-text rounded-md">Assessments</TabsTrigger>
            <TabsTrigger value="enrollment" className="text-xs data-[state=active]:bg-[var(--hover-bg)] data-[state=active]:text-primary-text rounded-md">Enrollment</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <div className="rounded-lg border border-card-border bg-card overflow-hidden">
              <div className="p-4 border-b border-card-border">
                <div className='flex items-center justify-between'>
                  <h2 className="text-sm font-semibold text-primary-text">Enrolled Sections</h2>
                  <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 inline-flex items-center gap-2"
                        style={{ backgroundColor: primaryColor, color: '#fff' }}
                      >
                        <Plus className='w-4 h-4' />
                        Add Section
                      </button>
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
                          <button
                            type='submit'
                            className='w-full px-3 py-1.5 rounded-lg text-xs font-medium h-8 disabled:opacity-50'
                            style={{ backgroundColor: primaryColor, color: '#fff' }}
                            disabled={addSection.isPending}
                          >
                            {addSection.isPending ? 'Adding...' : 'Add Section'}
                          </button>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <div className="p-4">
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
                              <button
                                type="button"
                                className="px-2 py-1 rounded-lg text-xs font-medium h-7"
                                style={{ backgroundColor: iconBgColor, color: primaryColor }}
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
                              </button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            {analytics ? (
              <>
                {/* Performance Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="rounded-lg border border-card-border bg-card overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-secondary-text">Overall Performance</p>
                          <p className="text-2xl font-bold">
                            {analytics.overallPerformance.toFixed(1)}%
                          </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-card-border bg-card overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-secondary-text">Total Assessments</p>
                          <p className="text-2xl font-bold">
                            {analytics.totalAssessments}
                          </p>
                        </div>
                        <FileText className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-card-border bg-card overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-secondary-text">Completed</p>
                          <p className="text-2xl font-bold">
                            {analytics.completedAssessments}
                          </p>
                        </div>
                        <Target className="w-8 h-8 text-purple-600" />
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-card-border bg-card overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-secondary-text">Completion Rate</p>
                          <p className="text-2xl font-bold">
                            {analytics.totalAssessments > 0
                              ? ((analytics.completedAssessments / analytics.totalAssessments) * 100).toFixed(1)
                              : 0}%
                          </p>
                        </div>
                        <BarChart2 className="w-8 h-8 text-orange-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Trends */}
                {analytics.performanceTrends.length > 0 && (
                  <div className="rounded-lg border border-card-border bg-card overflow-hidden">
                    <div className="p-4 border-b border-card-border">
                      <h2 className="text-sm font-semibold text-primary-text">Performance Trends by Semester</h2>
                    </div>
                    <div className="p-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Semester</TableHead>
                            <TableHead>Average Performance</TableHead>
                            <TableHead>Total Assessments</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {analytics.performanceTrends.map((trend, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{trend.semester}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    trend.averagePercentage >= 70
                                      ? 'default'
                                      : trend.averagePercentage >= 50
                                      ? 'secondary'
                                      : 'destructive'
                                  }
                                >
                                  {trend.averagePercentage.toFixed(1)}%
                                </Badge>
                              </TableCell>
                              <TableCell>{trend.totalAssessments}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* Course Performance with Class Comparison */}
                <div className="rounded-lg border border-card-border bg-card overflow-hidden">
                  <div className="p-4 border-b border-card-border">
                    <h2 className="text-sm font-semibold text-primary-text">Course Performance vs Class Average</h2>
                  </div>
                  <div className="p-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Course</TableHead>
                          <TableHead>Student Avg</TableHead>
                          <TableHead>Class Avg</TableHead>
                          <TableHead>Difference</TableHead>
                          <TableHead>Completed</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analytics.coursePerformance.map((course) => (
                          <TableRow key={course.courseId}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{course.courseCode}</p>
                                <p className="text-xs text-secondary-text">{course.courseName}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  course.averagePercentage >= 70
                                    ? 'default'
                                    : course.averagePercentage >= 50
                                    ? 'secondary'
                                    : 'destructive'
                                }
                              >
                                {course.averagePercentage.toFixed(1)}%
                              </Badge>
                            </TableCell>
                            <TableCell>{course.classAverage.toFixed(1)}%</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {course.difference >= 0 ? (
                                  <TrendingUp className="w-4 h-4 text-green-600" />
                                ) : (
                                  <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
                                )}
                                <span
                                  className={
                                    course.difference >= 0 ? 'text-green-600' : 'text-red-600'
                                  }
                                >
                                  {course.difference >= 0 ? '+' : ''}
                                  {course.difference.toFixed(1)}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {course.completedAssessments} / {course.totalAssessments}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-card-border bg-card overflow-hidden">
                <div className="p-4 py-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                  <p className="text-secondary-text">Loading performance data...</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="clo-attainments" className="space-y-4">
            {analytics ? (
              analytics.cloAttainmentSummary.length > 0 ? (
                analytics.cloAttainmentSummary.map((course) => (
                  <div key={course.courseId} className="rounded-lg border border-card-border bg-card overflow-hidden">
                    <div className="p-4 border-b border-card-border">
                      <h2 className="text-sm font-semibold text-primary-text">
                        {course.courseCode} - {course.courseName}
                      </h2>
                    </div>
                    <div className="p-4">
                      {course.clos.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>CLO Code</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Attainment</TableHead>
                              <TableHead>Threshold</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {course.clos.map((clo, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">{clo.cloCode}</TableCell>
                                <TableCell>{clo.cloDescription}</TableCell>
                                <TableCell>{clo.attainmentPercent.toFixed(1)}%</TableCell>
                                <TableCell>{clo.threshold}%</TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      clo.status === 'attained' ? 'default' : 'destructive'
                                    }
                                  >
                                    {clo.status === 'attained' ? 'Attained' : 'Not Attained'}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-sm text-secondary-text text-center py-4">
                          No CLO attainment data available for this course
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-card-border bg-card overflow-hidden">
                  <div className="p-4 py-8 text-center">
                    <Target className="w-12 h-12 mx-auto mb-4 text-secondary-text" />
                    <p className="text-secondary-text">No CLO attainment data available</p>
                  </div>
                </div>
              )
            ) : (
              <div className="rounded-lg border border-card-border bg-card overflow-hidden">
                <div className="p-4 py-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                  <p className="text-secondary-text">Loading CLO attainments...</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="assessments" className="space-y-4">
            {analytics ? (
              analytics.assessmentResults.length > 0 ? (
                <div className="rounded-lg border border-card-border bg-card overflow-hidden">
                  <div className="p-4 border-b border-card-border">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-primary-text">Assessment Results</h2>
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border text-primary-text hover:bg-[var(--hover-bg)] inline-flex items-center gap-2"
                        onClick={() => {
                          const csv = [
                            ['Assessment', 'Course', 'Semester', 'Marks', 'Percentage', 'Status'],
                            ...analytics.assessmentResults.map((r) => [
                              r.assessmentTitle,
                              r.course.code,
                              r.semester,
                              `${r.obtainedMarks}/${r.totalMarks}`,
                              `${r.percentage.toFixed(1)}%`,
                              r.status,
                            ]),
                          ]
                            .map((row) => row.join(','))
                            .join('\n');
                          const blob = new Blob([csv], { type: 'text/csv' });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `student-${analytics.student.rollNumber}-results.csv`;
                          a.click();
                        }}
                      >
                        <Download className="w-4 h-4" />
                        Export
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Assessment</TableHead>
                          <TableHead>Course</TableHead>
                          <TableHead>Semester</TableHead>
                          <TableHead>Marks</TableHead>
                          <TableHead>Percentage</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Submitted</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analytics.assessmentResults.map((result) => (
                          <TableRow key={result.id}>
                            <TableCell className="font-medium">
                              {result.assessmentTitle}
                              <Badge variant="outline" className="ml-2">
                                {result.assessmentType}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {result.course.code} - {result.course.name}
                            </TableCell>
                            <TableCell>{result.semester}</TableCell>
                            <TableCell>
                              {result.obtainedMarks} / {result.totalMarks}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  result.percentage >= 70
                                    ? 'default'
                                    : result.percentage >= 50
                                    ? 'secondary'
                                    : 'destructive'
                                }
                              >
                                {result.percentage.toFixed(1)}%
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  result.status === 'published'
                                    ? 'default'
                                    : result.status === 'evaluated'
                                    ? 'secondary'
                                    : 'outline'
                                }
                              >
                                {result.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {result.submittedAt
                                ? new Date(result.submittedAt).toLocaleDateString()
                                : 'Not submitted'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-card-border bg-card overflow-hidden">
                  <div className="p-4 py-8 text-center">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-secondary-text" />
                    <p className="text-secondary-text">No assessment results available</p>
                  </div>
                </div>
              )
            ) : (
              <div className="rounded-lg border border-card-border bg-card overflow-hidden">
                <div className="p-4 py-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                  <p className="text-secondary-text">Loading assessment results...</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="enrollment" className="space-y-4">
            {analytics ? (
              analytics.enrollmentHistory.length > 0 ? (
                <div className="rounded-lg border border-card-border bg-card overflow-hidden">
                  <div className="p-4 border-b border-card-border">
                    <h2 className="text-sm font-semibold text-primary-text">Enrollment History</h2>
                  </div>
                  <div className="p-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Section</TableHead>
                          <TableHead>Course</TableHead>
                          <TableHead>Semester</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Enrolled At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analytics.enrollmentHistory.map((enrollment) => (
                          <TableRow key={enrollment.sectionId}>
                            <TableCell className="font-medium">
                              {enrollment.sectionName}
                            </TableCell>
                            <TableCell>
                              {enrollment.course.code} - {enrollment.course.name}
                            </TableCell>
                            <TableCell>{enrollment.semester}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  enrollment.status === 'active' ? 'default' : 'secondary'
                                }
                              >
                                {enrollment.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(enrollment.enrolledAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-card-border bg-card overflow-hidden">
                  <div className="p-4 py-8 text-center">
                    <Users className="w-12 h-12 mx-auto mb-4 text-secondary-text" />
                    <p className="text-secondary-text">No enrollment history available</p>
                  </div>
                </div>
              )
            ) : (
              <div className="rounded-lg border border-card-border bg-card overflow-hidden">
                <div className="p-4 py-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                  <p className="text-secondary-text">Loading enrollment history...</p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
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
          <DialogFooter className="border-t border-card-border pt-4 gap-2">
            <button
              type="button"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
              className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border bg-transparent text-primary-text hover:bg-[var(--hover-bg)] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || student.sections.length > 0}
              className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 disabled:opacity-50 bg-[var(--error)] text-white hover:opacity-90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
