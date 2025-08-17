'use client';

import { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Eye, Edit, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Faculty {
  id: number;
  employeeId: string;
  designation: string;
  status: 'active' | 'inactive';
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string | null;
  };
  department: {
    id: number;
    name: string;
    code: string;
  };
  _count: {
    sections: number;
    courses: number;
  };
}

interface Department {
  id: number;
  name: string;
  code: string;
}

export default function DepartmentFacultyPage() {
  const router = useRouter();
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchFaculty();
  }, [searchQuery, statusFilter, departmentFilter, page]);

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (searchQuery) queryParams.append('search', searchQuery);
      if (statusFilter && statusFilter !== 'all')
        queryParams.append('status', statusFilter);
      if (departmentFilter && departmentFilter !== 'all')
        queryParams.append('departmentId', departmentFilter);

      const response = await fetch(
        `/api/department/faculty?${queryParams.toString()}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch faculty');
      }
      const data = await response.json();
      if (data.success) {
        setFaculty(data.data);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching faculty:', error);
      toast.error('Failed to fetch faculty');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedFaculty) return;

    try {
      setDeleting(true);
      const response = await fetch(
        `/api/department/faculty/${selectedFaculty.id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete faculty');
      }

      toast.success('Faculty deleted successfully');
      setShowDeleteDialog(false);
      setSelectedFaculty(null);
      fetchFaculty();
    } catch (error) {
      console.error('Error deleting faculty:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete faculty'
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (
    facultyId: number,
    newStatus: 'active' | 'inactive'
  ) => {
    try {
      const response = await fetch(
        `/api/department/faculty/${facultyId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update status');
      }

      toast.success('Faculty status updated successfully');
      fetchFaculty();
    } catch (error) {
      console.error('Error updating faculty status:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update status'
      );
    }
  };

  const filteredFaculty = faculty.filter((member) => {
    const matchesSearch =
      member.user.first_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      member.user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.designation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || member.status === statusFilter;
    const matchesDepartment =
      departmentFilter === 'all' ||
      member.department.id.toString() === departmentFilter;

    return matchesSearch && matchesStatus && matchesDepartment;
  });

  return (
    <div className='container mx-auto py-6 space-y-6'>
      <div className='flex justify-between items-center'>
        <h1 className='text-3xl font-bold'>Department Faculty</h1>
        <Button onClick={() => router.push('/department/faculty/new')}>
          <UserPlus className='mr-2 h-4 w-4' />
          Add Faculty
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <Input
              placeholder='Search faculty...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='max-w-sm'
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder='Filter by status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Status</SelectItem>
                <SelectItem value='active'>Active</SelectItem>
                <SelectItem value='inactive'>Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={departmentFilter}
              onValueChange={setDepartmentFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder='Filter by department' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Faculty Table */}
      <Card>
        <CardHeader>
          <CardTitle>Faculty Members</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='text-center py-8'>Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFaculty.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className='font-medium'>
                      {member.employeeId}
                    </TableCell>
                    <TableCell>
                      {member.user.first_name} {member.user.last_name}
                    </TableCell>
                    <TableCell>{member.user.email}</TableCell>
                    <TableCell>{member.designation}</TableCell>
                    <TableCell>{member.department.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          member.status === 'active' ? 'default' : 'secondary'
                        }
                      >
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center space-x-2'>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() =>
                            router.push(`/department/faculty/${member.id}`)
                          }
                        >
                          <Eye className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() =>
                            router.push(`/department/faculty/${member.id}/edit`)
                          }
                        >
                          <Edit className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => {
                            setSelectedFaculty(member);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              faculty member "{selectedFaculty?.user.first_name}{' '}
              {selectedFaculty?.user.last_name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className='bg-red-600 hover:bg-red-700'
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
