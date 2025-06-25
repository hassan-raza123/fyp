'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

interface Settings {
  system: {
    applicationName: string;
    academicYear: string;
    currentSemester: string;
    defaultLanguage: string;
    timeZone: string;
  };
  email: {
    smtpHost: string;
    smtpPort: string;
    smtpUsername: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
  };
  notifications: {
    enabled: boolean;
    channels: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    system: {
      applicationName: 'Smart Campus for MNSUET',
      academicYear: '2024',
      currentSemester: 'Spring',
      defaultLanguage: 'en',
      timeZone: 'UTC',
    },
    email: {
      smtpHost: '',
      smtpPort: '',
      smtpUsername: '',
      smtpPassword: '',
      fromEmail: '',
      fromName: '',
    },
    notifications: {
      enabled: true,
      channels: {
        email: true,
        push: false,
        sms: false,
      },
    },
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      if (data.success && data.data) {
        setSettings(data.data);
      }
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error('Failed to save settings');
      const data = await response.json();
      if (data.success) {
        toast.success('Settings saved successfully');
      } else {
        throw new Error(data.error || 'Failed to save settings');
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save settings'
      );
    }
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500'></div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
            System Settings
          </h1>
          <p className='text-gray-500 dark:text-gray-400'>
            Configure your application settings
          </p>
        </div>
        <Button onClick={handleSave}>
          <Save className='w-4 h-4 mr-2' />
          Save Changes
        </Button>
      </div>

      <div className='grid gap-6'>
        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
            <CardDescription>
              Configure basic system settings and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Application Name</Label>
                <Input
                  value={settings.system.applicationName}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      system: {
                        ...settings.system,
                        applicationName: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label>Academic Year</Label>
                <Input
                  value={settings.system.academicYear}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      system: {
                        ...settings.system,
                        academicYear: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label>Current Semester</Label>
                <Select
                  value={settings.system.currentSemester}
                  onValueChange={(value: string) =>
                    setSettings({
                      ...settings,
                      system: {
                        ...settings.system,
                        currentSemester: value,
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select semester' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='Spring'>Spring</SelectItem>
                    <SelectItem value='Fall'>Fall</SelectItem>
                    <SelectItem value='Summer'>Summer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label>Default Language</Label>
                <Select
                  value={settings.system.defaultLanguage}
                  onValueChange={(value: string) =>
                    setSettings({
                      ...settings,
                      system: {
                        ...settings.system,
                        defaultLanguage: value,
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select language' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='en'>English</SelectItem>
                    <SelectItem value='ur'>Urdu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label>Time Zone</Label>
                <Select
                  value={settings.system.timeZone}
                  onValueChange={(value: string) =>
                    setSettings({
                      ...settings,
                      system: {
                        ...settings.system,
                        timeZone: value,
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select timezone' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='UTC'>UTC</SelectItem>
                    <SelectItem value='Asia/Karachi'>
                      Pakistan (UTC+5)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Email Settings</CardTitle>
            <CardDescription>
              Configure SMTP settings for sending emails
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>SMTP Host</Label>
                <Input
                  value={settings.email.smtpHost}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      email: {
                        ...settings.email,
                        smtpHost: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label>SMTP Port</Label>
                <Input
                  value={settings.email.smtpPort}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      email: {
                        ...settings.email,
                        smtpPort: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label>SMTP Username</Label>
                <Input
                  value={settings.email.smtpUsername}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      email: {
                        ...settings.email,
                        smtpUsername: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label>SMTP Password</Label>
                <Input
                  type='password'
                  value={settings.email.smtpPassword}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      email: {
                        ...settings.email,
                        smtpPassword: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label>From Email</Label>
                <Input
                  value={settings.email.fromEmail}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      email: {
                        ...settings.email,
                        fromEmail: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label>From Name</Label>
                <Input
                  value={settings.email.fromName}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      email: {
                        ...settings.email,
                        fromName: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>
              Configure notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center space-x-2'>
              <Switch
                checked={settings.notifications.enabled}
                onCheckedChange={(checked: boolean) =>
                  setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      enabled: checked,
                    },
                  })
                }
              />
              <Label>Enable Notifications</Label>
            </div>
            <div className='space-y-4'>
              <div className='flex items-center space-x-2'>
                <Switch
                  checked={settings.notifications.channels.email}
                  onCheckedChange={(checked: boolean) =>
                    setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        channels: {
                          ...settings.notifications.channels,
                          email: checked,
                        },
                      },
                    })
                  }
                />
                <Label>Email Notifications</Label>
              </div>
              <div className='flex items-center space-x-2'>
                <Switch
                  checked={settings.notifications.channels.push}
                  onCheckedChange={(checked: boolean) =>
                    setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        channels: {
                          ...settings.notifications.channels,
                          push: checked,
                        },
                      },
                    })
                  }
                />
                <Label>Push Notifications</Label>
              </div>
              <div className='flex items-center space-x-2'>
                <Switch
                  checked={settings.notifications.channels.sms}
                  onCheckedChange={(checked: boolean) =>
                    setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        channels: {
                          ...settings.notifications.channels,
                          sms: checked,
                        },
                      },
                    })
                  }
                />
                <Label>SMS Notifications</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
