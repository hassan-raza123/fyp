import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface Department {
  id: number;
  name: string;
  code: string;
  description: string | null;
  status: 'active' | 'inactive';
  adminId: number | null;
  admin: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

interface AssignAdminModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  department: Department;
}

export function AssignAdminModal({
  open,
  onClose,
  onSuccess,
  department,
}: AssignAdminModalProps) {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('none');
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);

  // Safety check for department prop
  if (!department) {
    console.error('AssignAdminModal: department prop is missing');
    return null;
  }

  useEffect(() => {
    if (open) {
      fetchUsers();
    } else {
      // Reset state when modal closes
      setUsers([]);
      setSelectedUserId('none');
    }
  }, [open, department?.id]);

  const fetchUsers = async () => {
    try {
      setFetchingUsers(true);
      const response = await fetch('/api/departments/users/available', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      // API returns 'users' field, not 'data'
      setUsers(Array.isArray(data.users) ? data.users : []);

      if (department && department.adminId) {
        setSelectedUserId(department.adminId.toString());
      } else {
        setSelectedUserId('none');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to fetch users',
        variant: 'destructive',
      });
      // Set empty array in case of error to prevent undefined errors
      setUsers([]);
    } finally {
      setFetchingUsers(false);
    }
  };

  const handleAssign = async () => {
    // Validate inputs
    if (!department || !department.id) {
      toast({
        title: 'Error',
        description: 'Invalid department data',
        variant: 'destructive',
      });
      return;
    }

    if (selectedUserId === 'none') {
      toast({
        title: 'Error',
        description: 'Please select a user',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      // First assign the department admin role
      const roleResponse = await fetch(`/api/users/${selectedUserId}/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          roles: ['department_admin'],
          facultyDetails: {
            departmentId: department.id,
            designation: 'Department Admin',
          },
        }),
      });

      // Check if response is valid
      if (!roleResponse || !roleResponse.ok) {
        const errorData = await roleResponse.json().catch(() => ({}));
        throw new Error(
          errorData.error || 'Failed to assign department admin role'
        );
      }

      const roleData = await roleResponse.json().catch(() => ({}));

      if (!roleData || !roleData.success) {
        throw new Error(
          roleData?.error || 'Failed to assign department admin role'
        );
      }

      toast({
        title: 'Success',
        description: 'Department admin assigned successfully',
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error assigning admin:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to assign admin',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Department Admin</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Select Admin</label>
            {fetchingUsers ? (
              <div className='flex items-center justify-center py-4'>
                <Loader2 className='h-4 w-4 animate-spin' />
              </div>
            ) : users.length === 0 ? (
              <p className='text-sm text-muted-foreground'>
                No users available
              </p>
            ) : (
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select an admin' />
                </SelectTrigger>
                <SelectContent className='max-h-[300px] bg-background border shadow-lg'>
                  <SelectItem value='none' className='py-3'>
                    <span className='font-medium'>None</span>
                  </SelectItem>
                  {Array.isArray(users) &&
                    users.map((user) =>
                      user && user.id ? (
                        <SelectItem
                          key={user.id}
                          value={user.id.toString()}
                          className='py-3 hover:bg-accent'
                        >
                          <div className='flex flex-col gap-1'>
                            <span className='font-medium text-foreground'>
                              {user.first_name || ''} {user.last_name || ''}
                            </span>
                            <span className='text-sm text-muted-foreground'>
                              {user.email || ''}
                            </span>
                          </div>
                        </SelectItem>
                      ) : null
                    )}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className='flex justify-end space-x-2'>
            <Button variant='outline' onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={loading || selectedUserId === 'none'}
            >
              {loading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Assigning...
                </>
              ) : (
                'Assign'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
