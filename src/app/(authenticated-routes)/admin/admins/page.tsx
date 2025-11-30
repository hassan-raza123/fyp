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
import { Plus, Search, Eye, Edit, Trash2, Shield } from 'lucide-react';
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
  
  const router = useRouter();
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

  const handleDelete = async () => {
    if (!selectedAdmin) return;

    setIsDeleting(true);
    try {
      // Delete admin by removing their role and faculty record
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
          onClick={() => router.push('/admin/admins/create')}
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
                            onClick={() =>
                              router.push(`/admin/admins/${admin.userId}`)
                            }
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
                            onClick={() =>
                              router.push(`/admin/admins/${admin.userId}/edit`)
                            }
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

