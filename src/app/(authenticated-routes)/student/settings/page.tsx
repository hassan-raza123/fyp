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
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Save, User, Lock, Settings } from 'lucide-react';

interface ProfileData {
  id: number;
  rollNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: {
    id: number;
    name: string;
    code: string;
  } | null;
  program: {
    id: number;
    name: string;
    code: string;
  } | null;
  batch: {
    id: string;
    name: string;
  } | null;
  status: string;
}

interface Preferences {
  notificationPreferences: {
    emailNotifications: boolean;
    assessmentReminders: boolean;
    gradeNotifications: boolean;
    systemUpdates: boolean;
  };
  displayPreferences: {
    gradeDisplayFormat: 'percentage' | 'letter' | 'both';
    dateFormat: string;
    defaultView: string;
  };
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile state
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Preferences state
  const [preferences, setPreferences] = useState<Preferences>({
    notificationPreferences: {
      emailNotifications: true,
      assessmentReminders: true,
      gradeNotifications: true,
      systemUpdates: true,
    },
    displayPreferences: {
      gradeDisplayFormat: 'both',
      dateFormat: 'MM/DD/YYYY',
      defaultView: 'dashboard',
    },
  });

  useEffect(() => {
    fetchProfile();
    fetchPreferences();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/student/profile', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch profile');
      const result = await response.json();
      if (result.success) {
        setProfile(result.data);
        setProfileForm({
          firstName: result.data.firstName,
          lastName: result.data.lastName,
          email: result.data.email,
          phone: result.data.phone || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/student/preferences', {
        credentials: 'include',
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setPreferences(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(profileForm),
      });

      if (!response.ok) throw new Error('Failed to update profile');
      const result = await response.json();
      if (result.success) {
        toast.success('Profile updated successfully');
        fetchProfile();
      } else {
        throw new Error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update profile'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        toast.error("Passwords don't match");
        return;
      }

      if (passwordForm.newPassword.length < 6) {
        toast.error('Password must be at least 6 characters long');
        return;
      }

      setSaving(true);
      const response = await fetch('/api/student/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(passwordForm),
      });

      if (!response.ok) throw new Error('Failed to change password');
      const result = await response.json();
      if (result.success) {
        toast.success('Password changed successfully');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        throw new Error(result.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to change password'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/student/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(preferences),
      });

      if (!response.ok) throw new Error('Failed to update preferences');
      const result = await response.json();
      if (result.success) {
        toast.success('Preferences updated successfully');
      } else {
        throw new Error(result.error || 'Failed to update preferences');
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update preferences'
      );
    } finally {
      setSaving(false);
    }
  };

