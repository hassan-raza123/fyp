'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
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

export default function SuperAdminDashboard() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
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
    fetchDepartments();
    fetchAdminUsers();
  }, []);

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

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Super Admin Overview
          </h1>
          <p className="text-muted-foreground">
            High-level snapshot of departments and admin users.
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Departments
            </CardTitle>
            <CardDescription>Total departments in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{departments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Admin Users
            </CardTitle>
            <CardDescription>Active admin accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {adminUsers.filter((a) => a.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              Assigned Departments
            </CardTitle>
            <CardDescription>Departments with admin assigned</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {departments.filter((d) => d.admin).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Unassigned Departments
            </CardTitle>
            <CardDescription>No admin mapped yet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {departments.filter((d) => !d.admin).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick list of departments (read‑only preview) */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Departments</CardTitle>
          <CardDescription>
            Quick preview of departments and their admins. Full management in
            the Departments module.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search departments..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Stats</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepartments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      No departments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDepartments.slice(0, 5).map((dept) => (
                    <TableRow key={dept.id}>
                      <TableCell className="font-medium">{dept.code}</TableCell>
                      <TableCell>{dept.name}</TableCell>
                      <TableCell>
                        {dept.admin ? (
                          <div>
                            <div className="font-medium">{dept.admin.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {dept.admin.email}
                            </div>
                          </div>
                        ) : (
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <AlertCircle className="h-4 w-4" />
                            No admin
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-1 text-muted-foreground">
                          <div>Fac: {dept.counts.faculties}</div>
                          <div>Std: {dept.counts.students}</div>
                          <div>Prog: {dept.counts.programs}</div>
                          <div>Cr: {dept.counts.courses}</div>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Department</DialogTitle>
            <DialogDescription>
              Add a new department to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Department Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Computer Science"
                value={newDepartment.name}
                onChange={(e) =>
                  setNewDepartment({ ...newDepartment, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Department Code *</Label>
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
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
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateDepartment} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Department'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Department Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>
              Update department information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Department Name *</Label>
              <Input
                id="edit-name"
                placeholder="e.g., Computer Science"
                value={editDepartment.name}
                onChange={(e) =>
                  setEditDepartment({ ...editDepartment, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-code">Department Code *</Label>
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
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
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateDepartment} disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Update Department'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Department Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Department</DialogTitle>
            <DialogDescription>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Admin to Department</DialogTitle>
            <DialogDescription>
              Select an admin user to assign to{' '}
              {selectedDepartment?.name || 'this department'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin">Select Admin *</Label>
              <Select
                value={selectedAdminId}
                onValueChange={setSelectedAdminId}
                disabled={loadingAdmins}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an admin user" />
                </SelectTrigger>
                <SelectContent>
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
                        >
                          {admin.name} ({admin.email})
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
              {adminUsers.length === 0 && (
                <p className="text-sm text-muted-foreground">
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
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignAdmin}
              disabled={isAssigning || !selectedAdminId || loadingAdmins}
            >
              {isAssigning ? 'Assigning...' : 'Assign Admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

