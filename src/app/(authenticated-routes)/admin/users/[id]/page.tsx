'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Building2,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  Lock,
  History,
  Book,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  } | null;
  faculty?: {
    employeeId: string;
    department: {
      id: number;
      name: string;
      code: string;
    };
  } | null;
  student?: {
    rollNumber: string;
    department: {
      id: number;
      name: string;
      code: string;
    };
    program: {
      id: number;
      name: string;
    };
  } | null;
  createdAt: string;
  updatedAt: string;
}

const UserProfile = ({ params }: { params: Promise<{ id: string }> }) => {
  const resolvedParams = use(params);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/users/${resolvedParams.id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            toast.error('You are not authorized to view this user');
            router.push('/login');
            return;
          }
          throw new Error('Failed to fetch user');
        }

        const data = await response.json();
        setUser(data);
      } catch (error) {
        console.error('Error fetching user:', error);
        toast.error('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [resolvedParams.id, router]);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${resolvedParams.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('You are not authorized to delete this user');
          router.push('/login');
          return;
        }
        throw new Error('Failed to delete user');
      }

      toast.success('User deleted successfully');
      router.push('/admin/users');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${resolvedParams.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('You are not authorized to update user status');
          router.push('/login');
          return;
        }
        throw new Error('Failed to update user status');
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      toast.success(`User status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/users/${resolvedParams.id}/reset-password`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('You are not authorized to reset password');
          router.push('/login');
          return;
        }
        throw new Error('Failed to reset password');
      }

      toast.success('Password reset email sent successfully');
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading user data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <p className='text-gray-600'>User not found</p>
      </div>
    );
  }

  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold'>User Profile</h1>
          <p className='text-muted-foreground'>View and manage user details</p>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={() =>
              router.push(`/admin/users/${resolvedParams.id}/edit`)
            }
            disabled={isLoading}
          >
            <Edit2 className='w-4 h-4 mr-2' />
            Edit Profile
          </Button>
          <Button
            variant='outline'
            onClick={() =>
              handleStatusChange(
                user.status === 'active' ? 'inactive' : 'active'
              )
            }
            disabled={isLoading}
          >
            {isLoading ? (
              <div className='flex items-center'>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2'></div>
                {user.status === 'active' ? 'Deactivating...' : 'Activating...'}
              </div>
            ) : user.status === 'active' ? (
              <>
                <UserX className='w-4 h-4 mr-2' />
                Deactivate
              </>
            ) : (
              <>
                <UserCheck className='w-4 h-4 mr-2' />
                Activate
              </>
            )}
          </Button>
          <Button
            variant='default'
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={isLoading}
            className='bg-red-600 hover:bg-red-700 text-white'
          >
            {isLoading ? (
              <div className='flex items-center'>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2'></div>
                Deleting...
              </div>
            ) : (
              <>
                <Trash2 className='w-4 h-4 mr-2' />
                Delete
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue='overview' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='permissions'>Permissions</TabsTrigger>
          <TabsTrigger value='activity'>Activity</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {/* Profile Card */}
            <Card className='col-span-1'>
              <CardHeader>
                <div className='flex items-center gap-4'>
                  <Avatar className='h-20 w-20'>
                    <AvatarFallback>
                      {user.first_name?.[0] || ''}
                      {user.last_name?.[0] || ''}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className='text-xl'>
                      {user.first_name} {user.last_name}
                    </CardTitle>
                    <Badge
                      variant={
                        user.status === 'active' ? 'default' : 'secondary'
                      }
                    >
                      {user.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center gap-2'>
                  <Mail className='h-4 w-4 text-muted-foreground' />
                  <span>{user.email}</span>
                </div>
                <div className='flex items-center gap-2'>
                  <Shield className='h-4 w-4 text-muted-foreground' />
                  <span className='capitalize'>
                    {user.userrole?.role?.name || 'No Role'}
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <Calendar className='h-4 w-4 text-muted-foreground' />
                  <span>
                    Joined{' '}
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                {user.faculty && (
                  <div className='flex items-center gap-2'>
                    <Building2 className='h-4 w-4 text-muted-foreground' />
                    <span>
                      Department: {user.faculty.department.name} (
                      {user.faculty.department.code})
                    </span>
                  </div>
                )}
                {user.student && (
                  <>
                    <div className='flex items-center gap-2'>
                      <Building2 className='h-4 w-4 text-muted-foreground' />
                      <span>
                        Department: {user.student.department.name} (
                        {user.student.department.code})
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <User className='h-4 w-4 text-muted-foreground' />
                      <span>Roll Number: {user.student.rollNumber}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Book className='h-4 w-4 text-muted-foreground' />
                      <span>Program: {user.student.program.name}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className='col-span-2'>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-2 gap-4'>
                  <Button
                    variant='outline'
                    className='h-24'
                    onClick={handleResetPassword}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className='flex flex-col items-center'>
                        <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-current mb-2'></div>
                        <span>Sending Reset Link...</span>
                      </div>
                    ) : (
                      <>
                        <Lock className='w-6 h-6 mr-2' />
                        Reset Password
                      </>
                    )}
                  </Button>
                  <Button
                    variant='outline'
                    className='h-24'
                    onClick={() =>
                      router.push(`/admin/users/${resolvedParams.id}/activity`)
                    }
                    disabled={isLoading}
                  >
                    <History className='w-6 h-6 mr-2' />
                    View Login History
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='permissions'>
          <Card>
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                {user.userrole?.role?.name && (
                  <Badge variant='outline' className='text-sm'>
                    {user.userrole.role.name}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='activity'>
          <Card>
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Profile Updated</TableCell>
                    <TableCell>
                      {new Date(user.updatedAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell>User profile information was updated</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Account Created</TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell>User account was created</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant='default'
              onClick={handleDelete}
              disabled={isLoading}
              className='bg-red-600 hover:bg-red-700 text-white'
            >
              {isLoading ? (
                <div className='flex items-center'>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2'></div>
                  Deleting...
                </div>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserProfile;
