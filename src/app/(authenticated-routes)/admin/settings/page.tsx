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
  obe?: {
    cloAttainmentThreshold: number;
    ploAttainmentThreshold: number;
    defaultGradingScale: string;
    assessmentWeightageSum: number;
    mappingStrengthWeights: {
      high: number;
      medium: number;
      low: number;
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
    obe: {
      cloAttainmentThreshold: 70,
      ploAttainmentThreshold: 70,
      defaultGradingScale: 'percentage',
      assessmentWeightageSum: 100,
      mappingStrengthWeights: {
        high: 1.0,
        medium: 0.7,
        low: 0.4,
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

        {/* OBE Settings */}
        <Card>
          <CardHeader>
            <CardTitle>OBE (Outcome-Based Education) Settings</CardTitle>
            <CardDescription>
              Configure outcome-based education parameters and thresholds
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>CLO Attainment Threshold (%)</Label>
                <Input
                  type='number'
                  min='0'
                  max='100'
                  value={settings.obe?.cloAttainmentThreshold || 70}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      obe: {
                        ...settings.obe!,
                        cloAttainmentThreshold: parseInt(e.target.value) || 70,
                      },
                    })
                  }
                />
                <p className='text-xs text-muted-foreground'>
                  Minimum percentage for CLO to be considered "Attained"
                </p>
              </div>
              <div className='space-y-2'>
                <Label>PLO Attainment Threshold (%)</Label>
                <Input
                  type='number'
                  min='0'
                  max='100'
                  value={settings.obe?.ploAttainmentThreshold || 70}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      obe: {
                        ...settings.obe!,
                        ploAttainmentThreshold: parseInt(e.target.value) || 70,
                      },
                    })
                  }
                />
                <p className='text-xs text-muted-foreground'>
                  Minimum percentage for PLO to be considered "Attained"
                </p>
              </div>
              <div className='space-y-2'>
                <Label>Default Grading Scale</Label>
                <Select
                  value={settings.obe?.defaultGradingScale || 'percentage'}
                  onValueChange={(value: string) =>
                    setSettings({
                      ...settings,
                      obe: {
                        ...settings.obe!,
                        defaultGradingScale: value,
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select grading scale' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='percentage'>Percentage</SelectItem>
                    <SelectItem value='letter'>Letter Grade</SelectItem>
                    <SelectItem value='gpa'>GPA Scale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label>Assessment Weightage Sum (%)</Label>
                <Input
                  type='number'
                  min='0'
                  max='200'
                  value={settings.obe?.assessmentWeightageSum || 100}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      obe: {
                        ...settings.obe!,
                        assessmentWeightageSum: parseInt(e.target.value) || 100,
                      },
                    })
                  }
                />
                <p className='text-xs text-muted-foreground'>
                  Expected sum of all assessment weightages (typically 100%)
                </p>
              </div>
            </div>
            <div className='border-t pt-4'>
              <Label className='text-base font-semibold mb-4 block'>
                CLO-PLO Mapping Strength Weights
              </Label>
              <div className='grid grid-cols-3 gap-4'>
                <div className='space-y-2'>
                  <Label>High Mapping Weight</Label>
                  <Input
                    type='number'
                    step='0.1'
                    min='0'
                    max='1'
                    value={settings.obe?.mappingStrengthWeights.high || 1.0}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        obe: {
                          ...settings.obe!,
                          mappingStrengthWeights: {
                            ...settings.obe!.mappingStrengthWeights,
                            high: parseFloat(e.target.value) || 1.0,
                          },
                        },
                      })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Medium Mapping Weight</Label>
                  <Input
                    type='number'
                    step='0.1'
                    min='0'
                    max='1'
                    value={settings.obe?.mappingStrengthWeights.medium || 0.7}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        obe: {
                          ...settings.obe!,
                          mappingStrengthWeights: {
                            ...settings.obe!.mappingStrengthWeights,
                            medium: parseFloat(e.target.value) || 0.7,
                          },
                        },
                      })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Low Mapping Weight</Label>
                  <Input
                    type='number'
                    step='0.1'
                    min='0'
                    max='1'
                    value={settings.obe?.mappingStrengthWeights.low || 0.4}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        obe: {
                          ...settings.obe!,
                          mappingStrengthWeights: {
                            ...settings.obe!.mappingStrengthWeights,
                            low: parseFloat(e.target.value) || 0.4,
                          },
                        },
                      })
                    }
                  />
                </div>
              </div>
              <p className='text-xs text-muted-foreground mt-2'>
                These weights are used when calculating PLO attainments from CLO
                attainments based on mapping strength
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
