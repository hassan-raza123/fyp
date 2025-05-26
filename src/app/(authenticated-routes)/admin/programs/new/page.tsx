'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { programs_status } from '@prisma/client';

interface Department {
  id: number;
  name: string;
  code: string;
}

interface FormData {
  name: string;
  code: string;
  departmentId: string;
  totalCreditHours: string;
  duration: string;
  description: string;
  status: programs_status;
}

export default function NewProgramPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    code: '',
    departmentId: '',
    totalCreditHours: '',
    duration: '',
    description: '',
    status: programs_status.active,
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (!response.ok) throw new Error('Failed to fetch departments');
      const data = await response.json();
      if (data.success && data.data.length > 0) {
        setDepartments(data.data);
        setFormData((prev) => ({
          ...prev,
          departmentId: data.data[0].id.toString(),
        }));
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to fetch departments');
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Program name is required');
      return false;
    }
    if (!formData.code.trim()) {
      toast.error('Program code is required');
      return false;
    }
    if (!formData.departmentId) {
      toast.error('Please select a department');
      return false;
    }
    if (
      !formData.totalCreditHours ||
      isNaN(Number(formData.totalCreditHours))
    ) {
      toast.error('Please enter valid total credit hours');
      return false;
    }
    if (!formData.duration || isNaN(Number(formData.duration))) {
      toast.error('Please enter valid duration');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await fetch('/api/programs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          code: formData.code,
          departmentId: formData.departmentId,
          totalCreditHours: formData.totalCreditHours,
          duration: formData.duration,
          description: formData.description,
          status: formData.status,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (error) {
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create program');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create program');
      }

      toast.success('Program created successfully');
      router.push('/admin/programs');
    } catch (error) {
      console.error('Error creating program:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create program'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='container mx-auto py-10'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold'>Create New Program</h1>
        <p className='text-muted-foreground'>
          Add a new academic program to the system
        </p>
      </div>

      <Card className='p-6'>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Program Name</Label>
              <Input
                id='name'
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder='Enter program name'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='code'>Program Code</Label>
              <Input
                id='code'
                required
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder='Enter program code'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='department'>Department</Label>
              <Select
                value={formData.departmentId}
                onValueChange={(value) =>
                  setFormData({ ...formData, departmentId: value })
                }
              >
                <SelectTrigger id='department'>
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
            </div>

            <div className='space-y-2'>
              <Label htmlFor='totalCreditHours'>Total Credit Hours</Label>
              <Input
                id='totalCreditHours'
                required
                type='number'
                min='0'
                value={formData.totalCreditHours}
                onChange={(e) =>
                  setFormData({ ...formData, totalCreditHours: e.target.value })
                }
                placeholder='Enter total credit hours'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='duration'>Duration (Years)</Label>
              <Input
                id='duration'
                required
                type='number'
                min='1'
                value={formData.duration}
                onChange={(e) =>
                  setFormData({ ...formData, duration: e.target.value })
                }
                placeholder='Enter duration in years'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='status'>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as programs_status })
                }
              >
                <SelectTrigger id='status'>
                  <SelectValue placeholder='Select status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={programs_status.active}>Active</SelectItem>
                  <SelectItem value={programs_status.inactive}>
                    Inactive
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2 md:col-span-2'>
              <Label htmlFor='description'>Description</Label>
              <Input
                id='description'
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder='Enter program description (optional)'
              />
            </div>
          </div>

          <div className='flex justify-end gap-4 mt-6'>
            <Button
              type='button'
              variant='outline'
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={loading}>
              {loading ? 'Creating...' : 'Create Program'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
