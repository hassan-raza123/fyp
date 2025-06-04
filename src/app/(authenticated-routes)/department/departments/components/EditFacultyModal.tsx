'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface Faculty {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  designation: string;
  status: string;
}

interface EditFacultyModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  faculty: Faculty;
}

export function EditFacultyModal({
  open,
  onClose,
  onSuccess,
  faculty,
}: EditFacultyModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: faculty.first_name,
    last_name: faculty.last_name,
    email: faculty.email,
    designation: faculty.designation,
    status: faculty.status,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Only send designation and status to the API
      const updateData = {
        designation: formData.designation,
        status: formData.status,
      };

      const response = await fetch(`/api/faculty/${faculty.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update faculty member');
      }

      toast.success('Faculty member updated successfully');
      onSuccess();
    } catch (error) {
      console.error('Error updating faculty member:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update faculty member'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Faculty Member</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <label htmlFor='first_name' className='text-sm font-medium'>
                First Name
              </label>
              <Input
                id='first_name'
                value={formData.first_name}
                readOnly
                disabled
              />
            </div>
            <div className='space-y-2'>
              <label htmlFor='last_name' className='text-sm font-medium'>
                Last Name
              </label>
              <Input
                id='last_name'
                value={formData.last_name}
                readOnly
                disabled
              />
            </div>
          </div>

          <div className='space-y-2'>
            <label htmlFor='email' className='text-sm font-medium'>
              Email
            </label>
            <Input
              id='email'
              type='email'
              value={formData.email}
              readOnly
              disabled
            />
          </div>

          <div className='space-y-2'>
            <label htmlFor='designation' className='text-sm font-medium'>
              Designation
            </label>
            <Input
              id='designation'
              value={formData.designation}
              onChange={(e) =>
                setFormData({ ...formData, designation: e.target.value })
              }
              required
            />
          </div>

          <div className='space-y-2'>
            <label htmlFor='status' className='text-sm font-medium'>
              Status
            </label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
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

          <div className='flex justify-end gap-2'>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' disabled={loading}>
              {loading ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
