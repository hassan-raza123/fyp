'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useDepartmentId } from '@/hooks/useDepartmentId';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Eye, Edit, Trash2, Shield, Loader2 } from 'lucide-react';
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

export default function AdminsPage() {
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
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);
  const [viewingAdmin, setViewingAdmin] = useState<any>(null);
  const { departmentId: departmentIdFromToken } = useDepartmentId();
  const [currentDepartmentId, setCurrentDepartmentId] = useState<string>('');
  const [newAdmin, setNewAdmin] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    employeeId: '',
    designation: 'Admin',
    status: 'active' as 'active' | 'inactive',
  });
  const [editAdmin, setEditAdmin] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    employeeId: '',
    designation: 'Admin',
    status: 'active' as 'active' | 'inactive',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Set department ID from token (no API call needed)
    if (departmentIdFromToken) {
      setCurrentDepartmentId(departmentIdFromToken);
    } else {
      setCurrentDepartmentId('');
      // Only show error if user is loaded and no department
      if (mounted) {
        toast.error('Department not assigned. Please contact super admin to assign a department to your account.');
      }
    }
  }, [departmentIdFromToken, mounted]);

  useEffect(() => {
    fetchAdmins();
  }, [search, statusFilter]);

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

  const handleViewAdmin = async (admin: Admin) => {
    setSelectedAdmin(admin);
    setIsLoadingAdmin(true);
    setShowViewModal(true);
    try {
      const response = await fetch(`/api/users/${admin.userId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch admin');
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
    setSelectedAdmin(admin);
    setIsLoadingAdmin(true);
    setShowEditModal(true);
    try {
      const response = await fetch(`/api/users/${admin.userId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch admin');
      const data = await response.json();
      setEditAdmin({
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        email: data.email || '',
        phoneNumber: data.phone_number || '',
        employeeId: data.faculty?.employeeId || '',
        designation: data.faculty?.designation || 'Admin',
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

  const handleCreateAdmin = async () => {
    if (!newAdmin.firstName || !newAdmin.lastName || !newAdmin.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    setErrors({});
    try {
      // Create user first
      const userResponse = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: newAdmin.email,
          first_name: newAdmin.firstName,
          last_name: newAdmin.lastName,
          phone_number: newAdmin.phoneNumber || null,
          password: getDefaultPassword('admin'),
        }),
      });

      const userData = await userResponse.json();
      if (!userResponse.ok) {
        throw new Error(userData.error || 'Failed to create user');
      }

      if (!userData.success || !userData.data) {
        throw new Error('Failed to create user account');
      }

      const userId = userData.data.id;

      // Assign admin role
      const roleResponse = await fetch(`/api/users/${userId}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          roles: ['admin'],
          facultyDetails: {
            departmentId: currentDepartmentId,
            designation: newAdmin.designation,
            employeeId: newAdmin.employeeId || null,
          },
        }),
      });

      const roleData = await roleResponse.json();
      if (!roleResponse.ok) {
        await fetch(`/api/users/${userId}`, { method: 'DELETE', credentials: 'include' });
        throw new Error(roleData.error || 'Failed to assign admin role');
      }

      toast.success('Admin user created successfully');
      toast.info(`Login credentials - Email: ${newAdmin.email}, Password: ${getDefaultPassword('admin')}`);
      setShowCreateModal(false);
      setNewAdmin({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        employeeId: '',
        designation: 'Admin',
        status: 'active',
      });
      fetchAdmins();
    } catch (error) {
      console.error('Error creating admin:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create admin');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateAdmin = async () => {
    if (!selectedAdmin) return;

    if (!editAdmin.firstName || !editAdmin.lastName || !editAdmin.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsUpdating(true);
    setErrors({});
    try {
      // Get user with faculty info
      const userGetResponse = await fetch(`/api/users/${selectedAdmin.userId}`, {
        credentials: 'include',
      });
      const userGetData = await userGetResponse.json();
      
      if (!userGetResponse.ok || userGetData.error) {
        throw new Error(userGetData.error || 'Failed to fetch user');
      }

      // Update user
      const userResponse = await fetch(`/api/users/${selectedAdmin.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          first_name: editAdmin.firstName,
          last_name: editAdmin.lastName,
          email: editAdmin.email,
          phone_number: editAdmin.phoneNumber || null,
          status: editAdmin.status,
        }),
      });

      const userData = await userResponse.json();
      if (!userResponse.ok) {
        throw new Error(userData.error || 'Failed to update user');
      }

      // Update faculty/admin details if faculty record exists
      if (userGetData.faculty?.id) {
        const facultyResponse = await fetch(`/api/faculty/${userGetData.faculty.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            employeeId: editAdmin.employeeId || null,
            designation: editAdmin.designation,
            status: editAdmin.status,
          }),
        });

        if (!facultyResponse.ok) {
          console.warn('Failed to update faculty details');
        }
      }

      toast.success('Admin updated successfully');
      setShowEditModal(false);
      setSelectedAdmin(null);
      fetchAdmins();
    } catch (error) {
      console.error('Error updating admin:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update admin');
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
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
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
          <p className="text-xs text-secondary-text">Loading admins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2 text-primary-text">
            <Shield className="h-4 w-4" style={{ color: primaryColor }} />
            Department Admins
          </h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Manage admin users in your department
          </p>
        </div>
        <Button 
          size="sm" 
          className="h-8 text-xs text-white"
          style={{
            backgroundColor: primaryColor,
            color: 'white',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDarkMode ? 'var(--orange-dark)' : 'var(--blue-dark)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = primaryColor;
          }}
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Admin
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-text" />
            <Input
              placeholder="Search admins..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-7 h-8 text-xs bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs bg-card border-card-border text-primary-text">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-card border-card-border">
            <SelectItem value="all" className="text-primary-text hover:bg-card/50">All Status</SelectItem>
            <SelectItem value="active" className="text-primary-text hover:bg-card/50">Active</SelectItem>
            <SelectItem value="inactive" className="text-primary-text hover:bg-card/50">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-card-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-semibold text-primary-text h-9 py-2">Employee ID</TableHead>
                  <TableHead className="text-xs font-semibold text-primary-text h-9 py-2">Name</TableHead>
                  <TableHead className="text-xs font-semibold text-primary-text h-9 py-2">Email</TableHead>
                  <TableHead className="text-xs font-semibold text-primary-text h-9 py-2">Password</TableHead>
                  <TableHead className="text-xs font-semibold text-primary-text h-9 py-2">Designation</TableHead>
                  <TableHead className="text-xs font-semibold text-primary-text h-9 py-2">Department</TableHead>
                  <TableHead className="text-xs font-semibold text-primary-text h-9 py-2">Status</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-primary-text h-9 py-2">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-xs text-secondary-text py-6">
                      No admin users found
                    </TableCell>
                  </TableRow>
                ) : (
                  admins.map((admin) => (
                    <TableRow key={admin.userId} className="hover:bg-hover-bg transition-colors">
                      <TableCell className="text-xs text-primary-text py-2">{admin.employeeId || 'N/A'}</TableCell>
                      <TableCell className="text-xs text-primary-text py-2">
                        {admin.user.first_name} {admin.user.last_name}
                      </TableCell>
                      <TableCell className="text-xs text-secondary-text py-2">{admin.user.email}</TableCell>
                      <TableCell className="text-xs py-2">
                        <code className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--hover-bg)', color: 'var(--text-primary)' }}>
                          {getDefaultPassword('admin')}
                        </code>
                        <span className="text-[10px] text-muted-text ml-1.5">
                          (default)
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-secondary-text py-2">{admin.designation || 'Admin'}</TableCell>
                      <TableCell className="text-xs text-secondary-text py-2">
                        {admin.department
                          ? `${admin.department.name} (${admin.department.code})`
                          : 'N/A'}
                      </TableCell>
                      <TableCell className="py-2">
                        {getStatusBadge(admin.user.status)}
                      </TableCell>
                      <TableCell className="text-right py-2">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-2 border-card-border bg-transparent"
                            style={{
                              color: isDarkMode ? '#ffffff' : '#111827',
                              borderColor: isDarkMode ? '#404040' : '#e5e7eb',
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
                            onClick={() => handleViewAdmin(admin)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-2 border-card-border bg-transparent"
                            style={{
                              color: isDarkMode ? '#ffffff' : '#111827',
                              borderColor: isDarkMode ? '#404040' : '#e5e7eb',
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
                            onClick={() => handleEditAdmin(admin)}
                          >
                            <Edit className="h-3.5 w-3.5 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-7 text-xs px-2 text-white"
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
                            onClick={() => {
                              setSelectedAdmin(admin);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

      {/* Create Admin Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Create New Admin</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Create a new admin user account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create_firstName" className="text-xs text-primary-text">First Name *</Label>
                <Input
                  id="create_firstName"
                  value={newAdmin.firstName}
                  onChange={(e) => setNewAdmin({ ...newAdmin, firstName: e.target.value })}
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create_lastName" className="text-xs text-primary-text">Last Name *</Label>
                <Input
                  id="create_lastName"
                  value={newAdmin.lastName}
                  onChange={(e) => setNewAdmin({ ...newAdmin, lastName: e.target.value })}
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create_email" className="text-xs text-primary-text">Email *</Label>
              <Input
                id="create_email"
                type="email"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create_phoneNumber" className="text-xs text-primary-text">Phone Number</Label>
              <Input
                id="create_phoneNumber"
                type="tel"
                value={newAdmin.phoneNumber}
                onChange={(e) => setNewAdmin({ ...newAdmin, phoneNumber: e.target.value })}
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create_employeeId" className="text-xs text-primary-text">Employee ID</Label>
              <Input
                id="create_employeeId"
                value={newAdmin.employeeId}
                onChange={(e) => setNewAdmin({ ...newAdmin, employeeId: e.target.value })}
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create_designation" className="text-xs text-primary-text">Designation *</Label>
              <Input
                id="create_designation"
                value={newAdmin.designation}
                onChange={(e) => setNewAdmin({ ...newAdmin, designation: e.target.value })}
                placeholder="e.g., Department Admin"
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create_status" className="text-xs text-primary-text">Status *</Label>
              <Select
                value={newAdmin.status}
                onValueChange={(value: 'active' | 'inactive') => setNewAdmin({ ...newAdmin, status: value })}
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
            <div className="p-4 rounded-lg" style={{ backgroundColor: isDarkMode ? 'rgba(38, 40, 149, 0.15)' : 'rgba(38, 40, 149, 0.1)' }}>
              <p className="text-xs" style={{ color: isDarkMode ? 'var(--orange)' : 'var(--blue)' }}>
                <strong>Note:</strong> A user account will be created automatically with default password: <strong>{getDefaultPassword('admin')}</strong>.
                Admin user can login and change their password.
              </p>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-card-border bg-transparent"
              style={{
                color: isDarkMode ? '#ffffff' : '#111827',
                borderColor: isDarkMode ? '#404040' : '#e5e7eb',
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
              onClick={() => {
                setShowCreateModal(false);
                setNewAdmin({
                  firstName: '',
                  lastName: '',
                  email: '',
                  phoneNumber: '',
                  employeeId: '',
                  designation: 'Admin',
                  status: 'active',
                });
              }}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs text-white"
              style={{
                backgroundColor: isCreating ? (isDarkMode ? '#9a3412' : '#1e40af') : primaryColor,
                color: 'white',
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
              onClick={handleCreateAdmin}
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Admin'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Admin Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Admin Details</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
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
                <p className="text-xs text-secondary-text">Loading...</p>
              </div>
            </div>
          ) : viewingAdmin ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-secondary-text mb-3">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">First Name</p>
                    <p className="text-xs text-primary-text">{viewingAdmin.first_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Last Name</p>
                    <p className="text-xs text-primary-text">{viewingAdmin.last_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Email</p>
                    <p className="text-xs text-primary-text">{viewingAdmin.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Phone Number</p>
                    <p className="text-xs text-primary-text">{viewingAdmin.phone_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Status</p>
                    <div className="mt-1">{getStatusBadge(viewingAdmin.status)}</div>
                  </div>
                </div>
              </div>
              {viewingAdmin.faculty && (
                <div>
                  <h3 className="text-xs font-semibold text-secondary-text mb-3">Admin Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-muted-text mb-1">Employee ID</p>
                      <p className="text-xs text-primary-text">{viewingAdmin.faculty.employeeId || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-text mb-1">Designation</p>
                      <p className="text-xs text-primary-text">{viewingAdmin.faculty.designation || 'Department Admin'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-text mb-1">Department</p>
                      <p className="text-xs text-primary-text">
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
            <div className="text-center py-12 text-xs text-secondary-text">
              <p>No data available</p>
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-card-border bg-transparent"
              style={{
                color: isDarkMode ? '#ffffff' : '#111827',
                borderColor: isDarkMode ? '#404040' : '#e5e7eb',
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
              onClick={() => {
                setShowViewModal(false);
                setViewingAdmin(null);
              }}
            >
              Close
            </Button>
            {viewingAdmin && (
              <Button
                size="sm"
                className="h-8 text-xs text-white"
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
                onClick={() => {
                  const admin = admins.find(a => a.userId === viewingAdmin.id);
                  if (admin) {
                    setShowViewModal(false);
                    handleEditAdmin(admin);
                  }
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
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Edit Admin</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Update admin user information
            </DialogDescription>
          </DialogHeader>
          {isLoadingAdmin ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-3">
                <div 
                  className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: primaryColor }}
                />
                <p className="text-xs text-secondary-text">Loading...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_firstName" className="text-xs text-primary-text">First Name *</Label>
                  <Input
                    id="edit_firstName"
                    value={editAdmin.firstName}
                    onChange={(e) => setEditAdmin({ ...editAdmin, firstName: e.target.value })}
                    className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_lastName" className="text-xs text-primary-text">Last Name *</Label>
                  <Input
                    id="edit_lastName"
                    value={editAdmin.lastName}
                    onChange={(e) => setEditAdmin({ ...editAdmin, lastName: e.target.value })}
                    className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_email" className="text-xs text-primary-text">Email *</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={editAdmin.email}
                  onChange={(e) => setEditAdmin({ ...editAdmin, email: e.target.value })}
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_phoneNumber" className="text-xs text-primary-text">Phone Number</Label>
                <Input
                  id="edit_phoneNumber"
                  type="tel"
                  value={editAdmin.phoneNumber}
                  onChange={(e) => setEditAdmin({ ...editAdmin, phoneNumber: e.target.value })}
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_employeeId" className="text-xs text-primary-text">Employee ID</Label>
                <Input
                  id="edit_employeeId"
                  value={editAdmin.employeeId}
                  onChange={(e) => setEditAdmin({ ...editAdmin, employeeId: e.target.value })}
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_designation" className="text-xs text-primary-text">Designation *</Label>
                <Input
                  id="edit_designation"
                  value={editAdmin.designation}
                  onChange={(e) => setEditAdmin({ ...editAdmin, designation: e.target.value })}
                  placeholder="e.g., Department Admin"
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_status" className="text-xs text-primary-text">Status *</Label>
                <Select
                  value={editAdmin.status}
                  onValueChange={(value: 'active' | 'inactive') => setEditAdmin({ ...editAdmin, status: value })}
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
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-card-border bg-transparent"
              style={{
                color: isUpdating ? (isDarkMode ? '#6b7280' : '#9ca3af') : (isDarkMode ? '#ffffff' : '#111827'),
                borderColor: isDarkMode ? '#404040' : '#e5e7eb',
              }}
              onMouseEnter={(e) => {
                if (!isUpdating && !e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
              onClick={() => {
                setShowEditModal(false);
                setSelectedAdmin(null);
              }}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs text-white"
              style={{
                backgroundColor: isUpdating ? (isDarkMode ? '#9a3412' : '#1e40af') : primaryColor,
                color: 'white',
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
              onClick={handleUpdateAdmin}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Admin'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Admin Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-card border-card-border p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Delete Admin</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Are you sure you want to delete{' '}
              {selectedAdmin
                ? `${selectedAdmin.user.first_name} ${selectedAdmin.user.last_name}`
                : 'this admin'}
              ? This action cannot be undone and will remove their admin
              privileges.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-card-border bg-transparent"
              style={{
                color: isDarkMode ? '#ffffff' : '#111827',
                borderColor: isDarkMode ? '#404040' : '#e5e7eb',
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
              onClick={() => {
                setShowDeleteDialog(false);
                setSelectedAdmin(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-8 text-xs text-white"
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
                borderColor: '#dc2626',
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = '#b91c1c';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = '#dc2626';
                }
              }}
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