  // Password strength calculation
  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: '', color: '' };
    if (password.length < 6) return { strength: 1, label: 'Weak', color: 'bg-red-500' };
    if (password.length < 8) return { strength: 2, label: 'Fair', color: 'bg-yellow-500' };
    if (password.length < 12) return { strength: 3, label: 'Good', color: 'bg-blue-500' };
    return { strength: 4, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(passwordForm.newPassword);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-page">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin border-primary" />
          <p className="text-xs text-secondary-text">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-primary-text">Student Settings</h1>
        <p className="text-xs text-secondary-text mt-0.5">Manage your profile and preferences</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="password">
            <Lock className="mr-2 h-4 w-4" />
            Change Password
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Settings className="mr-2 h-4 w-4" />
            Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {profile && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rollNumber">Roll Number</Label>
                      <Input
                        id="rollNumber"
                        value={profile.rollNumber}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500">
                        Roll number cannot be changed
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="program">Program</Label>
                      <Input
                        id="program"
                        value={profile.program?.name || 'N/A'}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500">
                        Program cannot be changed
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={profile.department?.name || 'N/A'}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500">
                        Department cannot be changed
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="batch">Batch</Label>
                      <Input
                        id="batch"
                        value={profile.batch?.name || 'N/A'}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500">
                        Batch cannot be changed
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={profileForm.firstName}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            firstName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={profileForm.lastName}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            lastName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            email: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            phone: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <Button onClick={handleSaveProfile} disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password *</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      currentPassword: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password *</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                />
                {passwordForm.newPassword && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded ${
                            level <= passwordStrength.strength
                              ? passwordStrength.color
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      Strength: {passwordStrength.label || 'Enter password'}
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  Password must be at least 6 characters long
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                />
                {passwordForm.confirmPassword &&
                  passwordForm.newPassword !== passwordForm.confirmPassword && (
                    <p className="text-xs text-red-500">
                      Passwords don't match
                    </p>
                  )}
              </div>
              <Button onClick={handleChangePassword} disabled={saving}>
                <Lock className="mr-2 h-4 w-4" />
                {saving ? 'Changing...' : 'Change Password'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>
                Customize your notification and display preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Notification Preferences */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Notification Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="emailNotifications">
                        Email Notifications
                      </Label>
                      <p className="text-sm text-gray-500">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={preferences.notificationPreferences.emailNotifications}
                      onCheckedChange={(checked) =>
                        setPreferences({
                          ...preferences,
                          notificationPreferences: {
                            ...preferences.notificationPreferences,
                            emailNotifications: checked,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="assessmentReminders">
                        Assessment Reminders
                      </Label>
                      <p className="text-sm text-gray-500">
                        Get reminders for upcoming assessments
                      </p>
                    </div>
                    <Switch
                      id="assessmentReminders"
                      checked={preferences.notificationPreferences.assessmentReminders}
                      onCheckedChange={(checked) =>
                        setPreferences({
                          ...preferences,
                          notificationPreferences: {
                            ...preferences.notificationPreferences,
                            assessmentReminders: checked,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="gradeNotifications">
                        Grade Notifications
                      </Label>
                      <p className="text-sm text-gray-500">
                        Get notified when grades are published
                      </p>
                    </div>
                    <Switch
                      id="gradeNotifications"
                      checked={preferences.notificationPreferences.gradeNotifications}
                      onCheckedChange={(checked) =>
                        setPreferences({
                          ...preferences,
                          notificationPreferences: {
                            ...preferences.notificationPreferences,
                            gradeNotifications: checked,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="systemUpdates">System Updates</Label>
                      <p className="text-sm text-gray-500">
                        Receive system updates and announcements
                      </p>
                    </div>
                    <Switch
                      id="systemUpdates"
                      checked={preferences.notificationPreferences.systemUpdates}
                      onCheckedChange={(checked) =>
                        setPreferences({
                          ...preferences,
                          notificationPreferences: {
                            ...preferences.notificationPreferences,
                            systemUpdates: checked,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Display Preferences */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Display Preferences</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gradeDisplayFormat">
                      Grade Display Format
                    </Label>
                    <Select
                      value={preferences.displayPreferences.gradeDisplayFormat}
                      onValueChange={(value: 'percentage' | 'letter' | 'both') =>
                        setPreferences({
                          ...preferences,
                          displayPreferences: {
                            ...preferences.displayPreferences,
                            gradeDisplayFormat: value,
                          },
                        })
                      }
                    >
                      <SelectTrigger id="gradeDisplayFormat">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="letter">Letter Grade</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <Select
                      value={preferences.displayPreferences.dateFormat}
                      onValueChange={(value) =>
                        setPreferences({
                          ...preferences,
                          displayPreferences: {
                            ...preferences.displayPreferences,
                            dateFormat: value,
                          },
                        })
                      }
                    >
                      <SelectTrigger id="dateFormat">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="defaultView">Default View</Label>
                    <Select
                      value={preferences.displayPreferences.defaultView}
                      onValueChange={(value) =>
                        setPreferences({
                          ...preferences,
                          displayPreferences: {
                            ...preferences.displayPreferences,
                            defaultView: value,
                          },
                        })
                      }
                    >
                      <SelectTrigger id="defaultView">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dashboard">Dashboard</SelectItem>
                        <SelectItem value="courses">Courses</SelectItem>
                        <SelectItem value="assessments">Assessments</SelectItem>
                        <SelectItem value="results">Results</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button onClick={handleSavePreferences} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
