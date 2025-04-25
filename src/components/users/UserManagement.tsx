'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, UserCheck, UserX, FileUp, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  lastActive: string;
}

export default function UserManagement() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      // Ensure we have an array of users with all required properties
      const safeUsers = Array.isArray(data.users)
        ? data.users.map((user: any) => ({
            id: user?.id || '',
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            email: user?.email || '',
            role: user?.role || 'N/A',
            status: user?.status || 'N/A',
            lastActive: user?.lastActive || 'N/A',
          }))
        : [];
      setUsers(safeUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Failed to load users');
      setUsers([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      setDeletingUserId(userId);
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

      toast.success('User deleted successfully');
      setUsers(users.filter((user) => user.id !== userId));
    } catch (err) {
      toast.error('Failed to delete user');
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('You are not authorized to perform this action');
          router.push('/login');
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user status');
      }

      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, status: newStatus } : user
        )
      );
      toast.success(
        `User ${
          newStatus === 'active' ? 'activated' : 'deactivated'
        } successfully`
      );
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update user status'
      );
    }
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-center text-red-500'>
          <p>Error: {error}</p>
          <Button
            variant='outline'
            className='mt-4'
            onClick={() => {
              setError(null);
              fetchUsers();
            }}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const getInitials = (firstName: string, lastName: string) => {
    if (!firstName && !lastName) return '';
    const first = firstName ? firstName.charAt(0) : '';
    const last = lastName ? lastName.charAt(0) : '';
    return `${first}${last}`;
  };

  return (
    <div className='space-y-6'>
      {/* Quick Stats */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-500'>Total Users</p>
              <p className='text-2xl font-bold'>{users?.length || 0}</p>
            </div>
            <Users className='h-8 w-8 text-blue-500' />
          </div>
        </Card>
        <Card className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-500'>Active Users</p>
              <p className='text-2xl font-bold'>
                {users?.filter((user) => user?.status === 'active').length || 0}
              </p>
            </div>
            <UserCheck className='h-8 w-8 text-green-500' />
          </div>
        </Card>
        <Card className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-500'>
                Pending Approval
              </p>
              <p className='text-2xl font-bold'>
                {users?.filter((user) => user?.status === 'pending').length ||
                  0}
              </p>
            </div>
            <UserX className='h-8 w-8 text-yellow-500' />
          </div>
        </Card>
        <Card className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-500'>
                New This Month
              </p>
              <p className='text-2xl font-bold'>0</p>
            </div>
            <Plus className='h-8 w-8 text-purple-500' />
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className='flex flex-wrap gap-4'>
        <Link href='/dashboard/users/create'>
          <Button className='flex items-center gap-2'>
            <Plus className='h-4 w-4' />
            Add New User
          </Button>
        </Link>
        <Link href='/dashboard/users/import'>
          <Button variant='outline' className='flex items-center gap-2'>
            <FileUp className='h-4 w-4' />
            Bulk Import
          </Button>
        </Link>
      </div>

      {/* Users Table */}
      <Card className='p-4'>
        <h2 className='text-lg font-semibold mb-4'>Users</h2>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Name
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Role
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Status
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Last Active
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='flex items-center'>
                      <div className='h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center'>
                        <span className='text-gray-500'>
                          {getInitials(user.firstName, user.lastName)}
                        </span>
                      </div>
                      <div className='ml-4'>
                        <div className='text-sm font-medium text-gray-900'>
                          {user.firstName} {user.lastName}
                        </div>
                        <div className='text-sm text-gray-500'>
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span className='px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800'>
                      {user.role}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : user.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                    {user.lastActive}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                    <Link href={`/dashboard/users/${user.id}`}>
                      <button className='text-blue-600 hover:text-blue-900 mr-3'>
                        View
                      </button>
                    </Link>
                    <button
                      className='text-red-600 hover:text-red-900'
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={deletingUserId === user.id}
                    >
                      {deletingUserId === user.id ? (
                        <Loader2 className='h-4 w-4 animate-spin' />
                      ) : (
                        'Delete'
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
