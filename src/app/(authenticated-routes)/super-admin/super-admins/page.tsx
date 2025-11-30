'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Eye, Edit, Trash2, Shield, Key } from 'lucide-react';
import { toast } from 'sonner';
import { getDefaultPassword } from '@/lib/password-utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface SuperAdmin {
  userId: number;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    status: string;
    phone_number: string | null;
    createdAt: Date;
    last_login: Date | null;
  };
  role: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  isDarkMode?: boolean;
}

const StatCard = ({ title, value, icon, subtitle, isDarkMode = false }: StatCardProps) => {
  const iconBgColor = isDarkMode 
    ? 'rgba(252, 153, 40, 0.15)' 
    : 'rgba(38, 40, 149, 0.15)';
  const iconColor = isDarkMode 
    ? 'var(--orange)' 
    : 'var(--blue)';
  
  return (
    <div className="rounded-xl p-4 shadow-sm border bg-card border-card-border transition-all duration-200 hover:shadow-md hover:border-primary/20 dark:hover:border-secondary/20 group">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-secondary-text mb-1.5">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-primary-text mb-1">
            {value}
          </h3>
          {subtitle && (
            <p className="text-[10px] text-muted-text">
              {subtitle}
            </p>
          )}
        </div>
        <div 
          className="p-2.5 rounded-lg transition-transform duration-200 group-hover:scale-110"
          style={{ backgroundColor: iconBgColor }}
        >
          <div style={{ color: iconColor }}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function SuperAdminsPage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  
  const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [selectedSuperAdmin, setSelectedSuperAdmin] = useState<SuperAdmin | null>(null);
  const [viewingAdmin, setViewingAdmin] = useState<any>(null);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  
  const [newSuperAdmin, setNewSuperAdmin] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
  });

  const [editSuperAdmin, setEditSuperAdmin] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchSuperAdmins();
    }
  }, [mounted, search]);

  const fetchSuperAdmins = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/super-admin/super-admins', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch super admins');

      const data = await response.json();
      if (data.success) {
        let superAdminsData = data.data || [];

        // Client-side filtering
        if (search) {
          const searchLower = search.toLowerCase();
          superAdminsData = superAdminsData.filter(
            (sa: SuperAdmin) =>
              `${sa.user.first_name} ${sa.user.last_name}`
                .toLowerCase()
                .includes(searchLower) ||
              sa.user.email.toLowerCase().includes(searchLower)
          );
        }

        setSuperAdmins(superAdminsData);
      } else {
        throw new Error(data.error || 'Failed to fetch super admins');
      }
    } catch (error) {
      console.error('Error fetching super admins:', error);
      toast.error('Failed to load super admins');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuperAdmin = async () => {
    if (!newSuperAdmin.email || !newSuperAdmin.first_name || !newSuperAdmin.last_name) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/super-admin/create-super-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: newSuperAdmin.email.trim(),
          first_name: newSuperAdmin.first_name.trim(),
          last_name: newSuperAdmin.last_name.trim(),
          phone_number: newSuperAdmin.phone_number.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Super admin created successfully!');
        setShowCreateModal(false);
        setNewSuperAdmin({
          email: '',
          first_name: '',
          last_name: '',
          phone_number: '',
        });
        fetchSuperAdmins();
      } else {
        throw new Error(data.error || 'Failed to create super admin');
      }
    } catch (error) {
      console.error('Error creating super admin:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create super admin'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleViewAdmin = async (superAdmin: SuperAdmin) => {
    setIsLoadingAdmin(true);
    setViewingAdmin(null);
    setShowViewModal(true);
    try {
      const response = await fetch(`/api/users/${superAdmin.userId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch super admin details');
      const data = await response.json();
      setViewingAdmin(data);
    } catch (error) {
      console.error('Error fetching super admin:', error);
      toast.error('Failed to load super admin details');
      setShowViewModal(false);
    } finally {
      setIsLoadingAdmin(false);
    }
  };

  const handleEditAdmin = async (superAdmin: SuperAdmin) => {
    setIsLoadingAdmin(true);
    setSelectedSuperAdmin(superAdmin);
    setShowEditModal(true);
    try {
      const response = await fetch(`/api/users/${superAdmin.userId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch super admin details');
      const data = await response.json();
      setEditSuperAdmin({
        email: data.email || '',
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone_number: data.phone_number || '',
        status: (data.status || 'active') as 'active' | 'inactive',
      });
    } catch (error) {
      console.error('Error fetching super admin:', error);
      toast.error('Failed to load super admin details');
      setShowEditModal(false);
    } finally {
      setIsLoadingAdmin(false);
    }
  };

  const handleUpdateAdmin = async () => {
    if (!selectedSuperAdmin) return;

    if (!editSuperAdmin.email || !editSuperAdmin.first_name || !editSuperAdmin.last_name) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/users/${selectedSuperAdmin.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: editSuperAdmin.email.trim(),
          first_name: editSuperAdmin.first_name.trim(),
          last_name: editSuperAdmin.last_name.trim(),
          phone_number: editSuperAdmin.phone_number.trim() || null,
          status: editSuperAdmin.status,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update super admin');
      }

      toast.success('Super admin updated successfully');
      setShowEditModal(false);
      setSelectedSuperAdmin(null);
      fetchSuperAdmins();
    } catch (error) {
      console.error('Error updating super admin:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update super admin'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSuperAdmin) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/users/${selectedSuperAdmin.userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete super admin');
      }

      toast.success('Super admin deleted successfully');
      setShowDeleteDialog(false);
      setSelectedSuperAdmin(null);
      fetchSuperAdmins();
    } catch (error) {
      console.error('Error deleting super admin:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete super admin'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedSuperAdmin) return;

    setIsResettingPassword(true);
    try {
      const response = await fetch('/api/super-admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: selectedSuperAdmin.userId,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to reset password');
      }

      const resetPassword = data.data?.defaultPassword || getDefaultPassword('super_admin');
      toast.success(`Password reset successfully! Default password: ${resetPassword}`);
      setShowResetPasswordDialog(false);
      setSelectedSuperAdmin(null);
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to reset password'
      );
    } finally {
      setIsResettingPassword(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'active') {
      return (
        <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30">
          Active
        </Badge>
      );
    } else if (statusLower === 'inactive') {
      return (
        <Badge className="bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30">
          Inactive
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30">
        {status}
      </Badge>
    );
  };

  // Calculate stats
  const stats = {
    total: superAdmins.length,
    active: superAdmins.filter(sa => sa.user.status.toLowerCase() === 'active').length,
    inactive: superAdmins.filter(sa => sa.user.status.toLowerCase() === 'inactive').length,
  };

  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const primaryColorDark = isDarkMode ? 'var(--orange-dark)' : 'var(--blue-dark)';

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-3">
          <div 
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: primaryColor }}
          />
          <p className="text-sm text-secondary-text">
            Loading super admins...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5 text-primary-text">
            <div 
              className="p-2 rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${primaryColorDark})`,
              }}
            >
              <Shield className="h-5 w-5 text-white" />
            </div>
            Super Admins
          </h1>
          <p className="text-xs mt-1.5 text-secondary-text">
            Manage super administrator accounts
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="text-xs h-8 px-3 text-white"
          style={{
            backgroundColor: primaryColor,
            color: 'white',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = primaryColorDark;
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = primaryColor;
            e.currentTarget.style.color = 'white';
          }}
        >
          <Plus className="h-3 w-3 mr-1.5" />
          Create Super Admin
        </Button>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          title="Total Super Admins"
          value={stats.total}
          subtitle={`${stats.active} active`}
          icon={<Shield className="w-5 h-5" />}
          isDarkMode={isDarkMode}
        />
        <StatCard
          title="Active"
          value={stats.active}
          subtitle={`${stats.inactive} inactive`}
          icon={<Shield className="w-5 h-5" />}
          isDarkMode={isDarkMode}
        />
        <StatCard
          title="Inactive"
          value={stats.inactive}
          subtitle="Need activation"
          icon={<Shield className="w-5 h-5" />}
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Super Admins Table */}
      <Card className="rounded-xl shadow-sm border bg-card border-card-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-primary-text">Super Admin Users</CardTitle>
              <CardDescription className="text-secondary-text">
                View and manage all super administrator accounts
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-text`} />
              <Input
                placeholder="Search super admins..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-card-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-card hover:bg-card border-card-border">
                  <TableHead className="text-secondary-text">Name</TableHead>
                  <TableHead className="text-secondary-text">Email</TableHead>
                  <TableHead className="text-secondary-text">Phone</TableHead>
                  <TableHead className="text-secondary-text">Status</TableHead>
                  <TableHead className="text-secondary-text">Created</TableHead>
                  <TableHead className="text-right text-secondary-text">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {superAdmins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-secondary-text">
                      <div className="flex flex-col items-center gap-2">
                        <Shield className="h-8 w-8 text-muted-text" />
                        <p>No super admin users found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  superAdmins.map((superAdmin) => (
                    <TableRow 
                      key={superAdmin.userId}
                      className="border-card-border hover:bg-card/50"
                    >
                      <TableCell className="text-primary-text">
                        {superAdmin.user.first_name} {superAdmin.user.last_name}
                      </TableCell>
                      <TableCell className="text-primary-text">{superAdmin.user.email}</TableCell>
                      <TableCell className="text-primary-text">
                        {superAdmin.user.phone_number || <span className="text-muted-text italic">N/A</span>}
                      </TableCell>
                      <TableCell>{getStatusBadge(superAdmin.user.status)}</TableCell>
                      <TableCell className="text-primary-text">
                        {new Date(superAdmin.user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewAdmin(superAdmin)}
                            className="border-card-border transition-all hover:scale-105 text-xs px-3 h-8 bg-transparent"
                            style={{
                              color: isDarkMode ? '#ffffff' : '#111827',
                              borderColor: isDarkMode ? '#404040' : '#e5e7eb',
                              backgroundColor: 'transparent',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';
                              e.currentTarget.style.borderColor = primaryColor;
                              e.currentTarget.style.color = primaryColor;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.borderColor = isDarkMode ? '#404040' : '#e5e7eb';
                              e.currentTarget.style.color = isDarkMode ? '#ffffff' : '#111827';
                            }}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1.5" style={{ color: 'inherit' }} />
                            <span style={{ color: 'inherit' }}>View</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditAdmin(superAdmin)}
                            className="border-card-border transition-all hover:scale-105 text-xs px-3 h-8 bg-transparent"
                            style={{
                              color: isDarkMode ? '#ffffff' : '#111827',
                              borderColor: isDarkMode ? '#404040' : '#e5e7eb',
                              backgroundColor: 'transparent',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';
                              e.currentTarget.style.borderColor = primaryColor;
                              e.currentTarget.style.color = primaryColor;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.borderColor = isDarkMode ? '#404040' : '#e5e7eb';
                              e.currentTarget.style.color = isDarkMode ? '#ffffff' : '#111827';
                            }}
                          >
                            <Edit className="h-3.5 w-3.5 mr-1.5" style={{ color: 'inherit' }} />
                            <span style={{ color: 'inherit' }}>Edit</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSuperAdmin(superAdmin);
                              setShowResetPasswordDialog(true);
                            }}
                            className="border-card-border transition-all hover:scale-105 text-xs px-3 h-8 bg-transparent"
                            style={{
                              color: isDarkMode ? '#ffffff' : '#111827',
                              borderColor: isDarkMode ? '#404040' : '#e5e7eb',
                              backgroundColor: 'transparent',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';
                              e.currentTarget.style.borderColor = primaryColor;
                              e.currentTarget.style.color = primaryColor;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.borderColor = isDarkMode ? '#404040' : '#e5e7eb';
                              e.currentTarget.style.color = isDarkMode ? '#ffffff' : '#111827';
                            }}
                          >
                            <Key className="h-3.5 w-3.5 mr-1.5" style={{ color: 'inherit' }} />
                            <span style={{ color: 'inherit' }}>Reset Password</span>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedSuperAdmin(superAdmin);
                              setShowDeleteDialog(true);
                            }}
                            className="transition-all hover:scale-105 text-xs px-3 h-8 text-white"
                            style={{
                              backgroundColor: '#dc2626',
                              color: '#ffffff',
                              borderColor: '#dc2626',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#b91c1c';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#dc2626';
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" style={{ color: '#ffffff' }} />
                            <span style={{ color: '#ffffff' }}>Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Super Admin Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-primary-text">Create New Super Admin</DialogTitle>
            <DialogDescription className="text-secondary-text">
              Create a new super administrator account. Super admins have full system access.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="super_admin_first_name" className="text-primary-text">First Name *</Label>
                <Input
                  id="super_admin_first_name"
                  placeholder="John"
                  value={newSuperAdmin.first_name}
                  onChange={(e) =>
                    setNewSuperAdmin({ ...newSuperAdmin, first_name: e.target.value })
                  }
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="super_admin_last_name" className="text-primary-text">Last Name *</Label>
                <Input
                  id="super_admin_last_name"
                  placeholder="Doe"
                  value={newSuperAdmin.last_name}
                  onChange={(e) =>
                    setNewSuperAdmin({ ...newSuperAdmin, last_name: e.target.value })
                  }
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="super_admin_email" className="text-primary-text">Email *</Label>
              <Input
                id="super_admin_email"
                type="email"
                placeholder="john.doe@example.com"
                value={newSuperAdmin.email}
                onChange={(e) =>
                  setNewSuperAdmin({ ...newSuperAdmin, email: e.target.value })
                }
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="super_admin_phone_number" className="text-primary-text">Phone Number</Label>
              <Input
                id="super_admin_phone_number"
                placeholder="+1234567890"
                value={newSuperAdmin.phone_number}
                onChange={(e) =>
                  setNewSuperAdmin({ ...newSuperAdmin, phone_number: e.target.value })
                }
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
              />
            </div>
            <div className="rounded-lg p-4 bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-blue-600 dark:text-blue-400">
                <strong>Note:</strong> The default password will be <code className="bg-blue-500/20 px-1 rounded">{getDefaultPassword('super_admin')}</code>. 
                The user will receive an email with login credentials.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setNewSuperAdmin({
                  email: '',
                  first_name: '',
                  last_name: '',
                  phone_number: '',
                });
              }}
              className="border-card-border transition-all bg-transparent"
              style={{
                color: isDarkMode ? '#ffffff' : '#111827',
                borderColor: isDarkMode ? '#404040' : '#e5e7eb',
                backgroundColor: 'transparent',
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSuperAdmin}
              disabled={isCreating}
              className="text-white"
              style={{
                backgroundColor: isCreating ? (isDarkMode ? '#9a3412' : '#1e40af') : primaryColor,
                color: '#ffffff',
              }}
              onMouseEnter={(e) => {
                if (!isCreating) {
                  e.currentTarget.style.backgroundColor = primaryColorDark;
                }
              }}
              onMouseLeave={(e) => {
                if (!isCreating) {
                  e.currentTarget.style.backgroundColor = primaryColor;
                }
              }}
            >
              {isCreating ? 'Creating...' : 'Create Super Admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Super Admin Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-primary-text">Super Admin Details</DialogTitle>
            <DialogDescription className="text-secondary-text">
              View complete information about this super administrator
            </DialogDescription>
          </DialogHeader>
          {isLoadingAdmin ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-3">
                <div 
                  className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: primaryColor }}
                />
                <p className="text-sm text-secondary-text">Loading...</p>
              </div>
            </div>
          ) : viewingAdmin ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-secondary-text mb-3">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-text mb-1">First Name</p>
                    <p className="text-sm text-primary-text">{viewingAdmin.first_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-text mb-1">Last Name</p>
                    <p className="text-sm text-primary-text">{viewingAdmin.last_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-text mb-1">Email</p>
                    <p className="text-sm text-primary-text">{viewingAdmin.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-text mb-1">Phone Number</p>
                    <p className="text-sm text-primary-text">{viewingAdmin.phone_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-text mb-1">Status</p>
                    <div className="mt-1">{getStatusBadge(viewingAdmin.status)}</div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-text mb-1">Role</p>
                    <p className="text-sm text-primary-text">Super Admin</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-text mb-1">Created At</p>
                    <p className="text-sm text-primary-text">
                      {viewingAdmin.createdAt ? new Date(viewingAdmin.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-text mb-1">Last Login</p>
                    <p className="text-sm text-primary-text">
                      {viewingAdmin.last_login ? new Date(viewingAdmin.last_login).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-secondary-text">
              <p>No data available</p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowViewModal(false);
                setViewingAdmin(null);
              }}
              className="border-card-border transition-all bg-transparent"
              style={{
                color: isDarkMode ? '#ffffff' : '#111827',
                borderColor: isDarkMode ? '#404040' : '#e5e7eb',
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Super Admin Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-primary-text">Edit Super Admin</DialogTitle>
            <DialogDescription className="text-secondary-text">
              Update super administrator information
            </DialogDescription>
          </DialogHeader>
          {isLoadingAdmin ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-3">
                <div 
                  className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: primaryColor }}
                />
                <p className="text-sm text-secondary-text">Loading...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_first_name" className="text-primary-text">First Name *</Label>
                  <Input
                    id="edit_first_name"
                    placeholder="John"
                    value={editSuperAdmin.first_name}
                    onChange={(e) =>
                      setEditSuperAdmin({ ...editSuperAdmin, first_name: e.target.value })
                    }
                    className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_last_name" className="text-primary-text">Last Name *</Label>
                  <Input
                    id="edit_last_name"
                    placeholder="Doe"
                    value={editSuperAdmin.last_name}
                    onChange={(e) =>
                      setEditSuperAdmin({ ...editSuperAdmin, last_name: e.target.value })
                    }
                    className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_email" className="text-primary-text">Email *</Label>
                <Input
                  id="edit_email"
                  type="email"
                  placeholder="john.doe@example.com"
                  value={editSuperAdmin.email}
                  onChange={(e) =>
                    setEditSuperAdmin({ ...editSuperAdmin, email: e.target.value })
                  }
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_phone_number" className="text-primary-text">Phone Number</Label>
                <Input
                  id="edit_phone_number"
                  placeholder="+1234567890"
                  value={editSuperAdmin.phone_number}
                  onChange={(e) =>
                    setEditSuperAdmin({ ...editSuperAdmin, phone_number: e.target.value })
                  }
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_status" className="text-primary-text">Status</Label>
                <Select
                  value={editSuperAdmin.status}
                  onValueChange={(value: 'active' | 'inactive') =>
                    setEditSuperAdmin({ ...editSuperAdmin, status: value })
                  }
                >
                  <SelectTrigger className="bg-card border-card-border text-primary-text">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-card-border">
                    <SelectItem value="active" className="text-primary-text hover:bg-card/50">Active</SelectItem>
                    <SelectItem value="inactive" className="text-primary-text hover:bg-card/50">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setSelectedSuperAdmin(null);
              }}
              disabled={isUpdating}
              className="border-card-border transition-all bg-transparent"
              style={{
                color: isUpdating ? (isDarkMode ? '#6b7280' : '#9ca3af') : (isDarkMode ? '#ffffff' : '#111827'),
                borderColor: isDarkMode ? '#404040' : '#e5e7eb',
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateAdmin}
              disabled={isUpdating}
              className="text-white"
              style={{
                backgroundColor: isUpdating ? '#9ca3af' : primaryColor,
                color: '#ffffff',
                opacity: isUpdating ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isUpdating) {
                  e.currentTarget.style.backgroundColor = primaryColorDark;
                }
              }}
              onMouseLeave={(e) => {
                if (!isUpdating) {
                  e.currentTarget.style.backgroundColor = primaryColor;
                }
              }}
            >
              {isUpdating ? 'Updating...' : 'Update Super Admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <DialogContent className="bg-card border-card-border">
          <DialogHeader>
            <DialogTitle className="text-primary-text">Reset Password</DialogTitle>
            <DialogDescription className="text-secondary-text">
              Are you sure you want to reset the password for{' '}
              <span className="font-semibold text-primary-text">
                {selectedSuperAdmin
                  ? `${selectedSuperAdmin.user.first_name} ${selectedSuperAdmin.user.last_name}`
                  : 'this super admin'}
              </span>
              ? The password will be reset to the role-based default password (<code className="bg-card/50 px-1 rounded">{getDefaultPassword('super_admin')}</code> for super admins) and an email will be sent to the user.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowResetPasswordDialog(false);
                setSelectedSuperAdmin(null);
              }}
              disabled={isResettingPassword}
              className="border-card-border transition-all bg-transparent"
              style={{
                color: isResettingPassword ? (isDarkMode ? '#6b7280' : '#9ca3af') : (isDarkMode ? '#ffffff' : '#111827'),
                borderColor: isDarkMode ? '#404040' : '#e5e7eb',
                backgroundColor: 'transparent',
                opacity: isResettingPassword ? 0.5 : 1,
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={isResettingPassword}
              className="text-white"
              style={{
                backgroundColor: isResettingPassword ? '#9ca3af' : primaryColor,
                color: '#ffffff',
                opacity: isResettingPassword ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isResettingPassword) {
                  e.currentTarget.style.backgroundColor = primaryColorDark;
                }
              }}
              onMouseLeave={(e) => {
                if (!isResettingPassword) {
                  e.currentTarget.style.backgroundColor = primaryColor;
                }
              }}
            >
              {isResettingPassword ? 'Resetting...' : 'Reset Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Super Admin Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-card border-card-border">
          <DialogHeader>
            <DialogTitle className="text-primary-text">Delete Super Admin</DialogTitle>
            <DialogDescription className="text-secondary-text">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-primary-text">
                {selectedSuperAdmin
                  ? `${selectedSuperAdmin.user.first_name} ${selectedSuperAdmin.user.last_name}`
                  : 'this super admin'}
              </span>
              ? This action cannot be undone and will remove their super admin privileges.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setSelectedSuperAdmin(null);
              }}
              disabled={isDeleting}
              className="border-card-border transition-all bg-transparent"
              style={{
                color: isDeleting ? (isDarkMode ? '#6b7280' : '#9ca3af') : (isDarkMode ? '#ffffff' : '#111827'),
                borderColor: isDarkMode ? '#404040' : '#e5e7eb',
                backgroundColor: 'transparent',
                opacity: isDeleting ? 0.5 : 1,
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-white"
              style={{
                backgroundColor: isDeleting ? '#9ca3af' : '#dc2626',
                color: '#ffffff',
                borderColor: isDeleting ? '#9ca3af' : '#dc2626',
                opacity: isDeleting ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isDeleting) {
                  e.currentTarget.style.backgroundColor = '#b91c1c';
                }
              }}
              onMouseLeave={(e) => {
                if (!isDeleting) {
                  e.currentTarget.style.backgroundColor = '#dc2626';
                }
              }}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

