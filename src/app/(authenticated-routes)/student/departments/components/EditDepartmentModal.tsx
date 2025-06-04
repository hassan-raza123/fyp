'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface Department {
  id: number;
  name: string;
  code: string;
  description: string | null;
  status: 'active' | 'inactive';
  adminId: number | null;
  createdAt: string;
  updatedAt: string;
  admin: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  _count: {
    programs: number;
    faculty: number;
    students: number;
  };
}

interface EditDepartmentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  department: Department | null;
}

export function EditDepartmentModal({
  open,
  onClose,
  onSuccess,
  department,
}: EditDepartmentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    status: 'active' as const,
  });

  useEffect(() => {
    if (open && department) {
      setFormData({
        name: department.name,
        code: department.code,
        description: department.description || '',
        status: department.status,
      });
    }
  }, [open, department]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!department) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/departments/${department.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Department updated successfully');
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || 'Failed to update department');
      }
    } catch (error) {
      toast.error('Error updating department');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!department) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Edit Department</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Department Name</label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder='Enter department name'
              required
            />
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium'>Department Code</label>
            <Input
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
              placeholder='Enter department code'
              required
            />
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium'>Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder='Enter department description'
            />
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium'>Status</label>
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

          <div className='flex justify-end gap-3'>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Department'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
