'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { DepartmentAdmin } from '@/types/department';

export default function DepartmentAdminsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [admins, setAdmins] = useState<DepartmentAdmin[]>([]);
  const [availableAdmins, setAvailableAdmins] = useState<
    { id: number; name: string; email: string }[]
  >([]);
  const [selectedAdmin, setSelectedAdmin] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDepartmentAdmins();
    fetchAvailableAdmins();
  }, []);

  const fetchDepartmentAdmins = async () => {
    try {
      const response = await fetch(`/api/departments/${params.id}/admins`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch department admins');
      }

      setAdmins(data);
    } catch (error) {
      console.error('Error fetching department admins:', error);
      toast.error('Failed to fetch department admins');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableAdmins = async () => {
    try {
      const response = await fetch('/api/users?role=department_admin');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch available admins');
      }

      setAvailableAdmins(data);
    } catch (error) {
      console.error('Error fetching available admins:', error);
      toast.error('Failed to fetch available admins');
    }
  };

  const handleAssignAdmin = async () => {
    if (!selectedAdmin) {
      toast.error('Please select an admin');
      return;
    }

    try {
      const response = await fetch(`/api/departments/${params.id}/admins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: parseInt(selectedAdmin),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign admin');
      }

      toast.success('Admin assigned successfully');
      fetchDepartmentAdmins();
      setSelectedAdmin('');
    } catch (error) {
      console.error('Error assigning admin:', error);
      toast.error('Failed to assign admin');
    }
  };

  const handleRemoveAdmin = async (adminId: number) => {
    if (!confirm('Are you sure you want to remove this admin?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/departments/${params.id}/admins/${adminId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove admin');
      }

      toast.success('Admin removed successfully');
      fetchDepartmentAdmins();
    } catch (error) {
      console.error('Error removing admin:', error);
      toast.error('Failed to remove admin');
    }
  };

  const handleSetHead = async (adminId: number) => {
    try {
      const response = await fetch(`/api/departments/${params.id}/admins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: adminId,
          isHead: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set head of department');
      }

      toast.success('Head of department set successfully');
      fetchDepartmentAdmins();
    } catch (error) {
      console.error('Error setting head of department:', error);
      toast.error('Failed to set head of department');
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-6'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold'>Department Admins</h1>
        <div className='flex space-x-4'>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant='default'>Assign Admin</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Admin to Department</DialogTitle>
                <DialogDescription>
                  Select an admin to assign to this department
                </DialogDescription>
              </DialogHeader>
              <div className='space-y-4'>
                <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
                  <SelectTrigger>
                    <SelectValue placeholder='Select admin' />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAdmins.map((admin) => (
                      <SelectItem key={admin.id} value={admin.id.toString()}>
                        {admin.name} ({admin.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  variant='default'
                  onClick={handleAssignAdmin}
                  disabled={!selectedAdmin}
                >
                  Assign
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant='outline' onClick={() => router.back()}>
            Back
          </Button>
        </div>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className='text-center'>
                  No admins assigned
                </TableCell>
              </TableRow>
            ) : (
              admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell>{admin.name}</TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>
                    {admin.isHead ? 'Head of Department' : 'Department Admin'}
                  </TableCell>
                  <TableCell>
                    <div className='flex space-x-2'>
                      {!admin.isHead && (
                        <Button
                          variant='outline'
                          onClick={() => handleSetHead(admin.id)}
                          className='hover:bg-blue-50'
                        >
                          Set as Head
                        </Button>
                      )}
                      <Button
                        variant='outline'
                        className='text-red-600 hover:text-red-700 hover:bg-red-50'
                        onClick={() => handleRemoveAdmin(admin.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
