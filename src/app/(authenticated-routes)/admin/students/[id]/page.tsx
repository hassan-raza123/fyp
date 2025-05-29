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

export default function StudentDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
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
                    variant={
                      student.status === 'active' ? 'default' : 'secondary'
                    }
                    className='mt-1'
                  >
                    {student.status.charAt(0).toUpperCase() +
                      student.status.slice(1)}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enrolled Sections</CardTitle>
          </CardHeader>
          <CardContent>
            {student.sections.length === 0 ? (
              <p className='text-muted-foreground'>
                This student is not enrolled in any sections.
              </p>
            ) : (
              <div className='space-y-4'>
                {student.sections.map((section) => (
                  <div
                    key={section.id}
                    className='flex items-center justify-between p-4 border rounded-lg'
                  >
                    <div>
                      <h3 className='font-medium'>{section.name}</h3>
                      <p className='text-sm text-muted-foreground'>
                        {section.courseOffering.course.code} -{' '}
                        {section.courseOffering.course.name}
                      </p>
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() =>
                        router.push(`/admin/sections/${section.id}`)
                      }
                    >
                      View Section
                    </Button>
                  </div>
                ))}
              </div>
            )}
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
