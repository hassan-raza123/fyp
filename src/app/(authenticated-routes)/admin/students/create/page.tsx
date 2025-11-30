'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  sectionId: z.string().optional(),
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

interface Section {
  id: number;
  name: string;
}

export default function CreateStudentPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentDepartmentId, setCurrentDepartmentId] = useState<string>('');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [fetchingPrograms, setFetchingPrograms] = useState(false);
  const [fetchingBatches, setFetchingBatches] = useState(false);
  const [fetchingSections, setFetchingSections] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    rollNumber: '',
    departmentId: '',
    programId: '',
    batchId: '',
    sectionId: '',
    status: 'active',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchCurrentDepartment();
  }, []);

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
      const deptResponse = await fetch(`/api/departments/by-code?code=${departmentCode}`);
      if (!deptResponse.ok) {
        throw new Error('Department not found');
      }
      const deptData = await deptResponse.json();
      const deptId = deptData.id.toString();
      
      setCurrentDepartmentId(deptId);
      setFormData((prev) => ({
        ...prev,
        departmentId: deptId,
      }));
      
      // Fetch programs for current department
      fetchPrograms(deptId);
    } catch (error) {
      console.error('Error fetching current department:', error);
      toast.error('Failed to load department. Please configure in Settings.');
    }
  };

  const fetchPrograms = async (departmentId: string) => {
    try {
      setFetchingPrograms(true);
      // Fetch programs for current department
      const response = await fetch(`/api/programs?departmentId=${departmentId}`);
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

  const fetchSections = async (batchId: string) => {
    try {
      setFetchingSections(true);
      const response = await fetch(`/api/batches/${batchId}`);
      if (!response.ok) throw new Error('Failed to fetch batch sections');
      const data = await response.json();
      if (!data.success)
        throw new Error(data.error || 'Failed to fetch batch sections');
      setSections(data.data.sections || []);
    } catch (error) {
      console.error('Error fetching sections:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to fetch sections'
      );
    } finally {
      setFetchingSections(false);
    }
  };

  // Watch for department and program changes
  useEffect(() => {
    if (formData.departmentId) {
      fetchPrograms(formData.departmentId);
      setFormData((prev) => ({
        ...prev,
        programId: '',
        batchId: '',
        sectionId: '',
      }));
    } else {
      setPrograms([]);
      setFormData((prev) => ({
        ...prev,
        programId: '',
        batchId: '',
        sectionId: '',
      }));
    }
  }, [formData.departmentId]);

  useEffect(() => {
    if (formData.programId) {
      fetchBatches(formData.programId);
      setFormData((prev) => ({ ...prev, batchId: '', sectionId: '' }));
    } else {
      setBatches([]);
      setFormData((prev) => ({ ...prev, batchId: '', sectionId: '' }));
    }
  }, [formData.programId]);

  useEffect(() => {
    if (formData.batchId) {
      fetchSections(formData.batchId);
    } else {
      setSections([]);
      setFormData((prev) => ({ ...prev, sectionId: '' }));
    }
  }, [formData.batchId]);

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
          sectionId: formData.sectionId
            ? parseInt(formData.sectionId)
            : undefined,
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

  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const primaryColorDark = isDarkMode ? 'var(--orange-dark)' : 'var(--blue-dark)';

  if (!mounted) {
    return null;
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-3'>
        <Button
          variant='ghost'
          size='icon'
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
          <ArrowLeft className='h-4 w-4' />
        </Button>
        <div>
          <h1 className='text-lg font-bold text-primary-text'>Add Student</h1>
          <p className='text-xs text-secondary-text mt-0.5'>Create a new student account</p>
        </div>
      </div>

      <Card className="bg-card border-card-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-primary-text">Student Information</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='grid grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label htmlFor='firstName' className="text-xs text-primary-text">First Name</Label>
                <Input
                  id='firstName'
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  className={`${errors.firstName ? 'border-[var(--error)]' : ''} bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary`}
                />
                {errors.firstName && (
                  <p className='text-xs' style={{ color: 'var(--error)' }}>{errors.firstName}</p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='lastName' className="text-xs text-primary-text">Last Name</Label>
                <Input
                  id='lastName'
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  className={`${errors.lastName ? 'border-[var(--error)]' : ''} bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary`}
                />
                {errors.lastName && (
                  <p className='text-xs' style={{ color: 'var(--error)' }}>{errors.lastName}</p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='email' className="text-xs text-primary-text">Email</Label>
                <Input
                  id='email'
                  type='email'
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className={`${errors.email ? 'border-[var(--error)]' : ''} bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary`}
                />
                {errors.email && (
                  <p className='text-xs' style={{ color: 'var(--error)' }}>{errors.email}</p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='rollNumber' className="text-xs text-primary-text">Roll Number</Label>
                <Input
                  id='rollNumber'
                  value={formData.rollNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, rollNumber: e.target.value })
                  }
                  className={`${errors.rollNumber ? 'border-[var(--error)]' : ''} bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary`}
                />
                {errors.rollNumber && (
                  <p className='text-xs' style={{ color: 'var(--error)' }}>{errors.rollNumber}</p>
                )}
              </div>

              {/* Department is automatically set from Settings */}
              {currentDepartmentId && (
                <div className='space-y-2'>
                  <Label htmlFor='departmentId' className="text-xs text-primary-text">Department</Label>
                  <Input
                    id='departmentId'
                    value='Current Department (from Settings)'
                    disabled
                    className='bg-card border-card-border text-primary-text'
                    style={{ backgroundColor: 'var(--hover-bg)' }}
                  />
                  <p className='text-xs text-secondary-text'>
                    Department is configured in System Settings
                  </p>
                </div>
              )}

              <div className='space-y-2'>
                <Label htmlFor='programId' className="text-xs text-primary-text">Program</Label>
                <Select
                  value={formData.programId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, programId: value })
                  }
                  disabled={fetchingPrograms || !currentDepartmentId}
                >
                  <SelectTrigger
                    className={`${errors.programId ? 'border-[var(--error)]' : ''} bg-card border-card-border text-primary-text`}
                  >
                    <SelectValue placeholder='Select program' />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-card-border">
                    {programs.map((program) => (
                      <SelectItem
                        key={program.id}
                        value={program.id.toString()}
                        className="text-primary-text hover:bg-card/50"
                      >
                        {program.name} ({program.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.programId && (
                  <p className='text-xs' style={{ color: 'var(--error)' }}>{errors.programId}</p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='batchId' className="text-xs text-primary-text">Batch</Label>
                <Select
                  value={formData.batchId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, batchId: value })
                  }
                  disabled={fetchingBatches || !formData.programId}
                >
                  <SelectTrigger
                    className={`${errors.batchId ? 'border-[var(--error)]' : ''} bg-card border-card-border text-primary-text`}
                  >
                    <SelectValue placeholder='Select batch' />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-card-border">
                    {batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id} className="text-primary-text hover:bg-card/50">
                        {batch.name} ({batch.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.batchId && (
                  <p className='text-xs' style={{ color: 'var(--error)' }}>{errors.batchId}</p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='sectionId' className="text-xs text-primary-text">Section</Label>
                <Select
                  value={formData.sectionId || ''}
                  onValueChange={(value) =>
                    setFormData({ ...formData, sectionId: value })
                  }
                  disabled={
                    fetchingSections ||
                    !formData.batchId ||
                    sections.length === 0
                  }
                >
                  <SelectTrigger
                    className={`${errors.sectionId ? 'border-[var(--error)]' : ''} bg-card border-card-border text-primary-text`}
                  >
                    <SelectValue placeholder='Select section (optional)' />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-card-border">
                    {sections.map((section) => (
                      <SelectItem
                        key={section.id}
                        value={section.id.toString()}
                        className="text-primary-text hover:bg-card/50"
                      >
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.sectionId && (
                  <p className='text-xs' style={{ color: 'var(--error)' }}>{errors.sectionId}</p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='status' className="text-xs text-primary-text">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger
                    className={`${errors.status ? 'border-[var(--error)]' : ''} bg-card border-card-border text-primary-text`}
                  >
                    <SelectValue placeholder='Select status' />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-card-border">
                    <SelectItem value='active' className="text-primary-text hover:bg-card/50">Active</SelectItem>
                    <SelectItem value='inactive' className="text-primary-text hover:bg-card/50">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className='text-xs' style={{ color: 'var(--error)' }}>{errors.status}</p>
                )}
              </div>
            </div>

            <div className='flex justify-end gap-3'>
              <Button
                type='button'
                variant='outline'
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
                onClick={() => router.push('/admin/students')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                type='submit' 
                size="sm"
                className="h-8 text-xs text-white"
                style={{
                  backgroundColor: loading ? (isDarkMode ? '#9a3412' : '#1e40af') : primaryColor,
                  color: 'white',
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = primaryColorDark;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = primaryColor;
                  }
                }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className='mr-1.5 h-3.5 w-3.5 animate-spin' />
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
