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
  roles: string[];
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
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('none');
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [fetchingDepartments, setFetchingDepartments] = useState(false);

  useEffect(() => {
    if (open) {
      fetchUsers();
      fetchDepartments();
    }
  }, [open]);

  const fetchDepartments = async () => {
    try {
      setFetchingDepartments(true);
      const response = await fetch('/api/departments', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch departments');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch departments');
      }

      setDepartments(data.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to fetch departments',
        variant: 'destructive',
      });
    } finally {
      setFetchingDepartments(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setFetchingUsers(true);
      const response = await fetch(
        '/api/departments/users?role=department_admin',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      // Ensure we have valid data
      if (!Array.isArray(data.data)) {
        throw new Error('Invalid response format');
      }

      // Format the users data
      const formattedUsers = data.data.map((user: any) => ({
        id: user.id,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        roles: Array.isArray(user.roles) ? user.roles : [],
      }));

      setUsers(formattedUsers);

      if (department.adminId) {
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
    } finally {
      setFetchingUsers(false);
    }
  };

  const handleAssign = async () => {
    try {
      setLoading(true);

      // First assign the department admin role
      const roleResponse = await fetch(
        `/api/users/${selectedUserId}/department-admin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            departmentId: department.id,
          }),
        }
      );

      const roleData = await roleResponse.json();

      if (!roleResponse.ok) {
        throw new Error(
          roleData.error || 'Failed to assign department admin role'
        );
      }

      if (!roleData.success) {
        throw new Error(
          roleData.error || 'Failed to assign department admin role'
        );
      }

      // Then update the department's adminId
      const deptResponse = await fetch(
        `/api/departments/${department.id}/admin`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            adminId:
              selectedUserId === 'none' ? null : parseInt(selectedUserId),
          }),
        }
      );

      const deptData = await deptResponse.json();

      if (!deptResponse.ok) {
        throw new Error(deptData.error || 'Failed to assign admin');
      }

      if (!deptData.success) {
        throw new Error(deptData.error || 'Failed to assign admin');
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
                  {users.map((user) => (
                    <SelectItem
                      key={user.id}
                      value={user.id.toString()}
                      className='py-3 hover:bg-accent'
                    >
                      <div className='flex flex-col gap-1'>
                        <span className='font-medium text-foreground'>
                          {user.first_name} {user.last_name}
                        </span>
                        <span className='text-sm text-muted-foreground'>
                          {user.email}
                        </span>
                        <span className='text-xs text-muted-foreground'>
                          {user.roles.join(', ')}
                        </span>
                      </div>
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
