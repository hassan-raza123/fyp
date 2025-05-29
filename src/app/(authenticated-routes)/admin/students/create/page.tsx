'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const createStudentSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  rollNumber: z.string().min(1, 'Roll number is required'),
  departmentId: z.string().min(1, 'Department is required'),
  programId: z.string().min(1, 'Program is required'),
  batchId: z.string().min(1, 'Batch is required'),
  status: z.enum(['active', 'inactive']),
});

interface Department {
  id: number;
  name: string;
  code: string;
}

interface Program {
  id: number;
  name: string;
  code: string;
}

interface Batch {
  id: string;
  name: string;
  code: string;
}

export default function CreateStudentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [fetchingDepartments, setFetchingDepartments] = useState(false);
  const [fetchingPrograms, setFetchingPrograms] = useState(false);
  const [fetchingBatches, setFetchingBatches] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    rollNumber: '',
    departmentId: '',
    programId: '',
    batchId: '',
    status: 'active',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setFetchingDepartments(true);
      const response = await fetch('/api/departments?status=active');
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
    } finally {
      setFetchingDepartments(false);
    }
  };

  const fetchPrograms = async (departmentId: string) => {
    try {
      setFetchingPrograms(true);
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
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch batches');
      }
      setBatches(data.data);
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to fetch batches'
      );
    } finally {
      setFetchingBatches(false);
    }
  };

  // Watch for department and program changes
  useEffect(() => {
    if (formData.departmentId) {
      fetchPrograms(formData.departmentId);
      setFormData((prev) => ({ ...prev, programId: '', batchId: '' }));
    } else {
      setPrograms([]);
      setFormData((prev) => ({ ...prev, programId: '', batchId: '' }));
    }
  }, [formData.departmentId]);

  useEffect(() => {
    if (formData.programId) {
      fetchBatches(formData.programId);
      setFormData((prev) => ({ ...prev, batchId: '' }));
    } else {
      setBatches([]);
      setFormData((prev) => ({ ...prev, batchId: '' }));
    }
  }, [formData.programId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Validate form data
      const result = createStudentSchema.safeParse(formData);
      if (!result.success) {
        const newErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
        throw new Error('Please fix the form errors');
      }

      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          departmentId: parseInt(formData.departmentId),
          programId: parseInt(formData.programId),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create student');
      }

      toast.success('Student created successfully');
      router.push('/admin/students');
    } catch (error) {
      console.error('Error creating student:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create student'
      );
    } finally {
      setLoading(false);
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
          <h1 className='text-3xl font-bold'>Add Student</h1>
          <p className='text-muted-foreground'>Create a new student account</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
        </CardHeader>
        <CardContent>
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
                  className={errors.firstName ? 'border-red-500' : ''}
                />
                {errors.firstName && (
                  <p className='text-sm text-red-500'>{errors.firstName}</p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='lastName'>Last Name</Label>
                <Input
                  id='lastName'
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  className={errors.lastName ? 'border-red-500' : ''}
                />
                {errors.lastName && (
                  <p className='text-sm text-red-500'>{errors.lastName}</p>
                )}
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
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className='text-sm text-red-500'>{errors.email}</p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='rollNumber'>Roll Number</Label>
                <Input
                  id='rollNumber'
                  value={formData.rollNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, rollNumber: e.target.value })
                  }
                  className={errors.rollNumber ? 'border-red-500' : ''}
                />
                {errors.rollNumber && (
                  <p className='text-sm text-red-500'>{errors.rollNumber}</p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='departmentId'>Department</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, departmentId: value })
                  }
                  disabled={fetchingDepartments}
                >
                  <SelectTrigger
                    className={errors.departmentId ? 'border-red-500' : ''}
                  >
                    <SelectValue placeholder='Select department' />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name} ({dept.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.departmentId && (
                  <p className='text-sm text-red-500'>{errors.departmentId}</p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='programId'>Program</Label>
                <Select
                  value={formData.programId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, programId: value })
                  }
                  disabled={fetchingPrograms || !formData.departmentId}
                >
                  <SelectTrigger
                    className={errors.programId ? 'border-red-500' : ''}
                  >
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
                {errors.programId && (
                  <p className='text-sm text-red-500'>{errors.programId}</p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='batchId'>Batch</Label>
                <Select
                  value={formData.batchId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, batchId: value })
                  }
                  disabled={fetchingBatches || !formData.programId}
                >
                  <SelectTrigger
                    className={errors.batchId ? 'border-red-500' : ''}
                  >
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
                {errors.batchId && (
                  <p className='text-sm text-red-500'>{errors.batchId}</p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='status'>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger
                    className={errors.status ? 'border-red-500' : ''}
                  >
                    <SelectValue placeholder='Select status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='active'>Active</SelectItem>
                    <SelectItem value='inactive'>Inactive</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className='text-sm text-red-500'>{errors.status}</p>
                )}
              </div>
            </div>

            <div className='flex justify-end gap-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => router.push('/admin/students')}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Creating...
                  </>
                ) : (
                  'Create Student'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
