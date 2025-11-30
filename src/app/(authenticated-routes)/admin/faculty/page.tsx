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
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  
  const router = useRouter();
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchFaculties();
  }, [search, statusFilter]);

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

  if (!mounted || loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center text-secondary-text">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary-text">Department Faculty</h1>
          <p className="text-secondary-text">
            Manage faculty members in your department
          </p>
        </div>
        <Button onClick={() => router.push('/admin/faculty/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Faculty
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Faculty Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-text" />
                <Input
                  placeholder="Search faculty..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border border-card-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faculties.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No faculty members found
                    </TableCell>
                  </TableRow>
                ) : (
                  faculties.map((faculty) => (
                    <TableRow key={faculty.id}>
                      <TableCell>{faculty.employeeId || 'N/A'}</TableCell>
                      <TableCell>
                        {faculty.user.first_name} {faculty.user.last_name}
                      </TableCell>
                      <TableCell>{faculty.user.email}</TableCell>
                      <TableCell>{faculty.designation || 'N/A'}</TableCell>
                      <TableCell>
                        {faculty.department.name} ({faculty.department.code})
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(faculty.user.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(`/admin/faculty/${faculty.id}`)
                            }
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(`/admin/faculty/${faculty.id}/edit`)
                            }
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedFaculty(faculty);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
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
        </CardContent>
      </Card>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Faculty</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              {selectedFaculty
                ? `${selectedFaculty.user.first_name} ${selectedFaculty.user.last_name}`
                : 'this faculty member'}
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
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

