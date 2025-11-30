'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTheme } from 'next-themes';
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
import { ArrowLeft, Pencil, Trash2, Loader2, FileText } from 'lucide-react';
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
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  
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
  
  useEffect(() => {
    setMounted(true);
  }, []);
  const [currentDepartmentId, setCurrentDepartmentId] = useState<string>('');
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
    fetchCurrentDepartment();
  }, [id]);

  useEffect(() => {
    if (currentDepartmentId) {
      fetchPrograms(currentDepartmentId);
      setFormData((prev) => ({ ...prev, departmentId: currentDepartmentId }));
    }
  }, [currentDepartmentId]);

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

  const fetchCurrentDepartment = async () => {
    try {
      // Get settings to find department code
      const settingsResponse = await fetch('/api/settings');
      if (!settingsResponse.ok) {
        throw new Error('Failed to fetch settings');
      }
      const settingsData = await settingsResponse.json();
      if (!settingsData.success || !settingsData.data) {
        throw new Error('Settings not found');
      }

      const systemSettings =
        typeof settingsData.data.system === 'string'
          ? JSON.parse(settingsData.data.system)
          : settingsData.data.system;

      const departmentCode = systemSettings?.departmentCode;
      if (!departmentCode) {
        toast.error('Please configure department in Settings first');
        return;
      }

      // Get department ID by code
      const deptResponse = await fetch(
        `/api/departments/by-code?code=${departmentCode}`
      );
      if (!deptResponse.ok) {
        throw new Error('Department not found');
      }
      const deptData = await deptResponse.json();
      const deptId = deptData.id.toString();

      setCurrentDepartmentId(deptId);
    } catch (error) {
      console.error('Error fetching current department:', error);
      toast.error('Failed to load department. Please configure in Settings.');
    }
  };

  const fetchPrograms = async (departmentId: string) => {
    try {
      // Fetch programs for current department
      const response = await fetch(
        `/api/programs?departmentId=${departmentId}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch programs');
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch programs');
      }
      setPrograms(data.data || []);
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
    queryKey: ['sections', student?.batch?.id],
    queryFn: async () => {
      if (!student?.batch?.id) return [];
      const response = await fetch(`/api/sections?batchId=${student.batch.id}`);
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

  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const primaryColorDark = isDarkMode ? 'var(--orange-dark)' : 'var(--blue-dark)';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-3">
          <div 
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: primaryColor }}
          />
          <p className="text-xs text-secondary-text">Loading student details...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="space-y-4">
        <div className="text-center py-12">
          <p className="text-sm text-secondary-text">Student not found</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-[var(--success-green)] text-white';
      case 'inactive':
        return 'bg-[var(--gray-500)] text-white';
      case 'suspended':
        return 'bg-[var(--orange)] text-white';
      default:
        return 'bg-[var(--gray-500)] text-white';
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 border-card-border bg-transparent"
            style={{
              color: isDarkMode ? '#ffffff' : '#111827',
              borderColor: isDarkMode ? '#404040' : '#e5e7eb',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';
              e.currentTarget.style.color = primaryColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = isDarkMode ? '#ffffff' : '#111827';
            }}
            onClick={() => router.push('/admin/students')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-primary-text">
              {student.user.firstName} {student.user.lastName}
            </h1>
            <p className="text-xs text-secondary-text mt-0.5">
              Roll Number: {student.rollNumber}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs border-card-border bg-transparent"
          style={{
            color: isDarkMode ? '#ffffff' : '#111827',
            borderColor: isDarkMode ? '#404040' : '#e5e7eb',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';
            e.currentTarget.style.borderColor = primaryColor;
            e.currentTarget.style.color = primaryColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = isDarkMode ? '#404040' : '#e5e7eb';
            e.currentTarget.style.color = isDarkMode ? '#ffffff' : '#111827';
          }}
          onClick={() =>
            router.push(`/admin/transcripts?studentId=${student.id}`)
          }
        >
          <FileText className="mr-1.5 h-3.5 w-3.5" />
          Generate Transcript
        </Button>
      </div>

      <div className="grid gap-4">
        <Card className="bg-card border-card-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-bold text-primary-text">Student Information</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2 border-card-border bg-transparent"
                style={{
                  color: isDarkMode ? '#ffffff' : '#111827',
                  borderColor: isDarkMode ? '#404040' : '#e5e7eb',
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';
                    e.currentTarget.style.borderColor = primaryColor;
                    e.currentTarget.style.color = primaryColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = isDarkMode ? '#404040' : '#e5e7eb';
                    e.currentTarget.style.color = isDarkMode ? '#ffffff' : '#111827';
                  }
                }}
                onClick={() => setEditing(!editing)}
                disabled={saving}
              >
                <Pencil className="h-3.5 w-3.5 mr-1" />
                {editing ? 'Cancel' : 'Edit'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="h-7 text-xs px-2 text-white"
                style={{
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  borderColor: '#dc2626',
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = '#b91c1c';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = '#dc2626';
                  }
                }}
                onClick={() => setShowDeleteDialog(true)}
                disabled={editing || saving}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {editing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-xs text-primary-text">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      required
                      className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-xs text-primary-text">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      required
                      className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs text-primary-text">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                      className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rollNumber" className="text-xs text-primary-text">Roll Number</Label>
                    <Input
                      id="rollNumber"
                      value={formData.rollNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, rollNumber: e.target.value })
                      }
                      required
                      className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                    />
                  </div>

                  {/* Department is automatically set from Settings */}
                  {currentDepartmentId && (
                    <div className="space-y-2">
                      <Label htmlFor="departmentId" className="text-xs text-primary-text">Department</Label>
                      <Input
                        id="departmentId"
                        value="Current Department (from Settings)"
                        disabled
                        className="bg-card border-card-border text-primary-text"
                        style={{ backgroundColor: 'var(--hover-bg)' }}
                      />
                      <p className="text-xs text-secondary-text">
                        Department is configured in System Settings
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="programId" className="text-xs text-primary-text">Program</Label>
                    <Select
                      value={formData.programId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, programId: value })
                      }
                      disabled={!currentDepartmentId}
                    >
                      <SelectTrigger className="bg-card border-card-border text-primary-text">
                        <SelectValue placeholder="Select program" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-card-border">
                        {programs.map((program) => (
                          <SelectItem
                            key={program.id}
                            value={program.id.toString()}
                            className="text-primary-text hover:bg-card/50"
                          >
                            {program.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="batchId" className="text-xs text-primary-text">Batch</Label>
                    <Select
                      value={formData.batchId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, batchId: value })
                      }
                    >
                      <SelectTrigger className="bg-card border-card-border text-primary-text">
                        <SelectValue placeholder="Select batch" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-card-border">
                        {batches.map((batch) => (
                          <SelectItem key={batch.id} value={batch.id} className="text-primary-text hover:bg-card/50">
                            {batch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-xs text-primary-text">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: 'active' | 'inactive') =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger className="bg-card border-card-border text-primary-text">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-card-border">
                        <SelectItem value="active" className="text-primary-text hover:bg-card/50">Active</SelectItem>
                        <SelectItem value="inactive" className="text-primary-text hover:bg-card/50">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs border-card-border bg-transparent"
                    style={{
                      color: isDarkMode ? '#ffffff' : '#111827',
                      borderColor: isDarkMode ? '#404040' : '#e5e7eb',
                    }}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                    onClick={() => setEditing(false)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    size="sm"
                    className="h-8 text-xs text-white"
                    style={{
                      backgroundColor: saving ? (isDarkMode ? '#9a3412' : '#1e40af') : primaryColor,
                      color: 'white',
                    }}
                    onMouseEnter={(e) => {
                      if (!saving) {
                        e.currentTarget.style.backgroundColor = primaryColorDark;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!saving) {
                        e.currentTarget.style.backgroundColor = primaryColor;
                      }
                    }}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-medium text-secondary-text mb-1">
                    Name
                  </h3>
                  <p className="text-sm text-primary-text">
                    {student.user.firstName} {student.user.lastName}
                  </p>
                </div>

                <div>
                  <h3 className="text-xs font-medium text-secondary-text mb-1">
                    Email
                  </h3>
                  <p className="text-sm text-primary-text">{student.user.email}</p>
                </div>

                <div>
                  <h3 className="text-xs font-medium text-secondary-text mb-1">
                    Roll Number
                  </h3>
                  <p className="text-sm text-primary-text">{student.rollNumber}</p>
                </div>

                <div>
                  <h3 className="text-xs font-medium text-secondary-text mb-1">
                    Department
                  </h3>
                  <p className="text-sm text-primary-text">
                    {student.department?.name || 'Not assigned'}
                  </p>
                </div>

                <div>
                  <h3 className="text-xs font-medium text-secondary-text mb-1">
                    Program
                  </h3>
                  <p className="text-sm text-primary-text">
                    {student.program?.name || 'Not assigned'}
                  </p>
                </div>

                <div>
                  <h3 className="text-xs font-medium text-secondary-text mb-1">
                    Batch
                  </h3>
                  <p className="text-sm text-primary-text">
                    {student.batch?.name || 'Not assigned'}
                  </p>
                </div>

                <div>
                  <h3 className="text-xs font-medium text-secondary-text mb-1">
                    Status
                  </h3>
                  <Badge
                    className={`mt-1 text-[10px] px-1.5 py-0.5 ${getStatusColor(student.status)}`}
                    variant="secondary"
                  >
                    {student.status}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-card-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-primary-text">Enrolled Sections</CardTitle>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm"
                    className="h-7 text-xs text-white"
                    style={{
                      backgroundColor: primaryColor,
                      color: 'white',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = primaryColorDark;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = primaryColor;
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Add Section
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-card-border p-5">
                  <DialogHeader>
                    <DialogTitle className="text-sm font-bold text-primary-text">Add Student to Section</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={form.control}
                        name="sectionId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-primary-text">Section</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-card border-card-border text-primary-text">
                                  <SelectValue placeholder="Select a section" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-card border-card-border">
                                {sections?.map((section: any) => (
                                  <SelectItem
                                    key={section.id}
                                    value={section.id.toString()}
                                    className="text-primary-text hover:bg-card/50"
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
                        type="submit"
                        size="sm"
                        className="w-full h-8 text-xs text-white"
                        style={{
                          backgroundColor: addSection.isPending ? (isDarkMode ? '#9a3412' : '#1e40af') : primaryColor,
                          color: 'white',
                        }}
                        onMouseEnter={(e) => {
                          if (!addSection.isPending) {
                            e.currentTarget.style.backgroundColor = primaryColorDark;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!addSection.isPending) {
                            e.currentTarget.style.backgroundColor = primaryColor;
                          }
                        }}
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
          <CardContent className="pt-0">
            <div className="rounded-lg border border-card-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold text-primary-text h-9 py-2">Section</TableHead>
                    <TableHead className="text-xs font-semibold text-primary-text h-9 py-2">Course</TableHead>
                    <TableHead className="text-xs font-semibold text-primary-text h-9 py-2">Semester</TableHead>
                    <TableHead className="text-xs font-semibold text-primary-text h-9 py-2">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {student.studentsections.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-xs text-secondary-text py-6">
                        No sections enrolled
                      </TableCell>
                    </TableRow>
                  ) : (
                    student.studentsections.map((enrollment) => (
                      <TableRow key={enrollment.id} className="hover:bg-hover-bg transition-colors">
                        <TableCell className="text-xs text-primary-text py-2">{enrollment.section.name}</TableCell>
                        <TableCell className="text-xs text-secondary-text py-2">
                          {enrollment.section.courseOffering.course.code} -{' '}
                          {enrollment.section.courseOffering.course.name}
                        </TableCell>
                        <TableCell className="text-xs text-secondary-text py-2">
                          {enrollment.section.courseOffering.semester.name}
                        </TableCell>
                        <TableCell className="py-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs px-2 border-card-border bg-transparent"
                            style={{
                              color: isDarkMode ? '#ffffff' : '#111827',
                              borderColor: isDarkMode ? '#404040' : '#e5e7eb',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#dc2626';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = isDarkMode ? '#ffffff' : '#111827';
                            }}
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
        <DialogContent className="bg-card border-card-border p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Delete Student</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Are you sure you want to delete this student? This action cannot
              be undone.
              {student.sections.length > 0 && (
                <span className="block text-[var(--error)] mt-2 text-[10px]">
                  Warning: This student is enrolled in {student.sections.length}{' '}
                  section(s). You must remove them from all sections before
                  deleting.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-card-border bg-transparent"
              style={{
                color: isDarkMode ? '#ffffff' : '#111827',
                borderColor: isDarkMode ? '#404040' : '#e5e7eb',
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-8 text-xs text-white"
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
                borderColor: '#dc2626',
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = '#b91c1c';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = '#dc2626';
                }
              }}
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
