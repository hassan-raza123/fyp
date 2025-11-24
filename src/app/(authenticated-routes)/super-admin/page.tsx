'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import {
  Building2,
  Users,
  Plus,
  Edit,
  Search,
  Shield,
  CheckCircle,
  AlertCircle,
  Calendar,
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

interface DashboardData {
  stats: {
    totalDepartments: number;
    totalAdmins: number;
    assignedDepartments: number;
    unassignedDepartments: number;
  };
  recentActivities: Array<{
    id: string;
    summary: string;
    createdAt: string;
    user: string;
    userRole: string;
    userEmail: string;
  }>;
  currentSemester: {
    name: string;
    startDate: string;
    endDate: string;
  } | null;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  isDarkMode?: boolean;
}

const StatCard = ({ title, value, icon, isDarkMode = false }: StatCardProps) => {
  const iconBgColor = isDarkMode 
    ? 'rgba(252, 153, 40, 0.1)' // Orange opacity for dark mode
    : 'rgba(38, 40, 149, 0.1)'; // Blue opacity for light mode
  const iconColor = isDarkMode 
    ? 'var(--orange)' 
    : 'var(--blue)';
  
  return (
    <div 
      className="rounded-xl p-4 shadow-sm border bg-card border-card-border transition-colors"
    >
      <div className="flex items-center justify-between">
        <div>
          <p 
            className="text-xs font-medium text-secondary-text"
          >
            {title}
          </p>
          <h3 
            className="text-xl font-bold mt-1 text-primary-text"
          >
            {value}
          </h3>
        </div>
        <div 
          className="p-2 rounded-lg"
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

interface ActivityItemProps {
  summary: string;
  user: string;
  userRole: string;
  time: string;
  icon: React.ReactNode;
  isDarkMode?: boolean;
}

const ActivityItem = ({ summary, user, userRole, time, icon, isDarkMode = false }: ActivityItemProps) => {
  const iconBgColor = isDarkMode 
    ? 'rgba(252, 153, 40, 0.1)' 
    : 'rgba(38, 40, 149, 0.1)';
  const iconColor = isDarkMode 
    ? 'var(--orange)' 
    : 'var(--blue)';
  const hoverBg = isDarkMode 
    ? 'rgba(252, 153, 40, 0.05)' 
    : 'rgba(38, 40, 149, 0.05)';
  
  return (
    <div 
      className="flex items-start space-x-3 p-3 rounded-lg transition-colors"
      style={{ 
        '--hover-bg': hoverBg,
      } as React.CSSProperties & { '--hover-bg': string }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = hoverBg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <div 
        className="p-1.5 rounded-lg shrink-0"
        style={{ backgroundColor: iconBgColor }}
      >
        <div style={{ color: iconColor, width: '16px', height: '16px' }}>
          {icon}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p 
          className="text-sm font-medium text-primary-text"
        >
          {summary}
        </p>
        <p 
          className="text-xs mt-0.5 text-secondary-text"
        >
          By {user} ({userRole})
        </p>
        <p 
          className="text-xs mt-1 text-muted-text"
        >
          {time}
        </p>
      </div>
    </div>
  );
};

// This is now the only (overview) component for /super-admin
export default function SuperAdminDashboard() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

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
    fetchDepartments();
    fetchAdminUsers();
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setDashboardLoading(true);
      const response = await fetch('/api/super-admin/overview', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setDashboardLoading(false);
    }
  };

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
        // Format admin users for selection
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
    setSelectedDepartment(dept);
    setEditDepartment({
      name: dept.name,
      code: dept.code,
      description: dept.description || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateDepartment = async () => {
    if (!selectedDepartment || !editDepartment.name.trim() || !editDepartment.code.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/departments/${selectedDepartment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: editDepartment.name.trim(),
          code: editDepartment.code.trim(),
          description: editDepartment.description.trim() || null,
        }),
      });

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
    if (!selectedDepartment) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/departments/${selectedDepartment.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

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
    if (!selectedDepartment || !selectedAdminId) {
      toast.error('Please select a department and admin');
      return;
    }

    setIsAssigning(true);
    try {
      const response = await fetch('/api/super-admin/assign-admin-to-department', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: parseInt(selectedAdminId),
          departmentId: selectedDepartment.id,
        }),
      });

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

  if (!mounted || loading || dashboardLoading) {
    return (
      <div 
        className="flex items-center justify-center min-h-screen bg-page"
      >
        <div 
          className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
          style={{ 
            borderTopColor: isDarkMode ? 'var(--orange)' : 'var(--blue)',
            borderBottomColor: isDarkMode ? 'var(--orange)' : 'var(--blue)',
          }}
        ></div>
      </div>
    );
  }

  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const primaryColorDark = isDarkMode ? 'var(--orange-dark)' : 'var(--blue-dark)';
  
  return (
    <div 
      className="container mx-auto py-6 space-y-4 min-h-screen bg-page text-page"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 
            className="text-xl font-bold flex items-center gap-2 text-primary-text"
          >
            <Shield className="h-5 w-5" style={{ color: primaryColor }} />
            Super Admin Dashboard
          </h1>
          <p 
            className="text-sm mt-0.5 text-secondary-text"
          >
            System-wide overview and analytics
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => setShowCreateModal(true)}
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
            className="transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Department
          </Button>
        </div>
      </div>

      {/* Main Stats Grid */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Departments"
            value={dashboardData.stats.totalDepartments}
            icon={<Building2 className="w-5 h-5" />}
            isDarkMode={isDarkMode}
          />
          <StatCard
            title="Active Admins"
            value={dashboardData.stats.totalAdmins}
            icon={<Shield className="w-5 h-5" />}
            isDarkMode={isDarkMode}
          />
          <StatCard
            title="Assigned Departments"
            value={dashboardData.stats.assignedDepartments}
            icon={<CheckCircle className="w-5 h-5" />}
            isDarkMode={isDarkMode}
          />
          <StatCard
            title="Unassigned Departments"
            value={dashboardData.stats.unassignedDepartments}
            icon={<AlertCircle className="w-5 h-5" />}
            isDarkMode={isDarkMode}
          />
        </div>
      )}

      {/* Main Content Grid */}
      {dashboardData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent Activity */}
          <div 
            className="lg:col-span-2 rounded-xl shadow-sm border bg-card border-card-border"
          >
            <div 
              className="p-4 border-b border-card-border"
            >
              <h2 
                className="text-base font-semibold text-primary-text"
              >
                Recent Activity
              </h2>
            </div>
            <div 
              className="divide-y divide-card-border max-h-[400px] overflow-y-auto"
            >
              {dashboardData.recentActivities.length === 0 ? (
                <div 
                  className="p-6 text-center text-muted-text"
                >
                  No recent activity.
                </div>
              ) : (
                dashboardData.recentActivities.map((activity) => (
                  <ActivityItem
                    key={activity.id}
                    summary={activity.summary}
                    user={activity.user}
                    userRole={activity.userRole}
                    time={new Date(activity.createdAt).toLocaleString()}
                    icon={<Users className="w-4 h-4" />}
                    isDarkMode={isDarkMode}
                  />
                ))
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <div 
              className="rounded-xl shadow-sm border p-4 bg-card border-card-border"
            >
              <h2 
                className="text-base font-semibold mb-3 text-primary-text"
              >
                Quick Info
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar 
                      className="w-4 h-4" 
                      style={{ color: primaryColor }} 
                    />
                    <span 
                      className="text-xs text-secondary-text"
                    >
                      Current Semester
                    </span>
                  </div>
                  <span 
                    className="text-xs font-medium text-primary-text"
                  >
                    {dashboardData.currentSemester
                      ? dashboardData.currentSemester.name
                      : 'No active semester'}
                  </span>
                </div>
              </div>
            </div>

            <div
              className="rounded-xl shadow-sm p-4 text-white"
              style={{
                background: `linear-gradient(to bottom right, ${primaryColor}, ${primaryColorDark})`,
              }}
            >
              <h2 className="text-base font-semibold mb-2">System Overview</h2>
              <p className="text-xs opacity-90 mb-3">
                Manage departments, admins, and system-wide settings
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="opacity-90">Departments</span>
                  <span className="font-semibold">
                    {dashboardData.stats.totalDepartments}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="opacity-90">Admins</span>
                  <span className="font-semibold">
                    {dashboardData.stats.totalAdmins}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="opacity-90">Assigned</span>
                  <span className="font-semibold">
                    {dashboardData.stats.assignedDepartments}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="opacity-90">Unassigned</span>
                  <span className="font-semibold">
                    {dashboardData.stats.unassignedDepartments}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Departments Overview */}
      <Card className="bg-card border-card-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base text-primary-text">
                Departments Overview
              </CardTitle>
              <CardDescription className="text-xs mt-1 text-secondary-text">
                Quick preview of departments and their assigned admins. Full management available in the Departments module.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/super-admin/departments'}
              className="text-xs h-8"
              style={{
                borderColor: primaryColor,
                color: primaryColor,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDarkMode 
                  ? 'rgba(252, 153, 40, 0.1)' 
                  : 'rgba(38, 40, 149, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-3 mb-3">
            <div className="flex-1">
              <div className="relative">
                <Search 
                  className="absolute left-2 top-2.5 h-3.5 w-3.5" 
                  style={{ color: 'var(--text-muted)' }}
                />
                <Input
                  placeholder="Search departments..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9 text-sm bg-page border-page text-page"
                />
              </div>
            </div>
          </div>

          <div className="rounded-md border bg-card border-card-border">
            <Table>
              <TableHeader>
                <TableRow className="border-card-border">
                  <TableHead className="text-xs h-9 text-secondary-text">
                    Code
                  </TableHead>
                  <TableHead className="text-xs h-9 text-secondary-text">
                    Name
                  </TableHead>
                  <TableHead className="text-xs h-9 text-secondary-text">
                    Admin
                  </TableHead>
                  <TableHead className="text-xs h-9 text-secondary-text">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepartments.length === 0 ? (
                  <TableRow className="border-card-border">
                    <TableCell 
                      colSpan={4} 
                      className="text-center py-6 text-sm text-muted-text"
                    >
                      No departments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDepartments.slice(0, 5).map((dept) => (
                    <TableRow 
                      key={dept.id} 
                      className="h-10 border-card-border hover:bg-accent/5"
                    >
                      <TableCell className="font-medium text-xs text-primary-text">
                        {dept.code}
                      </TableCell>
                      <TableCell className="text-xs text-primary-text">
                        {dept.name}
                      </TableCell>
                      <TableCell className="text-xs">
                        {dept.admin ? (
                          <div>
                            <div className="font-medium text-primary-text">
                              {dept.admin.name}
                            </div>
                            <div className="text-xs text-muted-text">
                              {dept.admin.email}
                            </div>
                          </div>
                        ) : (
                          <span 
                            className="flex items-center gap-1 text-xs" 
                            style={{ color: isDarkMode ? 'var(--orange)' : 'var(--orange-dark)' }}
                          >
                            <AlertCircle className="h-3.5 w-3.5" />
                            Unassigned
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={dept.status === 'active' ? 'default' : 'secondary'}
                          className="text-xs h-5"
                          style={
                            dept.status === 'active'
                              ? {
                                  backgroundColor: primaryColor,
                                  color: 'white',
                                }
                              : {
                                  backgroundColor: isDarkMode 
                                    ? 'rgba(252, 153, 40, 0.2)' 
                                    : 'rgba(38, 40, 149, 0.1)',
                                  color: primaryColor,
                                }
                          }
                        >
                          {dept.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {filteredDepartments.length > 5 && (
            <div className="mt-3 text-center">
              <Button
                variant="link"
                onClick={() => window.location.href = '/super-admin/departments'}
                className="text-xs h-auto p-0"
                style={{ color: primaryColor }}
              >
                View all {filteredDepartments.length} departments →
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Department Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-card border-card-border">
          <DialogHeader>
            <DialogTitle className="text-primary-text">
              Create New Department
            </DialogTitle>
            <DialogDescription className="text-secondary-text">
              Add a new department to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-primary-text">
                Department Name *
              </Label>
              <Input
                id="name"
                placeholder="e.g., Computer Science"
                value={newDepartment.name}
                onChange={(e) =>
                  setNewDepartment({ ...newDepartment, name: e.target.value })
                }
                className="bg-page border-page text-page"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code" className="text-primary-text">
                Department Code *
              </Label>
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
                className="bg-page border-page text-page"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-primary-text">
                Description
              </Label>
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
                className="bg-page border-page text-page"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              className="border-card-border text-primary-text"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateDepartment} 
              disabled={isCreating}
              style={{
                backgroundColor: primaryColor,
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
            <DialogTitle className="text-primary-text">
              Edit Department
            </DialogTitle>
            <DialogDescription className="text-secondary-text">
              Update department information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-primary-text">
                Department Name *
              </Label>
              <Input
                id="edit-name"
                placeholder="e.g., Computer Science"
                value={editDepartment.name}
                onChange={(e) =>
                  setEditDepartment({ ...editDepartment, name: e.target.value })
                }
                className="bg-page border-page text-page"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-code" className="text-primary-text">
                Department Code *
              </Label>
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
                className="bg-page border-page text-page"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-primary-text">
                Description
              </Label>
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
                className="bg-page border-page text-page"
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
              className="border-card-border text-primary-text"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateDepartment} 
              disabled={isUpdating}
              style={{
                backgroundColor: primaryColor,
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
            <DialogTitle className="text-primary-text">
              Delete Department
            </DialogTitle>
            <DialogDescription className="text-secondary-text">
              Are you sure you want to delete{' '}
              {selectedDepartment?.name || 'this department'}? This action
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
              className="border-card-border text-primary-text"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDepartment}
              disabled={isDeleting}
              style={{
                backgroundColor: 'var(--error)',
                color: 'white',
              }}
              onMouseEnter={(e) => {
                if (!isDeleting) {
                  e.currentTarget.style.backgroundColor = 'var(--error-dark)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isDeleting) {
                  e.currentTarget.style.backgroundColor = 'var(--error)';
                }
              }}
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
            <DialogTitle className="text-primary-text">
              Assign Admin to Department
            </DialogTitle>
            <DialogDescription className="text-secondary-text">
              Select an admin user to assign to{' '}
              {selectedDepartment?.name || 'this department'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin" className="text-primary-text">
                Select Admin *
              </Label>
              <Select
                value={selectedAdminId}
                onValueChange={setSelectedAdminId}
                disabled={loadingAdmins}
              >
                <SelectTrigger className="bg-page border-page text-page">
                  <SelectValue placeholder="Select an admin user" />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  {adminUsers.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No admin users available
                    </SelectItem>
                  ) : (
                    adminUsers
                      .filter((admin) => admin.status === 'active')
                      .map((admin) => (
                        <SelectItem
                          key={admin.id}
                          value={admin.id.toString()}
                          className="text-primary-text"
                        >
                          {admin.name} ({admin.email})
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
              {adminUsers.length === 0 && (
                <p className="text-sm text-muted-text">
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
              className="border-card-border text-primary-text"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignAdmin}
              disabled={isAssigning || !selectedAdminId || loadingAdmins}
              style={{
                backgroundColor: primaryColor,
                color: 'white',
              }}
              onMouseEnter={(e) => {
                if (!isAssigning && selectedAdminId && !loadingAdmins) {
                  e.currentTarget.style.backgroundColor = primaryColorDark;
                }
              }}
              onMouseLeave={(e) => {
                if (!isAssigning && selectedAdminId && !loadingAdmins) {
                  e.currentTarget.style.backgroundColor = primaryColor;
                }
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

