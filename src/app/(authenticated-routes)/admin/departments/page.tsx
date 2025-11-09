'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, Eye, Building2 } from 'lucide-react';
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

interface Department {
  id: number;
  name: string;
  code: string;
  description: string | null;
  status: string;
  hod: {
    id: number;
    name: string;
    email: string;
  } | null;
  stats: {
    programs: number;
    faculties: number;
    students: number;
  };
}

export default function DepartmentsPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    fetchDepartments();
  }, [search, status, page]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (search) params.append('searchQuery', search);
      if (status && status !== 'all') params.append('status', status);

      const response = await fetch(`/api/departments?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }
      const data = await response.json();
      if (data.success) {
        setDepartments(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        throw new Error(data.error || 'Failed to fetch departments');
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      if (!formData.name || !formData.code) {
        toast.error('Name and code are required');
        return;
      }

      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Department created successfully');
        setIsCreateDialogOpen(false);
        setFormData({
          name: '',
          code: '',
          description: '',
          status: 'active',
        });
        fetchDepartments();
      } else {
        toast.error(data.error || 'Failed to create department');
      }
    } catch (error) {
      console.error('Error creating department:', error);
      toast.error('Failed to create department');
    }
  };

  const handleEdit = async () => {
    if (!selectedDepartment) return;

    try {
      const response = await fetch(
        `/api/departments/${selectedDepartment.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success('Department updated successfully');
        setIsEditDialogOpen(false);
        setSelectedDepartment(null);
        setFormData({
          name: '',
          code: '',
          description: '',
          status: 'active',
        });
        fetchDepartments();
      } else {
        toast.error(data.error || 'Failed to update department');
      }
    } catch (error) {
      console.error('Error updating department:', error);
      toast.error('Failed to update department');
    }
  };

  const handleDelete = async () => {
    if (!selectedDepartment) return;

    try {
      const response = await fetch(
        `/api/departments/${selectedDepartment.id}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success('Department deleted successfully');
        setIsDeleteDialogOpen(false);
        setSelectedDepartment(null);
        fetchDepartments();
      } else {
        toast.error(data.error || 'Failed to delete department');
      }
    } catch (error) {
      console.error('Error deleting department:', error);
      toast.error('Failed to delete department');
    }
  };

  const handleEditClick = (department: Department) => {
    setSelectedDepartment(department);
    setFormData({
      name: department.name,
      code: department.code,
      description: department.description || '',
      status: department.status as 'active' | 'inactive',
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (department: Department) => {
    setSelectedDepartment(department);
    setIsDeleteDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Departments
          </h1>
          <p className="text-muted-foreground">
            Manage academic departments and their details
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Department
        </Button>
      </div>

      <Card className="p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
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
          <div className="flex gap-4">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>HOD</TableHead>
              <TableHead>Programs</TableHead>
              <TableHead>Faculty</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : departments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center">
                  No departments found
                </TableCell>
              </TableRow>
            ) : (
              departments.map((department) => (
                <TableRow key={department.id}>
                  <TableCell>{department.id}</TableCell>
                  <TableCell className="font-medium">
                    {department.name}
                  </TableCell>
                  <TableCell>{department.code}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {department.description || '-'}
                  </TableCell>
                  <TableCell>
                    {department.hod ? (
                      <div>
                        <div className="font-medium">{department.hod.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {department.hod.email}
                        </div>
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{department.stats.programs}</TableCell>
                  <TableCell>{department.stats.faculties}</TableCell>
                  <TableCell>{department.stats.students}</TableCell>
                  <TableCell>{getStatusBadge(department.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/admin/departments/${department.id}`)
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(department)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(department)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Department</DialogTitle>
            <DialogDescription>
              Add a new academic department to the system
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Department Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Computer Science"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="code">Department Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                placeholder="e.g., CS"
                maxLength={10}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Department description (optional)"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive') =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>Update department information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Department Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Computer Science"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-code">Department Code *</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                placeholder="e.g., CS"
                maxLength={10}
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Code cannot be changed after creation
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Department description (optional)"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive') =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Department</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <strong>{selectedDepartment?.name}</strong>? This action cannot be
              undone. All associated programs, courses, faculty, and students
              will be affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
