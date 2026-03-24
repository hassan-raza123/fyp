'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
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
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = mounted && resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';

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
    setMounted(true);
  }, []);
  useEffect(() => {
    if (!mounted) return;
    fetchProfile();
    fetchPreferences();
  }, [mounted]);

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

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] bg-page">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderTopColor: primaryColor, borderRightColor: 'transparent', borderBottomColor: primaryColor, borderLeftColor: 'transparent' }}
          />
          <p className="text-xs text-secondary-text">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: iconBgColor }}
        >
          <Settings className="h-5 w-5" style={{ color: primaryColor }} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-primary-text">Faculty Settings</h1>
          <p className="text-xs text-secondary-text mt-0.5">Manage your account settings and preferences</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="inline-flex h-10 w-full max-w-md items-center justify-start gap-0 rounded-lg border border-card-border bg-card p-1 text-[var(--text-secondary)]">
          <TabsTrigger value="profile" className="flex-1 text-xs rounded-md data-[state=active]:bg-[var(--hover-bg)] data-[state=active]:text-[var(--text-primary)]">
            <User className="w-3.5 h-3.5 mr-2 shrink-0" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex-1 text-xs rounded-md data-[state=active]:bg-[var(--hover-bg)] data-[state=active]:text-[var(--text-primary)]">
            <Settings className="w-3.5 h-3.5 mr-2 shrink-0" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="teaching" className="flex-1 text-xs rounded-md data-[state=active]:bg-[var(--hover-bg)] data-[state=active]:text-[var(--text-primary)]">
            <GraduationCap className="w-3.5 h-3.5 mr-2 shrink-0" />
            Teaching
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <div className="rounded-lg border border-card-border bg-card overflow-hidden">
            <div className="p-4 border-b border-card-border">
              <h2 className="text-sm font-semibold text-primary-text">Personal Information</h2>
              <p className="text-xs text-secondary-text mt-0.5">Update your personal information and contact details</p>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-xs text-secondary-text">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    className="h-8 text-xs mt-1 bg-card border-card-border text-primary-text"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-xs text-secondary-text">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    className="h-8 text-xs mt-1 bg-card border-card-border text-primary-text"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email" className="text-xs text-secondary-text">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="h-8 text-xs mt-1 bg-card border-card-border text-primary-text"
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber" className="text-xs text-secondary-text">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={profileForm.phoneNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                  className="h-8 text-xs mt-1 bg-card border-card-border text-primary-text"
                />
              </div>
              {profile && (
                <div className="grid grid-cols-2 gap-4 text-xs text-secondary-text">
                  <div><span className="font-medium text-primary-text">Employee ID:</span> {profile.employeeId || 'N/A'}</div>
                  <div><span className="font-medium text-primary-text">Department:</span> {profile.department?.name || 'N/A'}</div>
                </div>
              )}
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 inline-flex items-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: primaryColor, color: '#fff' }}
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-card-border bg-card overflow-hidden">
            <div className="p-4 border-b border-card-border">
              <h2 className="text-sm font-semibold text-primary-text">Change Password</h2>
              <p className="text-xs text-secondary-text mt-0.5">Update your password to keep your account secure</p>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <Label htmlFor="currentPassword" className="text-xs text-secondary-text">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="h-8 text-xs mt-1 bg-card border-card-border text-primary-text"
                />
              </div>
              <div>
                <Label htmlFor="newPassword" className="text-xs text-secondary-text">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="h-8 text-xs mt-1 bg-card border-card-border text-primary-text"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword" className="text-xs text-secondary-text">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="h-8 text-xs mt-1 bg-card border-card-border text-primary-text"
                />
              </div>
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 inline-flex items-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: primaryColor, color: '#fff' }}
              >
                <Lock className="w-3.5 h-3.5" />
                {saving ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          {preferences && (
            <>
              <div className="rounded-lg border border-card-border bg-card overflow-hidden">
                <div className="p-4 border-b border-card-border">
                  <h2 className="text-sm font-semibold text-primary-text">Notification Preferences</h2>
                  <p className="text-xs text-secondary-text mt-0.5">Configure how you receive notifications</p>
                </div>
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-xs text-primary-text">Email Notifications</Label>
                      <p className="text-xs text-secondary-text">Receive notifications via email</p>
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
                      <Label className="text-xs text-primary-text">Assessment Reminders</Label>
                      <p className="text-xs text-secondary-text">Get reminders for upcoming assessments</p>
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
                      <Label className="text-xs text-primary-text">Grade Notifications</Label>
                      <p className="text-xs text-secondary-text">Notify when grades are calculated</p>
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
                      <Label className="text-xs text-primary-text">System Updates</Label>
                      <p className="text-xs text-secondary-text">Receive system update notifications</p>
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
                </div>
              </div>

              <div className="rounded-lg border border-card-border bg-card overflow-hidden">
                <div className="p-4 border-b border-card-border">
                  <h2 className="text-sm font-semibold text-primary-text">Display Preferences</h2>
                  <p className="text-xs text-secondary-text mt-0.5">Customize how information is displayed</p>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <Label className="text-xs text-secondary-text">Grade Display Format</Label>
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
                      <SelectTrigger className="h-8 text-xs mt-1 bg-card border-card-border text-primary-text">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-card-border">
                        <SelectItem value="percentage" className="text-primary-text hover:bg-card/50">Percentage Only</SelectItem>
                        <SelectItem value="letter" className="text-primary-text hover:bg-card/50">Letter Grade Only</SelectItem>
                        <SelectItem value="both" className="text-primary-text hover:bg-card/50">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-secondary-text">Date Format</Label>
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
                      className="h-8 text-xs mt-1 bg-card border-card-border text-primary-text placeholder:text-secondary-text"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-secondary-text">Default View</Label>
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
                      <SelectTrigger className="h-8 text-xs mt-1 bg-card border-card-border text-primary-text">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-card-border">
                        <SelectItem value="dashboard" className="text-primary-text hover:bg-card/50">Dashboard</SelectItem>
                        <SelectItem value="courses" className="text-primary-text hover:bg-card/50">Courses</SelectItem>
                        <SelectItem value="assessments" className="text-primary-text hover:bg-card/50">Assessments</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSavePreferences}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 inline-flex items-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: primaryColor, color: '#fff' }}
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </>
          )}
        </TabsContent>

        <TabsContent value="teaching" className="space-y-4">
          {preferences && (
            <>
              <div className="rounded-lg border border-card-border bg-card overflow-hidden">
                <div className="p-4 border-b border-card-border">
                  <h2 className="text-sm font-semibold text-primary-text">Teaching Preferences</h2>
                  <p className="text-xs text-secondary-text mt-0.5">Configure default settings for assessments and grading</p>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <Label className="text-xs text-secondary-text">Default Assessment Type</Label>
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
                      <SelectTrigger className="h-8 text-xs mt-1 bg-card border-card-border text-primary-text">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-card-border">
                        <SelectItem value="quiz" className="text-primary-text hover:bg-card/50">Quiz</SelectItem>
                        <SelectItem value="assignment" className="text-primary-text hover:bg-card/50">Assignment</SelectItem>
                        <SelectItem value="midterm" className="text-primary-text hover:bg-card/50">Midterm</SelectItem>
                        <SelectItem value="final" className="text-primary-text hover:bg-card/50">Final</SelectItem>
                        <SelectItem value="project" className="text-primary-text hover:bg-card/50">Project</SelectItem>
                        <SelectItem value="lab" className="text-primary-text hover:bg-card/50">Lab</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-secondary-text">Default Weightage (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
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
                      className="h-8 text-xs mt-1 bg-card border-card-border text-primary-text"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-secondary-text">CLO Calculation Threshold (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
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
                      className="h-8 text-xs mt-1 bg-card border-card-border text-primary-text"
                    />
                    <p className="text-xs text-secondary-text mt-1">Minimum percentage required for CLO attainment</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-xs text-primary-text">Auto Calculate Grades</Label>
                      <p className="text-xs text-secondary-text">Automatically calculate grades after marks entry</p>
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
                </div>
              </div>

              <button
                type="button"
                onClick={handleSavePreferences}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 inline-flex items-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: primaryColor, color: '#fff' }}
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving...' : 'Save Teaching Preferences'}
              </button>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
