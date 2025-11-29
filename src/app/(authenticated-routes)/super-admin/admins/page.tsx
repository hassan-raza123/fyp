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
import { Plus, Search, Eye, Edit, Trash2, Shield, Users, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
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
import { Textarea } from '@/components/ui/textarea';

interface Admin {
  id: number | null;
  userId: number;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    status: string;
  };
  employeeId?: string | null;
  designation: string;
  department: {
    id: number;
    name: string;
    code: string;
  } | null;
}

interface Department {
  id: number;
  name: string;
  code: string;
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

export default function SuperAdminAdminsPage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [viewingAdmin, setViewingAdmin] = useState<any>(null);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [editAdmin, setEditAdmin] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    designation: 'Department Admin',
    departmentId: '',
    status: 'active' as 'active' | 'inactive',
  });
  
  const [newAdmin, setNewAdmin] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    designation: 'Department Admin',
    departmentId: '',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
    fetchAdmins();
      fetchDepartments();
    }
  }, [mounted, search, statusFilter]);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDepartments(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admins', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch admins');

      const data = await response.json();
      if (data.success) {
        let adminsData = data.data || [];

        // Client-side filtering
        if (search) {
          const searchLower = search.toLowerCase();
          adminsData = adminsData.filter(
            (a: Admin) =>
              `${a.user.first_name} ${a.user.last_name}`
                .toLowerCase()
                .includes(searchLower) ||
              a.user.email.toLowerCase().includes(searchLower) ||
              (a.employeeId &&
                a.employeeId.toLowerCase().includes(searchLower))
          );
        }

        if (statusFilter !== 'all') {
          adminsData = adminsData.filter(
            (a: Admin) =>
              a.user.status.toLowerCase() === statusFilter.toLowerCase()
          );
        }

        setAdmins(adminsData);
      } else {
        throw new Error(data.error || 'Failed to fetch admins');
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error('Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (!newAdmin.email || !newAdmin.first_name || !newAdmin.last_name) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/super-admin/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: newAdmin.email.trim(),
          first_name: newAdmin.first_name.trim(),
          last_name: newAdmin.last_name.trim(),
          phone_number: newAdmin.phone_number.trim() || undefined,
          designation: newAdmin.designation.trim() || 'Department Admin',
          departmentId: newAdmin.departmentId ? parseInt(newAdmin.departmentId) : undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Admin created successfully!');
        setShowCreateModal(false);
        setNewAdmin({
          email: '',
          first_name: '',
          last_name: '',
          phone_number: '',
          designation: 'Department Admin',
          departmentId: '',
        });
        fetchAdmins();
      } else {
        throw new Error(data.error || 'Failed to create admin');
      }
    } catch (error) {
      console.error('Error creating admin:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create admin'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleViewAdmin = async (admin: Admin) => {
    setIsLoadingAdmin(true);
    setViewingAdmin(null);
    setShowViewModal(true);
    try {
      const response = await fetch(`/api/users/${admin.userId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch admin details');
      const data = await response.json();
      setViewingAdmin(data);
    } catch (error) {
      console.error('Error fetching admin:', error);
      toast.error('Failed to load admin details');
      setShowViewModal(false);
    } finally {
      setIsLoadingAdmin(false);
    }
  };

  const handleEditAdmin = async (admin: Admin) => {
    setIsLoadingAdmin(true);
    setSelectedAdmin(admin);
    setShowEditModal(true);
    try {
      const response = await fetch(`/api/users/${admin.userId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch admin details');
      const data = await response.json();
      setEditAdmin({
        email: data.email || '',
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone_number: data.phone_number || '',
        designation: data.faculty?.designation || 'Department Admin',
        departmentId: data.faculty?.department?.id?.toString() || '',
        status: (data.status || 'active') as 'active' | 'inactive',
      });
    } catch (error) {
      console.error('Error fetching admin:', error);
      toast.error('Failed to load admin details');
      setShowEditModal(false);
    } finally {
      setIsLoadingAdmin(false);
    }
  };

  const handleUpdateAdmin = async () => {
    if (!selectedAdmin) return;

    if (!editAdmin.email || !editAdmin.first_name || !editAdmin.last_name) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsUpdating(true);
    try {
      // Update user
      const userResponse = await fetch(`/api/users/${selectedAdmin.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: editAdmin.email.trim(),
          first_name: editAdmin.first_name.trim(),
          last_name: editAdmin.last_name.trim(),
          phone_number: editAdmin.phone_number.trim() || null,
          status: editAdmin.status,
        }),
      });

      if (!userResponse.ok) {
        const error = await userResponse.json();
        throw new Error(error.error || 'Failed to update user');
      }

      // Update faculty if exists
      const newDeptId = editAdmin.departmentId ? parseInt(editAdmin.departmentId) : null;
      
      if (selectedAdmin.id) {
        const facultyResponse = await fetch(`/api/faculty/${selectedAdmin.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            designation: editAdmin.designation.trim() || 'Department Admin',
            status: editAdmin.status === 'active' ? 'active' : 'inactive',
            departmentId: newDeptId || null,
          }),
        });

        if (!facultyResponse.ok) {
          console.warn('Failed to update faculty details');
        }
      } else if (newDeptId) {
        // Faculty record doesn't exist but we want to assign department
        // Use super-admin API to assign department (this will create faculty record)
        const assignResponse = await fetch('/api/super-admin/assign-admin-to-department', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ 
            userId: selectedAdmin.userId,
            departmentId: newDeptId 
          }),
        });
        if (!assignResponse.ok) {
          const error = await assignResponse.json();
          console.warn('Failed to assign department:', error);
        }
      }

      toast.success('Admin updated successfully');
      setShowEditModal(false);
      setSelectedAdmin(null);
      fetchAdmins();
    } catch (error) {
      console.error('Error updating admin:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update admin'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAdmin) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/users/${selectedAdmin.userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete admin');
      }

      toast.success('Admin deleted successfully');
      setShowDeleteDialog(false);
      setSelectedAdmin(null);
      fetchAdmins();
    } catch (error) {
      console.error('Error deleting admin:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete admin'
      );
    } finally {
      setIsDeleting(false);
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
    total: admins.length,
    active: admins.filter(a => a.user.status.toLowerCase() === 'active').length,
    inactive: admins.filter(a => a.user.status.toLowerCase() === 'inactive').length,
    withDepartment: admins.filter(a => a.department !== null).length,
    withoutDepartment: admins.filter(a => a.department === null).length,
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
            Loading admins...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header - Modern & Compact */}
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
            System Admins
          </h1>
          <p className="text-xs mt-1.5 text-secondary-text">
            View and manage all admin users across departments
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
          Create Admin
        </Button>
      </div>

      {/* Key Stats - Essential Only */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          title="Total Admins"
          value={stats.total}
          subtitle={`${stats.active} active`}
          icon={<Shield className="w-5 h-5" />}
          isDarkMode={isDarkMode}
        />
        <StatCard
          title="Active"
          value={stats.active}
          subtitle={`${stats.inactive} inactive`}
          icon={<UserCheck className="w-5 h-5" />}
          isDarkMode={isDarkMode}
        />
        <StatCard
          title="With Department"
          value={stats.withDepartment}
          subtitle={`${stats.withoutDepartment} unassigned`}
          icon={<Users className="w-5 h-5" />}
          isDarkMode={isDarkMode}
        />
        <StatCard
          title="Without Department"
          value={stats.withoutDepartment}
          subtitle="Need assignment"
          icon={<Users className="w-5 h-5" />}
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Admins Table */}
      <Card className="rounded-xl shadow-sm border bg-card border-card-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-primary-text">Admin Users</CardTitle>
              <CardDescription className="text-secondary-text">
                View and manage all admin users
              </CardDescription>
            </div>
            <div className="flex gap-3">
              <div className="relative w-64">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-text`} />
                <Input
                  placeholder="Search admins..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] bg-card border-card-border text-primary-text">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  <SelectItem value="all" className="text-primary-text hover:bg-card/50">All Status</SelectItem>
                  <SelectItem value="active" className="text-primary-text hover:bg-card/50">Active</SelectItem>
                  <SelectItem value="inactive" className="text-primary-text hover:bg-card/50">Inactive</SelectItem>
              </SelectContent>
            </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-card-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-card hover:bg-card border-card-border">
                  <TableHead className="text-secondary-text">Employee ID</TableHead>
                  <TableHead className="text-secondary-text">Name</TableHead>
                  <TableHead className="text-secondary-text">Email</TableHead>
                  <TableHead className="text-secondary-text">Designation</TableHead>
                  <TableHead className="text-secondary-text">Department</TableHead>
                  <TableHead className="text-secondary-text">Status</TableHead>
                  <TableHead className="text-right text-secondary-text">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-secondary-text">
                      <div className="flex flex-col items-center gap-2">
                        <Shield className="h-8 w-8 text-muted-text" />
                        <p>No admin users found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  admins.map((admin) => (
                    <TableRow 
                      key={admin.userId}
                      className="border-card-border hover:bg-card/50"
                    >
                      <TableCell className="text-primary-text">
                        {admin.id ? `EMP-${String(admin.id).padStart(4, '0')}` : <span className="text-muted-text italic">N/A</span>}
                      </TableCell>
                      <TableCell className="text-primary-text">
                        {admin.user.first_name} {admin.user.last_name}
                      </TableCell>
                      <TableCell className="text-primary-text">{admin.user.email}</TableCell>
                      <TableCell className="text-primary-text">{admin.designation || 'Department Admin'}</TableCell>
                      <TableCell className="text-primary-text">
                        {admin.department
                          ? `${admin.department.name} (${admin.department.code})`
                          : <span className="text-muted-text italic">N/A</span>}
                      </TableCell>
                      <TableCell>{getStatusBadge(admin.user.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewAdmin(admin)}
                            disabled={!admin.userId}
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
                            onClick={() => handleEditAdmin(admin)}
                            disabled={!admin.userId}
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
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedAdmin(admin);
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

      {/* Create Admin Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-primary-text">Create New Admin</DialogTitle>
            <DialogDescription className="text-secondary-text">
              Create a new admin user and optionally assign them to a department
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="text-primary-text">First Name *</Label>
                <Input
                  id="first_name"
                  placeholder="John"
                  value={newAdmin.first_name}
                  onChange={(e) =>
                    setNewAdmin({ ...newAdmin, first_name: e.target.value })
                  }
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name" className="text-primary-text">Last Name *</Label>
                <Input
                  id="last_name"
                  placeholder="Doe"
                  value={newAdmin.last_name}
                  onChange={(e) =>
                    setNewAdmin({ ...newAdmin, last_name: e.target.value })
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
                placeholder="john.doe@example.com"
                value={newAdmin.email}
                onChange={(e) =>
                  setNewAdmin({ ...newAdmin, email: e.target.value })
                }
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_number" className="text-primary-text">Phone Number</Label>
              <Input
                id="phone_number"
                placeholder="+1234567890"
                value={newAdmin.phone_number}
                onChange={(e) =>
                  setNewAdmin({ ...newAdmin, phone_number: e.target.value })
                }
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="designation" className="text-primary-text">Designation</Label>
              <Input
                id="designation"
                placeholder="Department Admin"
                value={newAdmin.designation}
                disabled
                className="bg-card/50 border-card-border text-primary-text placeholder:text-secondary-text cursor-not-allowed opacity-70"
              />
              <p className="text-xs text-muted-text">Fixed: Department Admin</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="departmentId" className="text-primary-text">Department (Optional)</Label>
              <Select
                value={newAdmin.departmentId || 'none'}
                onValueChange={(value) =>
                  setNewAdmin({ ...newAdmin, departmentId: value === 'none' ? '' : value })
                }
              >
                <SelectTrigger className="bg-card border-card-border text-primary-text">
                  <SelectValue placeholder="Select a department (optional)" />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  <SelectItem value="none" className="text-primary-text hover:bg-card/50">
                    No Department (Assign Later)
                  </SelectItem>
                  {departments.map((dept) => (
                    <SelectItem
                      key={dept.id}
                      value={dept.id.toString()}
                      className="text-primary-text hover:bg-card/50"
                    >
                      {dept.name} ({dept.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-text">
                You can assign a department now or later from the departments page
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setNewAdmin({
                  email: '',
                  first_name: '',
                  last_name: '',
                  phone_number: '',
                  designation: 'Department Admin',
                  departmentId: '',
                });
              }}
              className="border-card-border transition-all bg-transparent"
              style={{
                color: isDarkMode ? '#ffffff' : '#111827',
                borderColor: isDarkMode ? '#404040' : '#e5e7eb',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                e.currentTarget.style.color = isDarkMode ? '#ffffff' : '#111827';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = isDarkMode ? '#ffffff' : '#111827';
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateAdmin}
              disabled={isCreating}
              className="text-white"
              style={{
                backgroundColor: isCreating ? (isDarkMode ? '#9a3412' : '#1e40af') : primaryColor,
                color: '#ffffff',
                borderColor: isCreating ? (isDarkMode ? '#9a3412' : '#1e40af') : primaryColor,
              }}
              onMouseEnter={(e) => {
                if (!isCreating) {
                  e.currentTarget.style.backgroundColor = primaryColorDark;
                  e.currentTarget.style.color = '#ffffff';
                }
              }}
              onMouseLeave={(e) => {
                if (!isCreating) {
                  e.currentTarget.style.backgroundColor = primaryColor;
                  e.currentTarget.style.color = '#ffffff';
                }
              }}
            >
              {isCreating ? 'Creating...' : 'Create Admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Admin Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-primary-text">Admin Details</DialogTitle>
            <DialogDescription className="text-secondary-text">
              View complete information about this admin user
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
                </div>
              </div>
              {viewingAdmin.faculty && (
                <div>
                  <h3 className="text-sm font-semibold text-secondary-text mb-3">Admin Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-text mb-1">Employee ID</p>
                      <p className="text-sm text-primary-text">
                        {viewingAdmin.faculty.id ? `EMP-${String(viewingAdmin.faculty.id).padStart(4, '0')}` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-text mb-1">Designation</p>
                      <p className="text-sm text-primary-text">{viewingAdmin.faculty.designation || 'Department Admin'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-text mb-1">Department</p>
                      <p className="text-sm text-primary-text">
                        {viewingAdmin.faculty.department
                          ? `${viewingAdmin.faculty.department.name} (${viewingAdmin.faculty.department.code})`
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
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
            {viewingAdmin && (
              <Button
                onClick={() => {
                  const admin = admins.find(a => a.userId === viewingAdmin.id);
                  if (admin) {
                    setShowViewModal(false);
                    handleEditAdmin(admin);
                  }
                }}
                className="text-white"
                style={{
                  backgroundColor: primaryColor,
                  color: 'white',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = primaryColorDark;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = primaryColor;
                }}
              >
                <Edit className="h-3.5 w-3.5 mr-1.5" />
                Edit Admin
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Admin Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-primary-text">Edit Admin</DialogTitle>
            <DialogDescription className="text-secondary-text">
              Update admin user information and department assignment
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
                    value={editAdmin.first_name}
                    onChange={(e) =>
                      setEditAdmin({ ...editAdmin, first_name: e.target.value })
                    }
                    className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_last_name" className="text-primary-text">Last Name *</Label>
                  <Input
                    id="edit_last_name"
                    placeholder="Doe"
                    value={editAdmin.last_name}
                    onChange={(e) =>
                      setEditAdmin({ ...editAdmin, last_name: e.target.value })
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
                  value={editAdmin.email}
                  onChange={(e) =>
                    setEditAdmin({ ...editAdmin, email: e.target.value })
                  }
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_phone_number" className="text-primary-text">Phone Number</Label>
                <Input
                  id="edit_phone_number"
                  placeholder="+1234567890"
                  value={editAdmin.phone_number}
                  onChange={(e) =>
                    setEditAdmin({ ...editAdmin, phone_number: e.target.value })
                  }
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_designation" className="text-primary-text">Designation</Label>
                <Input
                  id="edit_designation"
                  placeholder="Department Admin"
                  value={editAdmin.designation}
                  disabled
                  className="bg-card/50 border-card-border text-primary-text placeholder:text-secondary-text cursor-not-allowed opacity-70"
                />
                <p className="text-xs text-muted-text">Fixed: Department Admin</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_departmentId" className="text-primary-text">Department</Label>
                  <Select
                    value={editAdmin.departmentId || 'none'}
                    onValueChange={(value) =>
                      setEditAdmin({ ...editAdmin, departmentId: value === 'none' ? '' : value })
                    }
                  >
                    <SelectTrigger className="bg-card border-card-border text-primary-text">
                      <SelectValue placeholder="Select a department" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-card-border">
                      <SelectItem value="none" className="text-primary-text hover:bg-card/50">
                        No Department
                      </SelectItem>
                      {departments.map((dept) => (
                        <SelectItem
                          key={dept.id}
                          value={dept.id.toString()}
                          className="text-primary-text hover:bg-card/50"
                        >
                          {dept.name} ({dept.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_status" className="text-primary-text">Status</Label>
                  <Select
                    value={editAdmin.status}
                    onValueChange={(value: 'active' | 'inactive') =>
                      setEditAdmin({ ...editAdmin, status: value })
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
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setSelectedAdmin(null);
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
              {isUpdating ? 'Updating...' : 'Update Admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Admin Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-card border-card-border">
          <DialogHeader>
            <DialogTitle className="text-primary-text">Delete Admin</DialogTitle>
            <DialogDescription className="text-secondary-text">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-primary-text">
              {selectedAdmin
                ? `${selectedAdmin.user.first_name} ${selectedAdmin.user.last_name}`
                : 'this admin'}
              </span>
              ? This action cannot be undone and will remove their admin
              privileges.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setSelectedAdmin(null);
              }}
              disabled={isDeleting}
              className="border-card-border transition-all bg-transparent"
              style={{
                color: isDeleting ? (isDarkMode ? '#6b7280' : '#9ca3af') : (isDarkMode ? '#ffffff' : '#111827'),
                borderColor: isDarkMode ? '#404040' : '#e5e7eb',
                backgroundColor: 'transparent',
                opacity: isDeleting ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isDeleting) {
                  e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                  e.currentTarget.style.color = isDarkMode ? '#ffffff' : '#111827';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = isDeleting ? (isDarkMode ? '#6b7280' : '#9ca3af') : (isDarkMode ? '#ffffff' : '#111827');
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
