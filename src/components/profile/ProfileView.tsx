'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageLoading } from '@/components/ui/page-loading';
import { toast } from 'sonner';
import { Lock, Save, User } from 'lucide-react';

/**
 * The account screen behind the "Profile" entry in the header menu.
 *
 * Shared by the admin, faculty and student routes: the three differ only in
 * which read-only details they have to show, and all three read and write the
 * same `users` row through `/api/profile`. Three copies of this form would have
 * been three places for the password rules to drift apart.
 */

interface NamedRef {
  id: number | string;
  name: string;
  code?: string;
}

interface ProfileData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  status: string;
  role: string;
  createdAt: string | null;
  lastLogin: string | null;
  designation: string | null;
  rollNumber: string | null;
  department: NamedRef | null;
  program: NamedRef | null;
  batch: NamedRef | null;
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

export function ProfileView({ title }: { title: string }) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch('/api/profile', { credentials: 'include' });
      const body = await response.json();

      if (!response.ok || !body.success) {
        throw new Error(body.error || 'Failed to load profile');
      }

      setProfile(body.data);
      setForm({
        firstName: body.data.firstName ?? '',
        lastName: body.data.lastName ?? '',
        phoneNumber: body.data.phoneNumber ?? '',
      });
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : 'Failed to load profile'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const body = await response.json();

      if (!response.ok || !body.success) {
        throw new Error(body.error || 'Failed to update profile');
      }

      toast.success('Profile updated');
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update profile'
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();

    // Checked here as well as on the server so the mismatch is caught before a
    // round trip; the server remains the authority on strength.
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('The new passwords do not match');
      return;
    }

    setSavingPassword(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const body = await response.json();

      if (!response.ok || !body.success) {
        throw new Error(body.error || 'Failed to change password');
      }

      toast.success('Password changed');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to change password'
      );
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) return <PageLoading />;

  if (loadError || !profile) {
    return (
      <div className='p-6'>
        <Card>
          <CardHeader>
            <CardTitle>Profile unavailable</CardTitle>
            <CardDescription>
              {loadError ?? 'Your profile could not be loaded.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={load}>Try again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const details: Array<[string, string]> = [
    ['Email', profile.email],
    ['Role', profile.role.replace('_', ' ')],
    ...(profile.rollNumber
      ? ([['Roll number', profile.rollNumber]] as Array<[string, string]>)
      : []),
    ...(profile.designation
      ? ([['Designation', profile.designation]] as Array<[string, string]>)
      : []),
    ...(profile.department
      ? ([['Department', profile.department.name]] as Array<[string, string]>)
      : []),
    ...(profile.program
      ? ([['Programme', profile.program.name]] as Array<[string, string]>)
      : []),
    ...(profile.batch
      ? ([['Batch', profile.batch.name]] as Array<[string, string]>)
      : []),
    ['Member since', formatDate(profile.createdAt)],
    ['Last sign-in', formatDate(profile.lastLogin)],
  ];

  return (
    <div className='space-y-6 p-6'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>{title}</h1>
          <p className='text-sm text-muted-foreground'>
            {profile.firstName} {profile.lastName} · {profile.email}
          </p>
        </div>
        <Badge variant={profile.status === 'active' ? 'default' : 'secondary'}>
          {profile.status}
        </Badge>
      </div>

      <Tabs defaultValue='profile'>
        <TabsList>
          <TabsTrigger value='profile'>
            <User className='mr-2 h-4 w-4' aria-hidden='true' />
            Details
          </TabsTrigger>
          <TabsTrigger value='password'>
            <Lock className='mr-2 h-4 w-4' aria-hidden='true' />
            Password
          </TabsTrigger>
        </TabsList>

        <TabsContent value='profile' className='mt-4 space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Your details</CardTitle>
              <CardDescription>
                Update the name and contact number shown across the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveProfile} className='space-y-4'>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label htmlFor='firstName'>First name</Label>
                    <Input
                      id='firstName'
                      value={form.firstName}
                      onChange={(e) =>
                        setForm({ ...form, firstName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='lastName'>Last name</Label>
                    <Input
                      id='lastName'
                      value={form.lastName}
                      onChange={(e) =>
                        setForm({ ...form, lastName: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='phoneNumber'>Phone number</Label>
                  <Input
                    id='phoneNumber'
                    value={form.phoneNumber}
                    onChange={(e) =>
                      setForm({ ...form, phoneNumber: e.target.value })
                    }
                    placeholder='Optional'
                  />
                </div>

                <Button aria-label="Save" type='submit' disabled={savingProfile}>
                  <Save className='mr-2 h-4 w-4' aria-hidden='true' />
                  {savingProfile ? 'Saving…' : 'Save changes'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>
                Managed by your administrator and not editable here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className='grid gap-4 sm:grid-cols-2'>
                {details.map(([label, value]) => (
                  <div key={label}>
                    <dt className='text-xs uppercase tracking-wide text-muted-foreground'>
                      {label}
                    </dt>
                    <dd className='mt-1 text-sm capitalize'>{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='password' className='mt-4'>
          <Card>
            <CardHeader>
              <CardTitle>Change password</CardTitle>
              <CardDescription>
                You will stay signed in on this device after changing it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={changePassword} className='max-w-md space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='currentPassword'>Current password</Label>
                  <Input
                    id='currentPassword'
                    type='password'
                    autoComplete='current-password'
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        currentPassword: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='newPassword'>New password</Label>
                  <Input
                    id='newPassword'
                    type='password'
                    autoComplete='new-password'
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='confirmPassword'>Confirm new password</Label>
                  <Input
                    id='confirmPassword'
                    type='password'
                    autoComplete='new-password'
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <Button aria-label="Lock" type='submit' disabled={savingPassword}>
                  <Lock className='mr-2 h-4 w-4' aria-hidden='true' />
                  {savingPassword ? 'Changing…' : 'Change password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
