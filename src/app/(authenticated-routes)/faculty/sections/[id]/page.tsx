'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTheme } from 'next-themes';
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
import { ArrowLeft, Pencil, Trash2, BarChart2, TrendingUp, Users, Target, FileText } from 'lucide-react';
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

interface SectionAnalytics {
  section: {
    id: number;
    name: string;
    course: {
      code: string;
      name: string;
    };
    semester: {
      name: string;
    };
    totalStudents: number;
  };
  averagePerformance: number;
  totalAssessments: number;
  completionRates: Array<{
    assessmentId: number;
    assessmentTitle: string;
    assessmentType: string;
    dueDate: string | null;
    totalStudents: number;
    submittedCount: number;
    evaluatedCount: number;
    submissionRate: number;
    evaluationRate: number;
  }>;
  studentPerformance: Array<{
    studentId: number;
    studentName: string;
    rollNumber: string;
    averagePercentage: number;
    completedAssessments: number;
    totalAssessments: number;
    completionRate: number;
  }>;
  performanceDistribution: Array<{
    range: string;
    count: number;
  }>;
  cloAttainmentSummary: Array<{
    cloCode: string;
    cloDescription: string;
    attainmentPercent: number;
    threshold: number;
    status: string;
  }>;
}

export default function SectionDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = mounted && resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';
  const [section, setSection] = useState<Section | null>(null);
  const [analytics, setAnalytics] = useState<SectionAnalytics | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('students');

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
    setMounted(true);
  }, []);
  useEffect(() => {
    fetchSection();
    fetchAnalytics();
  }, [params.id]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/sections/${params.id}/analytics`, {
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

  if (!mounted || section === null) {
    return (
      <div className='flex items-center justify-center min-h-[50vh] bg-page'>
        <div className='flex flex-col items-center gap-3'>
          <Loader2 className='w-8 h-8 animate-spin text-primary-text' style={{ color: primaryColor }} />
          <p className='text-xs text-secondary-text'>Loading...</p>
        </div>
      </div>
    );
  }

  if (!section) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[50vh] bg-page gap-4'>
        <h1 className='text-lg font-bold text-primary-text'>Section not found</h1>
        <button
          type='button'
          onClick={() => window.history.back()}
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
      <div className='flex items-center justify-between flex-wrap gap-3'>
        <div className='flex items-center gap-3'>
          <button
            type='button'
            onClick={() => router.back()}
            className='p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors'
            style={{ color: primaryColor }}
          >
            <ArrowLeft className='h-4 w-4' />
          </button>
          <div
            className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg'
            style={{ backgroundColor: iconBgColor }}
          >
            <FileText className='h-5 w-5' style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 className='text-lg font-bold text-primary-text'>{section.name}</h1>
            <p className='text-xs text-secondary-text mt-0.5'>
              {section.courseOffering.course.name} - {section.courseOffering.semester.name}
            </p>
          </div>
        </div>
        <div className='flex gap-2'>
          <button
            type='button'
            onClick={() => router.back()}
            className='px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border text-primary-text hover:bg-[var(--hover-bg)]'
          >
            Back
          </button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <button
                type='button'
                className='px-3 py-1.5 rounded-lg text-xs font-medium h-8 inline-flex items-center gap-2'
                style={{ backgroundColor: primaryColor, color: '#fff' }}
              >
                <Plus className='w-3.5 h-3.5' />
                Add Student
              </button>
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
                                  <span className='text-sm text-secondary-text'>
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
        <Card className="rounded-lg border border-card-border bg-card overflow-hidden">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-primary-text">Section Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-sm text-secondary-text'>Course</p>
                <p className='font-medium'>
                  {section.courseOffering.course.name}
                </p>
              </div>
              <div>
                <p className='text-sm text-secondary-text'>Semester</p>
                <p className='font-medium'>
                  {section.courseOffering.semester.name}
                </p>
              </div>
              <div>
                <p className='text-sm text-secondary-text'>Faculty</p>
                <p className='font-medium'>
                  {section.faculty
                    ? `${section.faculty.user.first_name} ${section.faculty.user.last_name}`
                    : 'Not assigned'}
                </p>
              </div>
              <div>
                <p className='text-sm text-secondary-text'>Batch</p>
                <p className='font-medium'>{section.batch.name}</p>
              </div>
              <div>
                <p className='text-sm text-secondary-text'>Students</p>
                <p className='font-medium'>
                  {section._count.studentsections} / {section.maxStudents}
                </p>
              </div>
              <div>
                <p className='text-sm text-secondary-text'>Status</p>
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="space-y-4">
            <Card className="rounded-lg border border-card-border bg-card overflow-hidden">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-primary-text">Enrolled Students</CardTitle>
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
                          className='text-center text-secondary-text'
                        >
                          No students enrolled
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            {analytics ? (
              <>
                {/* Performance Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="rounded-lg border border-card-border bg-card overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-secondary-text">Avg Performance</p>
                          <p className="text-2xl font-bold">
                            {analytics.averagePerformance.toFixed(1)}%
                          </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-lg border border-card-border bg-card overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-secondary-text">Total Students</p>
                          <p className="text-2xl font-bold">
                            {analytics.section.totalStudents}
                          </p>
                        </div>
                        <Users className="w-8 h-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-lg border border-card-border bg-card overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-secondary-text">Assessments</p>
                          <p className="text-2xl font-bold">
                            {analytics.totalAssessments}
                          </p>
                        </div>
                        <FileText className="w-8 h-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-lg border border-card-border bg-card overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-secondary-text">CLOs Attained</p>
                          <p className="text-2xl font-bold">
                            {analytics.cloAttainmentSummary.filter(c => c.status === 'attained').length} / {analytics.cloAttainmentSummary.length}
                          </p>
                        </div>
                        <Target className="w-8 h-8 text-orange-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Student Performance Table */}
                <Card className="rounded-lg border border-card-border bg-card overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold text-primary-text">Student Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student Name</TableHead>
                          <TableHead>Roll Number</TableHead>
                          <TableHead>Avg Performance</TableHead>
                          <TableHead>Completed</TableHead>
                          <TableHead>Completion Rate</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analytics.studentPerformance.map((student) => (
                          <TableRow key={student.studentId}>
                            <TableCell className="font-medium">
                              {student.studentName}
                            </TableCell>
                            <TableCell>{student.rollNumber}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  student.averagePercentage >= 70
                                    ? 'default'
                                    : student.averagePercentage >= 50
                                    ? 'secondary'
                                    : 'destructive'
                                }
                              >
                                {student.averagePercentage.toFixed(1)}%
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {student.completedAssessments} / {student.totalAssessments}
                            </TableCell>
                            <TableCell>
                              {student.completionRate.toFixed(1)}%
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  router.push(`/faculty/students/${student.studentId}`)
                                }
                              >
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Assessment Completion Rates */}
                <Card className="rounded-lg border border-card-border bg-card overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold text-primary-text">Assessment Completion Rates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Assessment</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Evaluated</TableHead>
                          <TableHead>Submission Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analytics.completionRates.map((assessment) => (
                          <TableRow key={assessment.assessmentId}>
                            <TableCell className="font-medium">
                              {assessment.assessmentTitle}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{assessment.assessmentType}</Badge>
                            </TableCell>
                            <TableCell>
                              {assessment.dueDate
                                ? new Date(assessment.dueDate).toLocaleDateString()
                                : 'N/A'}
                            </TableCell>
                            <TableCell>
                              {assessment.submittedCount} / {assessment.totalStudents}
                            </TableCell>
                            <TableCell>
                              {assessment.evaluatedCount} / {assessment.totalStudents}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-[var(--hover-bg)] rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{
                                      width: `${assessment.submissionRate}%`,
                                    }}
                                  ></div>
                                </div>
                                <span className="text-sm">
                                  {assessment.submissionRate.toFixed(1)}%
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="rounded-lg border border-card-border bg-card overflow-hidden">
                <CardContent className="py-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                  <p className="text-secondary-text">Loading performance data...</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            {analytics ? (
              <>
                {/* Performance Distribution */}
                <Card className="rounded-lg border border-card-border bg-card overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold text-primary-text">Performance Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.performanceDistribution.map((range) => (
                        <div key={range.range} className="flex items-center gap-4">
                          <div className="w-24 text-sm font-medium">{range.range}</div>
                          <div className="flex-1 bg-[var(--hover-bg)] rounded-full h-4">
                            <div
                              className="bg-purple-600 h-4 rounded-full"
                              style={{
                                width: `${(range.count / analytics.section.totalStudents) * 100}%`,
                              }}
                            ></div>
                          </div>
                          <div className="w-12 text-sm text-right">{range.count}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* CLO Attainment Summary */}
                <Card className="rounded-lg border border-card-border bg-card overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold text-primary-text">CLO Attainment Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analytics.cloAttainmentSummary.length > 0 ? (
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
                          {analytics.cloAttainmentSummary.map((clo, idx) => (
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
                        No CLO attainment data available
                      </p>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="rounded-lg border border-card-border bg-card overflow-hidden">
                <CardContent className="py-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                  <p className="text-secondary-text">Loading analytics...</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
