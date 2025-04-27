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
  adminId: number | null;
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
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(true);

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  const fetchUsers = async () => {
    try {
      setFetchingUsers(true);
      const response = await fetch('/api/users?role=department_admin');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      setUsers(data.data);
      if (department.adminId) {
        setSelectedUserId(department.adminId.toString());
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setFetchingUsers(false);
    }
  };

  const handleAssign = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/departments/${department.id}/admin`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminId: selectedUserId ? parseInt(selectedUserId) : null,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to assign admin');
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
          error instanceof Error
            ? error.message
            : 'Failed to assign department admin',
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
            <label className='text-sm font-medium'>Department</label>
            <p className='text-sm text-muted-foreground'>{department.name}</p>
          </div>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Select Admin</label>
            {fetchingUsers ? (
              <div className='flex items-center justify-center py-4'>
                <Loader2 className='h-4 w-4 animate-spin' />
              </div>
            ) : (
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder='Select an admin' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=''>None</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.first_name} {user.last_name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className='flex justify-end gap-2'>
            <Button variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={loading}>
              {loading ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                'Assign Admin'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
