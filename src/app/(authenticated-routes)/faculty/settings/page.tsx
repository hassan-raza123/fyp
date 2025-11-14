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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Save, User, Settings, GraduationCap, Lock } from 'lucide-react';

interface ProfileData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  employeeId: string;
  designation: string;
  department: {
    id: number;
    name: string;
    code: string;
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
  teachingPreferences: {
    defaultAssessmentType: string;
    defaultWeightage: number;
    cloCalculationThreshold: number;
    autoCalculateGrades: boolean;
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
    phoneNumber: '',
  });

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Preferences state
  const [preferences, setPreferences] = useState<Preferences | null>(null);

  useEffect(() => {
    fetchProfile();
    fetchPreferences();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/faculty/profile', {
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
          phoneNumber: result.data.phoneNumber || '',
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
      const response = await fetch('/api/faculty/preferences', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch preferences');
      const result = await response.json();
      if (result.success) {
        setPreferences(result.data);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/faculty/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
          email: profileForm.email,
          phoneNumber: profileForm.phoneNumber,
        }),
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

      setSaving(true);
      const response = await fetch('/api/faculty/change-password', {
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
    if (!preferences) return;

    try {
      setSaving(true);
      const response = await fetch('/api/faculty/preferences', {
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

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Faculty Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Settings className="w-4 h-4 mr-2" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="teaching">
            <GraduationCap className="w-4 h-4 mr-2" />
            Teaching
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileForm.firstName}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, firstName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileForm.lastName}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, lastName: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, email: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={profileForm.phoneNumber}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, phoneNumber: e.target.value })
                  }
                />
              </div>
              {profile && (
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Employee ID:</span> {profile.employeeId || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Department:</span>{' '}
                    {profile.department?.name || 'N/A'}
                  </div>
                </div>
              )}
              <Button onClick={handleSaveProfile} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
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
              <div>
                <Label htmlFor="newPassword">New Password</Label>
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
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
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
              </div>
              <Button onClick={handleChangePassword} disabled={saving}>
                <Lock className="w-4 h-4 mr-2" />
                {saving ? 'Changing...' : 'Change Password'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          {preferences && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Configure how you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
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
                      <Label>Assessment Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Get reminders for upcoming assessments
                      </p>
                    </div>
                    <Switch
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
                      <Label>Grade Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify when grades are calculated
                      </p>
                    </div>
                    <Switch
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
                      <Label>System Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive system update notifications
                      </p>
                    </div>
                    <Switch
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Display Preferences</CardTitle>
                  <CardDescription>
                    Customize how information is displayed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Grade Display Format</Label>
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
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage Only</SelectItem>
                        <SelectItem value="letter">Letter Grade Only</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Date Format</Label>
                    <Input
                      value={preferences.displayPreferences.dateFormat}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          displayPreferences: {
                            ...preferences.displayPreferences,
                            dateFormat: e.target.value,
                          },
                        })
                      }
                      placeholder="MM/DD/YYYY"
                    />
                  </div>
                  <div>
                    <Label>Default View</Label>
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
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dashboard">Dashboard</SelectItem>
                        <SelectItem value="courses">Courses</SelectItem>
                        <SelectItem value="assessments">Assessments</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Button onClick={handleSavePreferences} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </>
          )}
        </TabsContent>

        {/* Teaching Preferences Tab */}
        <TabsContent value="teaching" className="space-y-6">
          {preferences && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Teaching Preferences</CardTitle>
                  <CardDescription>
                    Configure default settings for assessments and grading
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Default Assessment Type</Label>
                    <Select
                      value={preferences.teachingPreferences.defaultAssessmentType}
                      onValueChange={(value) =>
                        setPreferences({
                          ...preferences,
                          teachingPreferences: {
                            ...preferences.teachingPreferences,
                            defaultAssessmentType: value,
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="assignment">Assignment</SelectItem>
                        <SelectItem value="midterm">Midterm</SelectItem>
                        <SelectItem value="final">Final</SelectItem>
                        <SelectItem value="project">Project</SelectItem>
                        <SelectItem value="lab">Lab</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Default Weightage (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={preferences.teachingPreferences.defaultWeightage}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          teachingPreferences: {
                            ...preferences.teachingPreferences,
                            defaultWeightage: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>CLO Calculation Threshold (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={preferences.teachingPreferences.cloCalculationThreshold}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          teachingPreferences: {
                            ...preferences.teachingPreferences,
                            cloCalculationThreshold: parseInt(e.target.value) || 60,
                          },
                        })
                      }
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Minimum percentage required for CLO attainment
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto Calculate Grades</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically calculate grades after marks entry
                      </p>
                    </div>
                    <Switch
                      checked={preferences.teachingPreferences.autoCalculateGrades}
                      onCheckedChange={(checked) =>
                        setPreferences({
                          ...preferences,
                          teachingPreferences: {
                            ...preferences.teachingPreferences,
                            autoCalculateGrades: checked,
                          },
                        })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Button onClick={handleSavePreferences} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Teaching Preferences'}
              </Button>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
