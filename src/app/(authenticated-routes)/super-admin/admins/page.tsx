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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchAdmins();
    }
  }, [mounted, search, statusFilter]);

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
          onClick={() => {
            toast.info(
              'Admin creation is currently handled from the department admin side. Super admin can assign departments to existing admins.'
            );
          }}
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
          Add Admin
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
                  <TableHead className="text-secondary-text">Password</TableHead>
                  <TableHead className="text-secondary-text">Designation</TableHead>
                  <TableHead className="text-secondary-text">Department</TableHead>
                  <TableHead className="text-secondary-text">Status</TableHead>
                  <TableHead className="text-right text-secondary-text">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-secondary-text">
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
                        {admin.employeeId || <span className="text-muted-text italic">N/A</span>}
                      </TableCell>
                      <TableCell className="text-primary-text">
                        {admin.user.first_name} {admin.user.last_name}
                      </TableCell>
                      <TableCell className="text-primary-text">{admin.user.email}</TableCell>
                      <TableCell>
                        <code 
                          className="text-xs px-2 py-1 rounded"
                          style={{
                            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                            color: isDarkMode ? '#ffffff' : '#111827',
                          }}
                        >
                          11223344
                        </code>
                        <span className="text-xs text-muted-text ml-2">
                          (default)
                        </span>
                      </TableCell>
                      <TableCell className="text-primary-text">{admin.designation || 'Admin'}</TableCell>
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
                            onClick={() =>
                              router.push(`/admin/admins/${admin.userId}`)
                            }
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
                            onClick={() =>
                              router.push(`/admin/admins/${admin.userId}/edit`)
                            }
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
