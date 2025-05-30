'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { programs_status } from '@prisma/client';
import { use } from 'react';

interface Department {
  id: number;
  name: string;
  code: string;
}

interface Program {
  id: number;
  name: string;
  code: string;
  departmentId: number;
  totalCreditHours: number;
  duration: number;
  status: programs_status;
  description: string | null;
}

export default function EditProgramPage() {
  const router = useRouter();
  const params = useParams();
  const programId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState<Program | null>(null);

  useEffect(() => {
    fetchProgram();
    fetchDepartments();
  }, [programId]);

  const fetchProgram = async () => {
    try {
      const response = await fetch(`/api/programs/${programId}`);
      if (!response.ok) throw new Error('Failed to fetch program');
      const data = await response.json();
      if (data.success) {
        setFormData(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch program');
      }
    } catch (error) {
      console.error('Error fetching program:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to fetch program'
      );
      router.push('/admin/programs');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (!response.ok) throw new Error('Failed to fetch departments');
      const data = await response.json();
      if (data.success) {
        setDepartments(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch departments');
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to fetch departments'
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/programs/${programId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update program');
      }

      toast.success('Program updated successfully');
      router.push('/admin/programs');
    } catch (error) {
      console.error('Error updating program:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update program'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!formData) return;
    const { name, value } = e.target;
    setFormData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        [name]:
          name === 'totalCreditHours' || name === 'duration'
            ? parseInt(value)
            : value,
      };
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    if (!formData) return;
    setFormData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        [name]: name === 'departmentId' ? parseInt(value) : value,
      };
    });
  };

  if (loading) {
    return (
      <div className='container mx-auto py-10'>
        <div className='text-center'>Loading...</div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className='container mx-auto py-10'>
        <div className='text-center'>Program not found</div>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-10'>
      <h1 className='text-3xl font-bold mb-6'>Edit Program</h1>
      <Card className='p-6'>
        <form onSubmit={handleSubmit} className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Program Name</Label>
              <Input
                id='name'
                name='name'
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='code'>Program Code</Label>
              <Input
                id='code'
                name='code'
                value={formData.code}
                onChange={handleChange}
                required
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='departmentId'>Department</Label>
              <Select
                value={formData.departmentId?.toString() || ''}
                onValueChange={(value) =>
                  handleSelectChange('departmentId', value)
                }
              >
                <SelectTrigger>
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
                name='totalCreditHours'
                type='number'
                value={formData.totalCreditHours}
                onChange={handleChange}
                required
                min={0}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='duration'>Duration (years)</Label>
              <Input
                id='duration'
                name='duration'
                type='number'
                value={formData.duration}
                onChange={handleChange}
                required
                min={1}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='status'>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleSelectChange('status', value)}
              >
                <SelectTrigger>
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
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>Description</Label>
            <Textarea
              id='description'
              name='description'
              value={formData.description || ''}
              onChange={handleChange}
              rows={4}
            />
          </div>

          <div className='flex justify-end gap-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => router.push('/admin/programs')}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
