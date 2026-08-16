'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
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
import { toast } from 'sonner';
import { PageLoading } from '@/components/ui/page-loading';
import { Save, User, Lock, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProfileData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
}

export default function SuperAdminProfilePage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  
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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchProfile();
    }
  }, [mounted]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/super-admin/profile', {
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

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/super-admin/profile', {
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

      setSaving(true);
      const response = await fetch('/api/super-admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(passwordForm),
      });

      if (!response.ok) throw new Error('Failed to change password');
      const result = await response.json();
      if (result.success) {
        toast.success('Password changed. Please sign in again.');
        // The server cleared the auth cookie, so this session is over
        window.location.href = '/login';
        return;
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

  const primaryColor = 'var(--accent)';
  const primaryColorDark = 'var(--accent-hover)';

  if (!mounted || loading) {
    return <PageLoading message="Loading profile..." fullScreen={false} />;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2.5 text-primary-text">
            <div
              className="p-2 rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${primaryColorDark})`,
              }}
            >
              <Shield className="h-5 w-5 text-white" />
            </div>
            My Profile
          </h1>
          <p className="text-xs mt-1.5 text-secondary-text">
            Manage your account information and security settings
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-card border-card-border">
          <TabsTrigger 
            value="profile" 
            className="data-[state=active]:bg-primary data-[state=active]:text-white text-primary-text"
          >
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger 
            value="password"
            className="data-[state=active]:bg-primary data-[state=active]:text-white text-primary-text"
          >
            <Lock className="w-4 h-4 mr-2" />
            Password
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-5">
          <Card className="rounded-xl shadow-sm border bg-card border-card-border">
            <CardHeader>
              <CardTitle className="text-primary-text">Personal Information</CardTitle>
              <CardDescription className="text-secondary-text">
                Update your personal information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-primary-text">First Name *</Label>
                  <Input
                    id="firstName"
                    value={profileForm.firstName}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, firstName: e.target.value })
                    }
                    className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-primary-text">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={profileForm.lastName}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, lastName: e.target.value })
                    }
                    className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-primary-text">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, email: e.target.value })
                  }
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-primary-text">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={profileForm.phoneNumber}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, phoneNumber: e.target.value })
                  }
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
              {profile && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-card-border">
                  <div>
                    <p className="text-xs text-muted-text mb-1">Status</p>
                    <Badge className={profile.status === 'active' ? 'bg-good/20 text-good dark:text-good border-good/30' : 'bg-surface-2/20 text-ink-2 dark:text-ink-muted border-firm/30'}>
                      {profile.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-text mb-1">Role</p>
                    <Badge className="bg-primary/20 text-primary dark:text-primary border-primary/30">
                      Super Admin
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-text mb-1">Account Created</p>
                    <p className="text-sm text-primary-text">
                      {new Date(profile.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-text mb-1">Last Login</p>
                    <p className="text-sm text-primary-text">
                      {profile.lastLogin 
                        ? new Date(profile.lastLogin).toLocaleString()
                        : 'Never'}
                    </p>
                  </div>
                </div>
              )}
              <Button 
                onClick={handleSaveProfile} 
                disabled={saving}
                className="text-white"
                style={{
                  backgroundColor: saving ? 'var(--text-muted)' : primaryColor,
                  color: 'var(--white)',
                  opacity: saving ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!saving) {
                    e.currentTarget.style.backgroundColor = primaryColorDark;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!saving) {
                    e.currentTarget.style.backgroundColor = primaryColor;
                  }
                }}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Password Tab */}
        <TabsContent value="password" className="space-y-5">
          <Card className="rounded-xl shadow-sm border bg-card border-card-border">
            <CardHeader>
              <CardTitle className="text-primary-text">Change Password</CardTitle>
              <CardDescription className="text-secondary-text">
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-primary-text">Current Password *</Label>
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
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-primary-text">New Password *</Label>
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
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
                <p className="text-xs text-muted-text">Must be at least 6 characters</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-primary-text">Confirm New Password *</Label>
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
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
              <Button 
                onClick={handleChangePassword} 
                disabled={saving}
                className="text-white"
                style={{
                  backgroundColor: saving ? 'var(--text-muted)' : primaryColor,
                  color: 'var(--white)',
                  opacity: saving ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!saving) {
                    e.currentTarget.style.backgroundColor = primaryColorDark;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!saving) {
                    e.currentTarget.style.backgroundColor = primaryColor;
                  }
                }}
              >
                <Lock className="w-4 h-4 mr-2" />
                {saving ? 'Changing...' : 'Change Password'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

