'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import {
  Building2,
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  Shield,
  AlertCircle,
  GraduationCap,
  BookOpen,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface Department {
  id: number;
  name: string;
  code: string;
  description: string | null;
  status: string;
  admin: {
    id: number;
    name: string;
    email: string;
    status: string;
  } | null;
  counts: {
    faculties: number;
    students: number;
    programs: number;
    courses: number;
  };
}

interface AdminUser {
  id: number;
  userId: number;
  name: string;
  email: string;
  status: string;
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

export default function SuperAdminDepartmentsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  const [newDepartment, setNewDepartment] = useState({
    name: '',
    code: '',
    description: '',
  });
  const [editDepartment, setEditDepartment] = useState({
    name: '',
    code: '',
    description: '',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchDepartments();
      fetchAdminUsers();
    }
  }, [mounted]);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }

      const data = await response.json();
      if (data.success) {
        setDepartments(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch departments');
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      setLoadingAdmins(true);
      const response = await fetch('/api/admins', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch admin users');
      }

      const data = await response.json();
      if (data.success) {
        const formatted = data.data.map((admin: any) => ({
          id: admin.userId,
          userId: admin.userId,
          name: `${admin.user.first_name} ${admin.user.last_name}`,
          email: admin.user.email,
          status: admin.user.status,
        }));
        setAdminUsers(formatted);
      }
    } catch (error) {
      console.error('Error fetching admin users:', error);
      toast.error('Failed to load admin users');
    } finally {
      setLoadingAdmins(false);
    }
  };

  const handleCreateDepartment = async () => {
    if (!newDepartment.name.trim() || !newDepartment.code.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newDepartment.name.trim(),
          code: newDepartment.code.trim(),
          description: newDepartment.description.trim() || null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Department created successfully!');
        setShowCreateModal(false);
        setNewDepartment({ name: '', code: '', description: '' });
        fetchDepartments();
      } else {
        throw new Error(data.error || 'Failed to create department');
      }
    } catch (error) {
      console.error('Error creating department:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create department'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditDepartment = (dept: Department) => {
    if (!dept || !dept.id) {
      toast.error('Invalid department selected');
      return;
    }
    setSelectedDepartment(dept);
    setEditDepartment({
      name: dept.name,
      code: dept.code,
      description: dept.description || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateDepartment = async () => {
    if (
      !selectedDepartment ||
      !selectedDepartment.id ||
      !editDepartment.name.trim() ||
      !editDepartment.code.trim()
    ) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsUpdating(true);
    try {
      // Ensure department ID is a valid number
      const departmentId = Number(selectedDepartment.id);
      if (isNaN(departmentId) || departmentId <= 0) {
        throw new Error('Invalid department ID');
      }

      const response = await fetch(
        `/api/departments/${departmentId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: editDepartment.name.trim(),
            code: editDepartment.code.trim(),
            description: editDepartment.description.trim() || null,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success('Department updated successfully!');
        setShowEditModal(false);
        setSelectedDepartment(null);
        setEditDepartment({ name: '', code: '', description: '' });
        fetchDepartments();
      } else {
        throw new Error(data.error || 'Failed to update department');
      }
    } catch (error) {
      console.error('Error updating department:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update department'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteDepartment = async () => {
    if (!selectedDepartment || !selectedDepartment.id) return;

    setIsDeleting(true);
    try {
      const departmentId = Number(selectedDepartment.id);
      if (isNaN(departmentId) || departmentId <= 0) {
        throw new Error('Invalid department ID');
      }

      const response = await fetch(
        `/api/departments/${departmentId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success('Department deleted successfully!');
        setShowDeleteModal(false);
        setSelectedDepartment(null);
        fetchDepartments();
      } else {
        throw new Error(data.error || 'Failed to delete department');
      }
    } catch (error) {
      console.error('Error deleting department:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete department'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAssignAdmin = async () => {
    if (!selectedDepartment || !selectedDepartment.id || !selectedAdminId) {
      toast.error('Please select a department and admin');
      return;
    }

    setIsAssigning(true);
    try {
      const departmentId = Number(selectedDepartment.id);
      if (isNaN(departmentId) || departmentId <= 0) {
        throw new Error('Invalid department ID');
      }

      const response = await fetch(
        '/api/super-admin/assign-admin-to-department',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            userId: parseInt(selectedAdminId),
            departmentId: departmentId,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success('Admin assigned to department successfully!');
        setShowAssignModal(false);
        setSelectedDepartment(null);
        setSelectedAdminId('');
        fetchDepartments();
      } else {
        throw new Error(data.error || 'Failed to assign admin');
      }
    } catch (error) {
      console.error('Error assigning admin:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to assign admin'
      );
    } finally {
      setIsAssigning(false);
    }
  };

  const filteredDepartments = useMemo(
    () =>
      departments.filter(
        (dept) =>
          dept.name.toLowerCase().includes(search.toLowerCase()) ||
          dept.code.toLowerCase().includes(search.toLowerCase())
      ),
    [departments, search]
  );

  // Calculate stats
  const stats = useMemo(() => {
    const total = departments.length;
    const assigned = departments.filter(d => d.admin !== null).length;
    const unassigned = total - assigned;
    const totalFaculties = departments.reduce((sum, d) => sum + d.counts.faculties, 0);
    const totalStudents = departments.reduce((sum, d) => sum + d.counts.students, 0);
    const totalPrograms = departments.reduce((sum, d) => sum + d.counts.programs, 0);
    const totalCourses = departments.reduce((sum, d) => sum + d.counts.courses, 0);
    
    return { total, assigned, unassigned, totalFaculties, totalStudents, totalPrograms, totalCourses };
  }, [departments]);

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
            Loading departments...
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
              <Building2 className="h-5 w-5 text-white" />
            </div>
            Departments
          </h1>
          <p className="text-xs mt-1.5 text-secondary-text">
            Manage departments and assign admins
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
          Create Department
        </Button>
      </div>

      {/* Key Stats - Essential Only */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          title="Total Departments"
          value={stats.total}
          subtitle={`${stats.assigned} assigned`}
          icon={<Building2 className="w-5 h-5" />}
          isDarkMode={isDarkMode}
        />
        <StatCard
          title="Assigned"
          value={stats.assigned}
          subtitle={`${stats.unassigned} unassigned`}
          icon={<Shield className="w-5 h-5" />}
          isDarkMode={isDarkMode}
        />
        <StatCard
          title="Total Faculty"
          value={stats.totalFaculties}
          subtitle="Active members"
          icon={<UserCheck className="w-5 h-5" />}
          isDarkMode={isDarkMode}
        />
        <StatCard
          title="Total Students"
          value={stats.totalStudents.toLocaleString()}
          subtitle="Enrolled"
          icon={<GraduationCap className="w-5 h-5" />}
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Departments Table */}
      <Card className="rounded-xl shadow-sm border bg-card border-card-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-primary-text">Departments</CardTitle>
              <CardDescription className="text-secondary-text">
                View all departments and their assigned admins
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-text`} />
              <Input
                placeholder="Search departments..."
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
                  <TableHead className="text-secondary-text">Code</TableHead>
                  <TableHead className="text-secondary-text">Name</TableHead>
                  <TableHead className="text-secondary-text">Description</TableHead>
                  <TableHead className="text-secondary-text">Admin</TableHead>
                  <TableHead className="text-secondary-text">Stats</TableHead>
                  <TableHead className="text-secondary-text">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepartments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-secondary-text">
                      <div className="flex flex-col items-center gap-2">
                        <Building2 className="h-8 w-8 text-muted-text" />
                        <p>No departments found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDepartments.map((dept) => (
                    <TableRow 
                      key={dept.id}
                      className="border-card-border hover:bg-card/50"
                    >
                      <TableCell className="font-semibold text-primary-text">
                        <span 
                          className="px-2 py-1 rounded-md text-xs font-mono"
                          style={{
                            backgroundColor: isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)',
                            color: primaryColor,
                          }}
                        >
                          {dept.code}
                        </span>
                      </TableCell>
                      <TableCell className="text-primary-text">{dept.name}</TableCell>
                      <TableCell className="text-secondary-text">
                        {dept.description || <span className="italic text-muted-text">-</span>}
                      </TableCell>
                      <TableCell>
                        {dept.admin ? (
                          <div>
                            <div className="font-medium text-primary-text">{dept.admin.name}</div>
                            <div className="text-xs text-secondary-text">
                              {dept.admin.email}
                            </div>
                            <Badge
                              className={`mt-1 text-[10px] ${
                                dept.admin.status === 'active' 
                                  ? 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30'
                                  : 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30'
                              }`}
                            >
                              {dept.admin.status}
                            </Badge>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2" style={{ color: primaryColor }}>
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">No admin assigned</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-1.5 text-secondary-text">
                          <div className="flex items-center gap-1.5">
                            <UserCheck className="h-3 w-3" />
                            <span>{dept.counts.faculties} Faculties</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <GraduationCap className="h-3 w-3" />
                            <span>{dept.counts.students} Students</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="h-3 w-3" />
                            <span>{dept.counts.programs} Programs</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="h-3 w-3" />
                            <span>{dept.counts.courses} Courses</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditDepartment(dept)}
                            className="border-card-border transition-all hover:scale-105 text-xs px-3 h-8"
                            style={{
                              color: isDarkMode ? 'var(--white)' : 'var(--gray-900)',
                              borderColor: isDarkMode ? 'var(--gray-700)' : 'var(--gray-200)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';
                              e.currentTarget.style.borderColor = primaryColor;
                              e.currentTarget.style.color = primaryColor;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.borderColor = isDarkMode ? 'var(--gray-700)' : 'var(--gray-200)';
                              e.currentTarget.style.color = isDarkMode ? 'var(--white)' : 'var(--gray-900)';
                            }}
                          >
                            <Edit className="h-3.5 w-3.5 mr-1.5" />
                            <span>Edit</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (!dept || !dept.id) {
                                toast.error('Invalid department');
                                return;
                              }
                              setSelectedDepartment(dept);
                              setShowAssignModal(true);
                            }}
                            className="transition-all hover:scale-105 text-xs px-3 h-8"
                            style={{
                              borderColor: primaryColor + '50',
                              color: isDarkMode ? 'var(--white)' : 'var(--gray-900)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = primaryColor;
                              e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';
                              e.currentTarget.style.color = primaryColor;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = primaryColor + '50';
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = isDarkMode ? 'var(--white)' : 'var(--gray-900)';
                            }}
                          >
                            <Shield className="h-3.5 w-3.5 mr-1.5" />
                            <span>Assign</span>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (!dept || !dept.id) {
                                toast.error('Invalid department');
                                return;
                              }
                              setSelectedDepartment(dept);
                              setShowDeleteModal(true);
                            }}
                            className="transition-all hover:scale-105 text-xs px-3 h-8 text-white"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                            <span>Delete</span>
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

      {/* Create Department Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-card border-card-border">
          <DialogHeader>
            <DialogTitle className="text-primary-text">Create New Department</DialogTitle>
            <DialogDescription className="text-secondary-text">
              Add a new department to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-primary-text">Department Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Computer Science"
                value={newDepartment.name}
                onChange={(e) =>
                  setNewDepartment({ ...newDepartment, name: e.target.value })
                }
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code" className="text-primary-text">Department Code *</Label>
              <Input
                id="code"
                placeholder="e.g., CS"
                value={newDepartment.code}
                onChange={(e) =>
                  setNewDepartment({
                    ...newDepartment,
                    code: e.target.value.toUpperCase(),
                  })
                }
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-primary-text">Description</Label>
              <Textarea
                id="description"
                placeholder="Department description (optional)"
                value={newDepartment.description}
                onChange={(e) =>
                  setNewDepartment({
                    ...newDepartment,
                    description: e.target.value,
                  })
                }
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              className="border-card-border transition-all"
              style={{
                color: isDarkMode ? 'var(--white)' : 'var(--gray-900)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                e.currentTarget.style.color = isDarkMode ? 'var(--white)' : 'var(--gray-900)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = isDarkMode ? 'var(--white)' : 'var(--gray-900)';
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateDepartment} 
              disabled={isCreating}
              className="text-white"
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
              {isCreating ? 'Creating...' : 'Create Department'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Department Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-card border-card-border">
          <DialogHeader>
            <DialogTitle className="text-primary-text">Edit Department</DialogTitle>
            <DialogDescription className="text-secondary-text">
              Update department information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-primary-text">Department Name *</Label>
              <Input
                id="edit-name"
                placeholder="e.g., Computer Science"
                value={editDepartment.name}
                onChange={(e) =>
                  setEditDepartment({ ...editDepartment, name: e.target.value })
                }
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-code" className="text-primary-text">Department Code *</Label>
              <Input
                id="edit-code"
                placeholder="e.g., CS"
                value={editDepartment.code}
                onChange={(e) =>
                  setEditDepartment({
                    ...editDepartment,
                    code: e.target.value.toUpperCase(),
                  })
                }
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-primary-text">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Department description (optional)"
                value={editDepartment.description}
                onChange={(e) =>
                  setEditDepartment({
                    ...editDepartment,
                    description: e.target.value,
                  })
                }
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setSelectedDepartment(null);
                setEditDepartment({ name: '', code: '', description: '' });
              }}
              className="border-card-border transition-all"
              style={{
                color: isDarkMode ? 'var(--white)' : 'var(--gray-900)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                e.currentTarget.style.color = isDarkMode ? 'var(--white)' : 'var(--gray-900)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = isDarkMode ? 'var(--white)' : 'var(--gray-900)';
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateDepartment} 
              disabled={isUpdating}
              className="text-white"
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
              {isUpdating ? 'Updating...' : 'Update Department'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Department Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="bg-card border-card-border">
          <DialogHeader>
            <DialogTitle className="text-primary-text">Delete Department</DialogTitle>
            <DialogDescription className="text-secondary-text">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-red-500">{selectedDepartment?.name || 'this department'}</span>? This action
              cannot be undone. The department can only be deleted if it has no
              faculties, students, programs, or courses.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedDepartment(null);
              }}
              disabled={isDeleting}
              className="border-card-border transition-all"
              style={{
                color: isDarkMode ? 'var(--white)' : 'var(--gray-900)',
              }}
              onMouseEnter={(e) => {
                if (!isDeleting) {
                  e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                  e.currentTarget.style.color = isDarkMode ? 'var(--white)' : 'var(--gray-900)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = isDarkMode ? 'var(--white)' : 'var(--gray-900)';
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDepartment}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Department'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Admin Modal */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="bg-card border-card-border">
          <DialogHeader>
            <DialogTitle className="text-primary-text">Assign Admin to Department</DialogTitle>
            <DialogDescription className="text-secondary-text">
              Select an admin user to assign to{' '}
              <span className="font-semibold text-primary-text">{selectedDepartment?.name || 'this department'}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin" className="text-primary-text">Select Admin *</Label>
              <Select
                value={selectedAdminId}
                onValueChange={setSelectedAdminId}
                disabled={loadingAdmins}
              >
                <SelectTrigger className="bg-card border-card-border text-primary-text">
                  <SelectValue placeholder="Select an admin user" />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  {adminUsers.length === 0 ? (
                    <SelectItem value="none" disabled className="text-secondary-text">
                      No admin users available
                    </SelectItem>
                  ) : (
                    adminUsers
                      .filter((admin) => admin.status === 'active')
                      .map((admin) => (
                        <SelectItem
                          key={admin.id}
                          value={admin.id.toString()}
                          className="text-primary-text hover:bg-card/50"
                        >
                          {admin.name} ({admin.email})
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
              {adminUsers.length === 0 && (
                <p className="text-sm text-secondary-text">
                  No admin users found. Please create admin users first.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAssignModal(false);
                setSelectedDepartment(null);
                setSelectedAdminId('');
              }}
              className="border-card-border transition-all"
              style={{
                color: isDarkMode ? 'var(--white)' : 'var(--gray-900)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                e.currentTarget.style.color = isDarkMode ? 'var(--white)' : 'var(--gray-900)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = isDarkMode ? 'var(--white)' : 'var(--gray-900)';
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignAdmin}
              disabled={isAssigning || !selectedAdminId || loadingAdmins}
              className="text-white"
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
              {isAssigning ? 'Assigning...' : 'Assign Admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
