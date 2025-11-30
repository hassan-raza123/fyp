'use client';

import { useState, useEffect } from 'react';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Eye, Edit, Trash2, Loader2 } from 'lucide-react';
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

interface Faculty {
  id: number;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    status: string;
  };
  employeeId?: string;
  designation: string;
  department: {
    id: number;
    name: string;
    code: string;
  };
}

export default function FacultyPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoadingFaculty, setIsLoadingFaculty] = useState(false);
  const [viewingFaculty, setViewingFaculty] = useState<Faculty | null>(null);
  const [currentDepartmentId, setCurrentDepartmentId] = useState<string>('');
  const [newFaculty, setNewFaculty] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    employeeId: '',
    designation: '',
    status: 'active' as 'active' | 'inactive',
  });
  const [editFaculty, setEditFaculty] = useState({
    designation: '',
    status: 'active' as 'active' | 'inactive',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    setMounted(true);
    fetchCurrentDepartment();
  }, []);

  useEffect(() => {
    fetchFaculties();
  }, [search, statusFilter]);

  const fetchCurrentDepartment = async () => {
    try {
      const settingsResponse = await fetch('/api/settings');
      if (!settingsResponse.ok) {
        throw new Error('Failed to fetch settings');
      }
      const settingsData = await settingsResponse.json();
      if (settingsData.success && settingsData.data) {
        const systemSettings =
          typeof settingsData.data.system === 'string'
            ? JSON.parse(settingsData.data.system)
            : settingsData.data.system;
        const departmentCode = systemSettings?.departmentCode;
        if (departmentCode) {
          const deptResponse = await fetch(`/api/departments/by-code?code=${departmentCode}`);
          if (deptResponse.ok) {
            const deptData = await deptResponse.json();
            setCurrentDepartmentId(deptData.id.toString());
          }
        }
      }
    } catch (error) {
      console.error('Error fetching current department:', error);
    }
  };

  const fetchFaculties = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/faculties');
      if (!response.ok) throw new Error('Failed to fetch faculties');

      const data = await response.json();
      if (data.success) {
        let facultiesData = data.data || [];
        
        // Client-side filtering
        if (search) {
          const searchLower = search.toLowerCase();
          facultiesData = facultiesData.filter((f: Faculty) =>
            `${f.user.first_name} ${f.user.last_name}`.toLowerCase().includes(searchLower) ||
            f.user.email.toLowerCase().includes(searchLower) ||
            (f.employeeId && f.employeeId.toLowerCase().includes(searchLower))
          );
        }
        
        if (statusFilter !== 'all') {
          facultiesData = facultiesData.filter((f: Faculty) =>
            f.user.status.toLowerCase() === statusFilter.toLowerCase()
          );
        }
        
        setFaculties(facultiesData);
      } else {
        throw new Error(data.error || 'Failed to fetch faculties');
      }
    } catch (error) {
      console.error('Error fetching faculties:', error);
      toast.error('Failed to load faculties');
    } finally {
      setLoading(false);
    }
  };

  const handleViewFaculty = async (faculty: Faculty) => {
    setSelectedFaculty(faculty);
    setIsLoadingFaculty(true);
    setShowViewModal(true);
    try {
      const response = await fetch(`/api/faculty/${faculty.id}`);
      if (!response.ok) throw new Error('Failed to fetch faculty');
      const data = await response.json();
      if (data.success && data.data) {
        setViewingFaculty(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch faculty');
      }
    } catch (error) {
      console.error('Error fetching faculty:', error);
      toast.error('Failed to load faculty details');
      setShowViewModal(false);
    } finally {
      setIsLoadingFaculty(false);
    }
  };

  const handleEditFaculty = async (faculty: Faculty) => {
    setSelectedFaculty(faculty);
    setIsLoadingFaculty(true);
    setShowEditModal(true);
    try {
      const response = await fetch(`/api/faculty/${faculty.id}`);
      if (!response.ok) throw new Error('Failed to fetch faculty');
      const data = await response.json();
      if (data.success && data.data) {
        setEditFaculty({
          designation: data.data.designation || '',
          status: (data.data.status || 'active') as 'active' | 'inactive',
        });
      } else {
        throw new Error(data.error || 'Failed to fetch faculty');
      }
    } catch (error) {
      console.error('Error fetching faculty:', error);
      toast.error('Failed to load faculty details');
      setShowEditModal(false);
    } finally {
      setIsLoadingFaculty(false);
    }
  };

  const handleCreateFaculty = async () => {
    if (!newFaculty.firstName || !newFaculty.lastName || !newFaculty.email || !newFaculty.designation) {
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
        body: JSON.stringify({
          email: newFaculty.email,
          first_name: newFaculty.firstName,
          last_name: newFaculty.lastName,
          phone_number: newFaculty.phoneNumber || null,
          password: getDefaultPassword('faculty'),
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

      // Assign faculty role
      const roleResponse = await fetch(`/api/users/${userId}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roles: ['faculty'],
          facultyDetails: {
            departmentId: currentDepartmentId,
            designation: newFaculty.designation,
            employeeId: newFaculty.employeeId || null,
          },
        }),
      });

      const roleData = await roleResponse.json();
      if (!roleResponse.ok) {
        await fetch(`/api/users/${userId}`, { method: 'DELETE' });
        throw new Error(roleData.error || 'Failed to assign faculty role');
      }

      toast.success('Faculty member created successfully');
      toast.info(`Login credentials - Email: ${newFaculty.email}, Password: ${getDefaultPassword('faculty')}`);
      setShowCreateModal(false);
      setNewFaculty({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        employeeId: '',
        designation: '',
        status: 'active',
      });
      fetchFaculties();
    } catch (error) {
      console.error('Error creating faculty:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create faculty');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateFaculty = async () => {
    if (!selectedFaculty) return;

    if (!editFaculty.designation) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsUpdating(true);
    setErrors({});
    try {
      const response = await fetch(`/api/faculty/${selectedFaculty.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFaculty),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update faculty');
      }

      toast.success('Faculty member updated successfully');
      setShowEditModal(false);
      setSelectedFaculty(null);
      fetchFaculties();
    } catch (error) {
      console.error('Error updating faculty:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update faculty');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedFaculty) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/faculty/${selectedFaculty.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete faculty');
      }

      toast.success('Faculty deleted successfully');
      setShowDeleteDialog(false);
      setSelectedFaculty(null);
      fetchFaculties();
    } catch (error) {
      console.error('Error deleting faculty:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete faculty'
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
          <p className="text-xs text-secondary-text">Loading faculty...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-primary-text">Department Faculty</h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Manage faculty members in your department
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
          Add Faculty
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-text" />
            <Input
              placeholder="Search faculty..."
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
                  <TableHead className="text-xs font-semibold text-primary-text h-9 py-2">Designation</TableHead>
                  <TableHead className="text-xs font-semibold text-primary-text h-9 py-2">Department</TableHead>
                  <TableHead className="text-xs font-semibold text-primary-text h-9 py-2">Status</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-primary-text h-9 py-2">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faculties.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-xs text-secondary-text py-6">
                      No faculty members found
                    </TableCell>
                  </TableRow>
                ) : (
                  faculties.map((faculty) => (
                    <TableRow key={faculty.id} className="hover:bg-hover-bg transition-colors">
                      <TableCell className="text-xs text-primary-text py-2">{faculty.employeeId || 'N/A'}</TableCell>
                      <TableCell className="text-xs text-primary-text py-2">
                        {faculty.user.first_name} {faculty.user.last_name}
                      </TableCell>
                      <TableCell className="text-xs text-secondary-text py-2">{faculty.user.email}</TableCell>
                      <TableCell className="text-xs text-secondary-text py-2">{faculty.designation || 'N/A'}</TableCell>
                      <TableCell className="text-xs text-secondary-text py-2">
                        {faculty.department.name} ({faculty.department.code})
                      </TableCell>
                      <TableCell className="py-2">
                        {getStatusBadge(faculty.user.status)}
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
                            onClick={() => handleViewFaculty(faculty)}
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
                            onClick={() => handleEditFaculty(faculty)}
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
                              setSelectedFaculty(faculty);
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

      {/* Create Faculty Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Create New Faculty</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Create a new faculty member account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create_firstName" className="text-xs text-primary-text">First Name *</Label>
                <Input
                  id="create_firstName"
                  value={newFaculty.firstName}
                  onChange={(e) => setNewFaculty({ ...newFaculty, firstName: e.target.value })}
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create_lastName" className="text-xs text-primary-text">Last Name *</Label>
                <Input
                  id="create_lastName"
                  value={newFaculty.lastName}
                  onChange={(e) => setNewFaculty({ ...newFaculty, lastName: e.target.value })}
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create_email" className="text-xs text-primary-text">Email *</Label>
              <Input
                id="create_email"
                type="email"
                value={newFaculty.email}
                onChange={(e) => setNewFaculty({ ...newFaculty, email: e.target.value })}
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create_phoneNumber" className="text-xs text-primary-text">Phone Number</Label>
              <Input
                id="create_phoneNumber"
                type="tel"
                value={newFaculty.phoneNumber}
                onChange={(e) => setNewFaculty({ ...newFaculty, phoneNumber: e.target.value })}
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create_employeeId" className="text-xs text-primary-text">Employee ID</Label>
              <Input
                id="create_employeeId"
                value={newFaculty.employeeId}
                onChange={(e) => setNewFaculty({ ...newFaculty, employeeId: e.target.value })}
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create_designation" className="text-xs text-primary-text">Designation *</Label>
              <Input
                id="create_designation"
                value={newFaculty.designation}
                onChange={(e) => setNewFaculty({ ...newFaculty, designation: e.target.value })}
                placeholder="e.g., Assistant Professor"
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create_status" className="text-xs text-primary-text">Status *</Label>
              <Select
                value={newFaculty.status}
                onValueChange={(value: 'active' | 'inactive') => setNewFaculty({ ...newFaculty, status: value })}
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
                <strong>Note:</strong> A user account will be created automatically with default password: <strong>{getDefaultPassword('faculty')}</strong>.
                Faculty member can login and change their password.
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
                setNewFaculty({
                  firstName: '',
                  lastName: '',
                  email: '',
                  phoneNumber: '',
                  employeeId: '',
                  designation: '',
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
              onClick={handleCreateFaculty}
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Faculty'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Faculty Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Faculty Details</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              View complete information about this faculty member
            </DialogDescription>
          </DialogHeader>
          {isLoadingFaculty ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-3">
                <div 
                  className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: primaryColor }}
                />
                <p className="text-xs text-secondary-text">Loading...</p>
              </div>
            </div>
          ) : viewingFaculty ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-secondary-text mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Employee ID</p>
                    <p className="text-xs text-primary-text">{viewingFaculty.employeeId || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Name</p>
                    <p className="text-xs text-primary-text">
                      {viewingFaculty.user.first_name} {viewingFaculty.user.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Email</p>
                    <p className="text-xs text-primary-text">{viewingFaculty.user.email}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Designation</p>
                    <p className="text-xs text-primary-text">{viewingFaculty.designation || 'N/A'}</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-secondary-text mb-3">Department Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Department</p>
                    <p className="text-xs text-primary-text">
                      {viewingFaculty.department.name} ({viewingFaculty.department.code})
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Status</p>
                    <div className="mt-1">{getStatusBadge(viewingFaculty.user.status)}</div>
                  </div>
                </div>
              </div>
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
                setViewingFaculty(null);
              }}
            >
              Close
            </Button>
            {viewingFaculty && (
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
                  if (selectedFaculty) {
                    setShowViewModal(false);
                    handleEditFaculty(selectedFaculty);
                  }
                }}
              >
                <Edit className="h-3.5 w-3.5 mr-1.5" />
                Edit Faculty
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Faculty Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Edit Faculty</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Update faculty member information
            </DialogDescription>
          </DialogHeader>
          {isLoadingFaculty ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-3">
                <div 
                  className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: primaryColor }}
                />
                <p className="text-xs text-secondary-text">Loading...</p>
              </div>
            </div>
          ) : selectedFaculty ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-primary-text">Name</Label>
                  <Input
                    value={`${selectedFaculty.user.first_name} ${selectedFaculty.user.last_name}`}
                    disabled
                    className="bg-card border-card-border text-primary-text"
                    style={{ backgroundColor: 'var(--hover-bg)' }}
                  />
                  <p className="text-xs text-secondary-text">Name cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-primary-text">Email</Label>
                  <Input
                    value={selectedFaculty.user.email}
                    disabled
                    className="bg-card border-card-border text-primary-text"
                    style={{ backgroundColor: 'var(--hover-bg)' }}
                  />
                  <p className="text-xs text-secondary-text">Email cannot be changed</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_designation" className="text-xs text-primary-text">Designation *</Label>
                <Input
                  id="edit_designation"
                  value={editFaculty.designation}
                  onChange={(e) => setEditFaculty({ ...editFaculty, designation: e.target.value })}
                  placeholder="e.g., Assistant Professor"
                  required
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-primary-text">Department</Label>
                <Input
                  value={`${selectedFaculty.department.name} (${selectedFaculty.department.code})`}
                  disabled
                  className="bg-card border-card-border text-primary-text"
                  style={{ backgroundColor: 'var(--hover-bg)' }}
                />
                <p className="text-xs text-secondary-text">Department cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_status" className="text-xs text-primary-text">Status *</Label>
                <Select
                  value={editFaculty.status}
                  onValueChange={(value: 'active' | 'inactive') => setEditFaculty({ ...editFaculty, status: value })}
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
          ) : null}
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
                setSelectedFaculty(null);
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
              onClick={handleUpdateFaculty}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Faculty Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-card border-card-border p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Delete Faculty</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Are you sure you want to delete{' '}
              {selectedFaculty
                ? `${selectedFaculty.user.first_name} ${selectedFaculty.user.last_name}`
                : 'this faculty member'}
              ? This action cannot be undone.
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
                setSelectedFaculty(null);
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

