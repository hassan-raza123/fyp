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
import { Badge } from '@/components/ui/badge';
import {
  Pencil,
  Trash2,
  Eye,
  Loader2,
  Plus,
  ArrowUpDown,
  Users,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
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
import { AddDepartmentModal } from './components/AddDepartmentModal';
import { EditDepartmentModal } from './components/EditDepartmentModal';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { AssignAdminModal } from './components/AssignAdminModal';

interface Department {
  id: number;
  name: string;
  code: string;
  description: string | null;
  status: 'active' | 'inactive';
  adminId: number | null;
  createdAt: string;
  updatedAt: string;
  admin: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  _count: {
    programs: number;
    faculty: number;
    students: number;
  };
}

interface ApiResponse {
  success: boolean;
  data: Department[];
  pagination?: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
  error?: string;
}

export default function DepartmentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);
  const [isAssignAdminModalOpen, setIsAssignAdminModalOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  // Sorting state
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<'name' | 'code' | 'status'>(
    'name'
  );

  useEffect(() => {
    fetchDepartments();
  }, [currentPage, sortField, sortDirection, searchQuery, searchField]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        sortField,
        sortDirection,
        searchQuery,
        searchField,
      });

      const response = await fetch(`/api/departments?${queryParams}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch departments');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch departments');
      }

      setDepartments(data.data);
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to fetch departments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSuccess = () => {
    fetchDepartments();
  };

  const handleEditSuccess = () => {
    fetchDepartments();
  };

  const handleDelete = async () => {
    if (!selectedDepartment) return;

    setDeleteLoading(selectedDepartment.id);
    try {
      const response = await fetch(
        `/api/departments/${selectedDepartment.id}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!data.success) {
        if (data.details) {
          // Handle case where department has related data
          const details = data.details;
          const message = `Cannot delete department because it has:
            ${details.programs} program(s)
            ${details.faculty} faculty member(s)
            ${details.students} student(s)
            Please remove all related data first.`;
          throw new Error(message);
        }
        throw new Error(data.error || 'Failed to delete department');
      }

      toast({
        title: 'Success',
        description: 'Department deleted successfully',
      });

      // Close dialog and refresh data
      setIsDeleteDialogOpen(false);
      setSelectedDepartment(null);
      fetchDepartments();
    } catch (error) {
      console.error('Error deleting department:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to delete department',
        variant: 'destructive',
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleViewDepartment = (departmentId: number) => {
    router.push(`/admin/departments/${departmentId}`);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page on new search
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-96'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (
    <>
      <div className='container mx-auto py-6'>
        <div className='flex items-center justify-between mb-6'>
          <h1 className='text-2xl font-bold'>Departments</h1>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className='h-4 w-4 mr-2' />
            Add Department
          </Button>
        </div>

        <div className='flex gap-4 mb-6'>
          <div className='flex-1'>
            <Input
              placeholder='Search departments...'
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <Select
            value={searchField}
            onValueChange={(value: 'name' | 'code' | 'status') =>
              setSearchField(value)
            }
          >
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Search by...' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='name'>Name</SelectItem>
              <SelectItem value='code'>Code</SelectItem>
              <SelectItem value='status'>Status</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='border rounded-lg'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant='ghost'
                    onClick={() => handleSort('name')}
                    className='flex items-center gap-1'
                  >
                    Name
                    <ArrowUpDown className='h-4 w-4' />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant='ghost'
                    onClick={() => handleSort('code')}
                    className='flex items-center gap-1'
                  >
                    Code
                    <ArrowUpDown className='h-4 w-4' />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant='ghost'
                    onClick={() => handleSort('status')}
                    className='flex items-center gap-1'
                  >
                    Status
                    <ArrowUpDown className='h-4 w-4' />
                  </Button>
                </TableHead>
                <TableHead>HOD</TableHead>
                <TableHead>
                  <Button
                    variant='ghost'
                    onClick={() => handleSort('programs')}
                    className='flex items-center gap-1'
                  >
                    Programs
                    <ArrowUpDown className='h-4 w-4' />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant='ghost'
                    onClick={() => handleSort('faculty')}
                    className='flex items-center gap-1'
                  >
                    Faculty
                    <ArrowUpDown className='h-4 w-4' />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant='ghost'
                    onClick={() => handleSort('students')}
                    className='flex items-center gap-1'
                  >
                    Students
                    <ArrowUpDown className='h-4 w-4' />
                  </Button>
                </TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((department) => (
                <TableRow key={department.id}>
                  <TableCell className='font-medium'>
                    {department.name}
                  </TableCell>
                  <TableCell>{department.code}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        department.status === 'active' ? 'default' : 'secondary'
                      }
                    >
                      {department.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {department.admin
                      ? `${department.admin.first_name} ${department.admin.last_name}`
                      : 'Not assigned'}
                  </TableCell>
                  <TableCell>{department._count.programs}</TableCell>
                  <TableCell>{department._count.faculty}</TableCell>
                  <TableCell>{department._count.students}</TableCell>
                  <TableCell>
                    {new Date(department.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex justify-end gap-2'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleViewDepartment(department.id)}
                      >
                        <Eye className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => {
                          setSelectedDepartment(department);
                          setIsEditModalOpen(true);
                        }}
                      >
                        <Pencil className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => {
                          setSelectedDepartment(department);
                          setIsAssignAdminModalOpen(true);
                        }}
                      >
                        <Users className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => {
                          setSelectedDepartment(department);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {departments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className='text-center py-8'>
                    No departments found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className='mt-4'>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>

      <AddDepartmentModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      {selectedDepartment && (
        <>
          <EditDepartmentModal
            open={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedDepartment(null);
            }}
            onSuccess={() => {
              setIsEditModalOpen(false);
              setSelectedDepartment(null);
              fetchDepartments();
            }}
            department={selectedDepartment}
          />

          <AssignAdminModal
            open={isAssignAdminModalOpen}
            onClose={() => {
              setIsAssignAdminModalOpen(false);
              setSelectedDepartment(null);
            }}
            onSuccess={() => {
              setIsAssignAdminModalOpen(false);
              setSelectedDepartment(null);
              fetchDepartments();
            }}
            department={selectedDepartment}
          />

          <AlertDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Department</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this department? This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleteLoading === selectedDepartment.id}
                >
                  {deleteLoading === selectedDepartment.id ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    'Delete'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </>
  );
}
