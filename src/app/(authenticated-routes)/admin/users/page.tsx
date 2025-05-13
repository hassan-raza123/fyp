'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserPlus,
  FileUp,
  Search,
  Filter,
  MoreVertical,
  Download,
  Upload,
  UserCheck,
  UserX,
  Trash2,
  Edit2,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface User {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  status: string;
  role: string;
  faculty?: {
    employeeId: string;
    departmentId: number;
  } | null;
  student?: {
    rollNumber: string;
    departmentId: number;
    programId: number;
  } | null;
}

export default function UserManagement() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [userToUpdate, setUserToUpdate] = useState<User | null>(null);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Handle user deletion
  const handleDelete = async (userId: number) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          toast.error('You are not authorized to perform this action');
          router.push('/login');
          return;
        }
        throw new Error(errorData.message || 'Failed to delete user');
      }

      // Update UI after successful deletion
      setUsers(users.filter((user) => user.id !== userId));
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete user'
      );
    } finally {
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  // Handle user status change
  const handleStatusChange = async (userId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          toast.error('You are not authorized to perform this action');
          router.push('/login');
          return;
        }
        throw new Error(errorData.error || 'Failed to update user status');
      }

      const updatedUser = await response.json();

      // Update the users state with the new status
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, status: updatedUser.status } : user
        )
      );

      toast.success(`User status updated to ${updatedUser.status}`);
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update user status'
      );
    }
  };

  // Quick stats data
  const stats = [
    {
      title: 'Total Users',
      value: users.length.toString(),
      icon: Users,
      change: '+12%',
    },
    {
      title: 'Active Users',
      value: users.filter((u) => u.status === 'active').length.toString(),
      icon: UserCheck,
      change: '+5%',
    },
    {
      title: 'Pending Approval',
      value: users.filter((u) => u.status === 'pending').length.toString(),
      icon: UserX,
      change: '-3%',
    },
    {
      title: 'New This Month',
      value: '156',
      icon: UserPlus,
      change: '+8%',
    },
  ];

  return (
    <div className='space-y-6'>
      {/* Page header */}
      <div className='flex justify-between items-center'>
        <h1 className='text-2xl font-bold'>User Management</h1>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={() => router.push('/admin/users/import')}
          >
            <FileUp className='w-4 h-4 mr-2' />
            Import Users
          </Button>
          <Button onClick={() => router.push('/admin/users/create')}>
            <UserPlus className='w-4 h-4 mr-2' />
            Add User
          </Button>
        </div>
      </div>

      {/* Search and filters */}
      <div className='flex gap-4'>
        <div className='flex-1'>
          <Input
            placeholder='Search users...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full'
          />
        </div>
        <Button variant='outline'>
          <Filter className='w-4 h-4 mr-2' />
          Filters
        </Button>
      </div>

      {/* Users table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Manage your users and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className='text-center'>
                    Loading...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='text-center'>
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Avatar>
                          <AvatarFallback>
                            {user.first_name?.[0] || ''}
                            {user.last_name?.[0] || ''}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          {user.first_name || ''} {user.last_name || ''}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant='outline'>{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.status === 'active' ? 'default' : 'secondary'
                        }
                      >
                        {user.status || 'inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <div className='inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0'>
                            <MoreVertical className='h-4 w-4' />
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/admin/users/${user.id}`)
                            }
                          >
                            <Eye className='w-4 h-4 mr-2' />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setUserToUpdate(user);
                              setIsStatusDialogOpen(true);
                            }}
                          >
                            <Edit2 className='w-4 h-4 mr-2' />
                            Edit Profile
                          </DropdownMenuItem>
                          {user.role && user.role !== 'No Role' ? (
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/admin/users/${user.id}/edit-role`)
                              }
                            >
                              <Edit2 className='w-4 h-4 mr-2' />
                              Edit Role
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/admin/users/${user.id}/roles`)
                              }
                            >
                              <Edit2 className='w-4 h-4 mr-2' />
                              Assign Role
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => {
                              setUserToDelete(user.id);
                              setIsDeleteDialogOpen(true);
                            }}
                            className='text-red-600'
                          >
                            <Trash2 className='w-4 h-4 mr-2' />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant='default'
              className='bg-red-600 hover:bg-red-700 text-white'
              onClick={() => {
                if (userToDelete) {
                  handleDelete(userToDelete);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Status</DialogTitle>
            <DialogDescription>
              Are you sure you want to{' '}
              {userToUpdate?.status === 'active' ? 'deactivate' : 'activate'}{' '}
              this user?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsStatusDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant='default'
              onClick={() => {
                if (userToUpdate) {
                  handleStatusChange(
                    userToUpdate.id,
                    userToUpdate.status === 'active' ? 'inactive' : 'active'
                  );
                  setIsStatusDialogOpen(false);
                }
              }}
            >
              {userToUpdate?.status === 'active' ? 'Deactivate' : 'Activate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
