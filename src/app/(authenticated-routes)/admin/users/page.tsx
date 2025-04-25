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
  userrole: {
    role: {
      name: string;
    };
  }[];
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
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold'>User Management</h1>
          <p className='text-muted-foreground'>
            Manage and monitor all system users
          </p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' size='sm'>
            <Download className='w-4 h-4 mr-2' />
            Export
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => router.push('/admin/users/import')}
          >
            <Upload className='w-4 h-4 mr-2' />
            Import
          </Button>
          <Button onClick={() => router.push('/admin/users/create')}>
            <UserPlus className='w-4 h-4 mr-2' />
            Add User
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                {stat.title}
              </CardTitle>
              <stat.icon className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stat.value}</div>
              <p className='text-xs text-muted-foreground'>
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filters */}
      <div className='flex gap-4'>
        <div className='relative flex-1'>
          <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search users...'
            className='pl-8'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant='outline'>
          <Filter className='w-4 h-4 mr-2' />
          Filters
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Manage all system users and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-[100px]'>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className='w-[100px]'>Actions</TableHead>
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
                      <Badge variant='outline'>
                        {user.userrole?.[0]?.role?.name || 'No Role'}
                      </Badge>
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
                    <TableCell>N/A</TableCell>
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
                            Edit
                          </DropdownMenuItem>
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
