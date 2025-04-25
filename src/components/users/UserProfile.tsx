'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  Lock,
  Shield,
  History,
  Mail,
  Phone,
  MapPin,
  Calendar,
} from 'lucide-react';

interface UserProfileProps {
  userId: string;
}

export default function UserProfile({ userId }: UserProfileProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);

  // TODO: Fetch user data based on userId
  const user = {
    id: userId,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    role: 'TEACHER',
    status: 'active',
    phone: '+1 234 567 890',
    address: '123 Main St, City, Country',
    joinDate: '2023-01-01',
    lastLogin: '2024-02-20 14:30:00',
    permissions: ['read', 'write', 'delete'],
    activityLog: [
      {
        id: 1,
        action: 'Login',
        timestamp: '2024-02-20 14:30:00',
        ipAddress: '192.168.1.1',
      },
      {
        id: 2,
        action: 'Updated Profile',
        timestamp: '2024-02-19 10:15:00',
        ipAddress: '192.168.1.1',
      },
    ],
  };

  // Add null checks and default values
  const firstName = user?.firstName || '';
  const lastName = user?.lastName || '';
  const email = user?.email || '';
  const role = user?.role || '';
  const status = user?.status || '';
  const phone = user?.phone || '';
  const address = user?.address || '';
  const joinDate = user?.joinDate || '';
  const lastLogin = user?.lastLogin || '';
  const permissions = user?.permissions || [];
  const activityLog = user?.activityLog || [];

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <div className='flex items-center gap-4'>
          <div className='h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center'>
            <span className='text-2xl font-bold text-gray-500'>
              {firstName.charAt(0)}
              {lastName.charAt(0)}
            </span>
          </div>
          <div>
            <h2 className='text-2xl font-bold'>
              {firstName} {lastName}
            </h2>
            <p className='text-gray-500'>{email}</p>
          </div>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={() => router.push('/dashboard/users')}
          >
            Back to Users
          </Button>
          <Button>Edit Profile</Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value='profile' className='flex items-center gap-2'>
            <User className='h-4 w-4' />
            Profile
          </TabsTrigger>
          <TabsTrigger value='security' className='flex items-center gap-2'>
            <Lock className='h-4 w-4' />
            Security
          </TabsTrigger>
          <TabsTrigger value='permissions' className='flex items-center gap-2'>
            <Shield className='h-4 w-4' />
            Permissions
          </TabsTrigger>
          <TabsTrigger value='activity' className='flex items-center gap-2'>
            <History className='h-4 w-4' />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value='profile'>
          <Card className='p-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-4'>
                <div className='flex items-center gap-2'>
                  <Mail className='h-5 w-5 text-gray-400' />
                  <div>
                    <p className='text-sm text-gray-500'>Email</p>
                    <p className='font-medium'>{email}</p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <Phone className='h-5 w-5 text-gray-400' />
                  <div>
                    <p className='text-sm text-gray-500'>Phone</p>
                    <p className='font-medium'>{phone}</p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <MapPin className='h-5 w-5 text-gray-400' />
                  <div>
                    <p className='text-sm text-gray-500'>Address</p>
                    <p className='font-medium'>{address}</p>
                  </div>
                </div>
              </div>
              <div className='space-y-4'>
                <div className='flex items-center gap-2'>
                  <Calendar className='h-5 w-5 text-gray-400' />
                  <div>
                    <p className='text-sm text-gray-500'>Join Date</p>
                    <p className='font-medium'>{joinDate}</p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <History className='h-5 w-5 text-gray-400' />
                  <div>
                    <p className='text-sm text-gray-500'>Last Login</p>
                    <p className='font-medium'>{lastLogin}</p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <Shield className='h-5 w-5 text-gray-400' />
                  <div>
                    <p className='text-sm text-gray-500'>Role</p>
                    <p className='font-medium'>{role}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value='security'>
          <Card className='p-6'>
            <div className='space-y-6'>
              <div>
                <h3 className='text-lg font-medium mb-4'>Password</h3>
                <Button variant='outline'>Change Password</Button>
              </div>
              <div>
                <h3 className='text-lg font-medium mb-4'>
                  Two-Factor Authentication
                </h3>
                <Button variant='outline'>Enable 2FA</Button>
              </div>
              <div>
                <h3 className='text-lg font-medium mb-4'>Active Sessions</h3>
                <div className='space-y-4'>
                  {activityLog
                    .filter((log) => log.action === 'Login')
                    .map((log) => (
                      <div
                        key={log.id}
                        className='flex items-center justify-between p-4 border rounded-lg'
                      >
                        <div>
                          <p className='font-medium'>Browser Session</p>
                          <p className='text-sm text-gray-500'>
                            {log.ipAddress} - {log.timestamp}
                          </p>
                        </div>
                        <Button variant='outline' size='sm'>
                          Revoke
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value='permissions'>
          <Card className='p-6'>
            <div className='space-y-6'>
              <div>
                <h3 className='text-lg font-medium mb-4'>
                  Current Permissions
                </h3>
                <div className='flex flex-wrap gap-2'>
                  {permissions.map((permission) => (
                    <span
                      key={permission}
                      className='px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm'
                    >
                      {permission}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className='text-lg font-medium mb-4'>Role-based Access</h3>
                <p className='text-gray-600'>
                  Current role: <span className='font-medium'>{role}</span>
                </p>
                <Button variant='outline' className='mt-4'>
                  Change Role
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value='activity'>
          <Card className='p-6'>
            <div className='space-y-4'>
              {activityLog.map((log) => (
                <div
                  key={log.id}
                  className='flex items-center justify-between p-4 border rounded-lg'
                >
                  <div>
                    <p className='font-medium'>{log.action}</p>
                    <p className='text-sm text-gray-500'>
                      {log.ipAddress} - {log.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
