'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  DialogTrigger,
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

// Mock data - Replace with actual API call
const mockUser = {
  id: '1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  role: 'teacher',
  department: 'Computer Science',
  phone: '+1 234 567 8900',
  address: '123 Main St, City, Country',
  status: 'active',
  joinDate: '2024-01-01',
  lastLogin: '2024-04-20T10:30:00',
  avatar: '/images/avatar.png',
  permissions: ['manage_courses', 'manage_students', 'view_reports'],
  activityHistory: [
    {
      id: 1,
      action: 'Logged in',
      timestamp: '2024-04-20T10:30:00',
      ip: '192.168.1.1',
    },
    {
      id: 2,
      action: 'Updated profile',
      timestamp: '2024-04-19T15:45:00',
      ip: '192.168.1.1',
    },
  ],
};

const UserProfile = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement API call to delete user
      console.log('Deleting user:', params.id);
      router.push('/admin/users');
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleStatusChange = async (newStatus: 'active' | 'inactive') => {
    setIsLoading(true);
    try {
      // TODO: Implement API call to update user status
      console.log('Updating user status:', newStatus);
    } catch (error) {
      console.error('Error updating user status:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
            onClick={() => router.push(`/admin/users/${params.id}/edit`)}
          >
            <Edit2 className='w-4 h-4 mr-2' />
            Edit Profile
          </Button>
          <Button
            variant='outline'
            onClick={() =>
              handleStatusChange(
                mockUser.status === 'active' ? 'inactive' : 'active'
              )
            }
            disabled={isLoading}
          >
            {mockUser.status === 'active' ? (
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
          <Dialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant='destructive'>
                <Trash2 className='w-4 h-4 mr-2' />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete User</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this user? This action cannot
                  be undone.
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
                  variant='destructive'
                  onClick={handleDelete}
                  disabled={isLoading}
                >
                  {isLoading ? 'Deleting...' : 'Delete'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                    <AvatarImage src={mockUser.avatar} />
                    <AvatarFallback>
                      {mockUser.firstName[0]}
                      {mockUser.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className='text-xl'>
                      {mockUser.firstName} {mockUser.lastName}
                    </CardTitle>
                    <Badge
                      variant={
                        mockUser.status === 'active' ? 'default' : 'secondary'
                      }
                    >
                      {mockUser.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center gap-2'>
                  <Mail className='h-4 w-4 text-muted-foreground' />
                  <span>{mockUser.email}</span>
                </div>
                <div className='flex items-center gap-2'>
                  <Phone className='h-4 w-4 text-muted-foreground' />
                  <span>{mockUser.phone}</span>
                </div>
                <div className='flex items-center gap-2'>
                  <MapPin className='h-4 w-4 text-muted-foreground' />
                  <span>{mockUser.address}</span>
                </div>
                <div className='flex items-center gap-2'>
                  <Calendar className='h-4 w-4 text-muted-foreground' />
                  <span>
                    Joined {new Date(mockUser.joinDate).toLocaleDateString()}
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <Shield className='h-4 w-4 text-muted-foreground' />
                  <span className='capitalize'>
                    {mockUser.role.replace('_', ' ')}
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <Building2 className='h-4 w-4 text-muted-foreground' />
                  <span>{mockUser.department}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className='col-span-2'>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-2 gap-4'>
                  <Button variant='outline' className='h-24'>
                    <Lock className='w-6 h-6 mr-2' />
                    Reset Password
                  </Button>
                  <Button variant='outline' className='h-24'>
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
                {mockUser.permissions.map((permission, index) => (
                  <Badge key={index} variant='outline' className='text-sm'>
                    {permission.replace('_', ' ')}
                  </Badge>
                ))}
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
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockUser.activityHistory.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>{activity.action}</TableCell>
                      <TableCell>
                        {new Date(activity.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>{activity.ip}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserProfile;
