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
import { Plus, Search, Eye, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Student {
  id: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  rollNumber: string;
  batch: {
    id: string;
    name: string;
  } | null;
  status: 'active' | 'inactive';
  currentStudents: number;
}

export default function StudentsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [batches, setBatches] = useState<{ id: string; name: string }[]>([]);
  const [batchFilter, setBatchFilter] = useState<string>('all');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [page, statusFilter, batchFilter]);

  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/batches?status=active');
      if (!response.ok) {
        throw new Error('Failed to fetch batches');
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch batches');
      }
      setBatches(data.data);
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to fetch batches'
      );
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        status: statusFilter !== 'all' ? statusFilter : '',
        batchId: batchFilter !== 'all' ? batchFilter : '',
        search: searchQuery,
      });

      const response = await fetch(`/api/students?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch students');
      }
      setStudents(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to fetch students'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  const handleEdit = (student: Student) => {
    router.push(`/admin/students/${student.id}`);
  };

  const handleDelete = async () => {
    if (!selectedStudent) return;
    setDeleting(true);

    try {
      const response = await fetch(`/api/students/${selectedStudent.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete student');
      }

      toast.success('Student deleted successfully');
      setShowDeleteDialog(false);
      setSelectedStudent(null);
      fetchStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete student'
      );
    } finally {
      setDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-[var(--success-green)] text-white';
      case 'inactive':
        return 'bg-[var(--gray-500)] text-white';
      default:
        return 'bg-[var(--gray-500)] text-white';
    }
  };

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-3">
          <div 
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: primaryColor }}
          />
          <p className="text-xs text-secondary-text">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-lg font-bold text-primary-text'>Students</h1>
          <p className='text-xs text-secondary-text mt-0.5'>
            Manage student accounts and information
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs border-card-border bg-transparent"
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
            onClick={() => router.push('/admin/students/bulk-import')}
          >
            Bulk Import
          </Button>
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
            onClick={() => router.push('/admin/students/create')}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Student
          </Button>
        </div>
      </div>

      <div className='flex items-center gap-3'>
        <form
          onSubmit={handleSearch}
          className='flex-1 flex items-center gap-4'
        >
          <div className='relative flex-1'>
            <Search className='absolute left-2 top-2 h-3.5 w-3.5 text-muted-text' />
            <Input
              placeholder='Search students...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-7 h-8 text-xs bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary'
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className='w-[140px] h-8 text-xs bg-card border-card-border text-primary-text'>
              <SelectValue placeholder='Filter by status' />
            </SelectTrigger>
            <SelectContent className="bg-card border-card-border">
              <SelectItem value='all' className="text-primary-text hover:bg-card/50">All Status</SelectItem>
              <SelectItem value='active' className="text-primary-text hover:bg-card/50">Active</SelectItem>
              <SelectItem value='inactive' className="text-primary-text hover:bg-card/50">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={batchFilter}
            onValueChange={(value) => {
              setBatchFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className='w-[140px] h-8 text-xs bg-card border-card-border text-primary-text'>
              <SelectValue placeholder='Filter by batch' />
            </SelectTrigger>
            <SelectContent className="bg-card border-card-border">
              <SelectItem value='all' className="text-primary-text hover:bg-card/50">All Batches</SelectItem>
              {batches.map((batch) => (
                <SelectItem key={batch.id} value={batch.id} className="text-primary-text hover:bg-card/50">
                  {batch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            type='submit' 
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
          >
            Search
          </Button>
        </form>
      </div>

      <div className='rounded-lg border border-card-border bg-card overflow-hidden'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold text-primary-text h-9 py-2">Roll Number</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text h-9 py-2">Name</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text h-9 py-2">Email</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text h-9 py-2">Batch</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text h-9 py-2">Sections</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text h-9 py-2">Status</TableHead>
              <TableHead className='text-right text-xs font-semibold text-primary-text h-9 py-2'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className='text-center text-xs text-secondary-text py-6'>
                  No students found
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => (
                <TableRow key={student.id} className="hover:bg-hover-bg transition-colors">
                  <TableCell className="text-xs text-primary-text py-2">{student.rollNumber}</TableCell>
                  <TableCell className="text-xs text-primary-text py-2">
                    {student.user.firstName} {student.user.lastName}
                  </TableCell>
                  <TableCell className="text-xs text-secondary-text py-2">{student.user.email}</TableCell>
                  <TableCell className="text-xs text-secondary-text py-2">{student.batch?.name || 'No Batch'}</TableCell>
                  <TableCell className="text-xs text-secondary-text py-2">{student.currentStudents}</TableCell>
                  <TableCell className="py-2">
                    <Badge
                      className={`${getStatusColor(student.status)} text-[10px] px-1.5 py-0.5`}
                      variant='secondary'
                    >
                      {student.status.charAt(0).toUpperCase() +
                        student.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-right py-2'>
                    <div className='flex justify-end gap-1'>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-7 w-7 border-card-border bg-transparent'
                        style={{
                          color: isDarkMode ? '#ffffff' : '#111827',
                          borderColor: isDarkMode ? '#404040' : '#e5e7eb',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';
                          e.currentTarget.style.color = primaryColor;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = isDarkMode ? '#ffffff' : '#111827';
                        }}
                        onClick={() => handleEdit(student)}
                      >
                        <Eye className='h-3.5 w-3.5' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-7 w-7 border-card-border bg-transparent'
                        style={{
                          color: isDarkMode ? '#ffffff' : '#111827',
                          borderColor: isDarkMode ? '#404040' : '#e5e7eb',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#dc2626';
                          e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = isDarkMode ? '#ffffff' : '#111827';
                        }}
                        onClick={() => {
                          setSelectedStudent(student);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className='h-3.5 w-3.5' />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className='flex items-center justify-end gap-2'>
          <Button
            variant='outline'
            size='sm'
            className='h-7 text-xs border-card-border bg-transparent'
            style={{
              color: isDarkMode ? '#ffffff' : '#111827',
              borderColor: isDarkMode ? '#404040' : '#e5e7eb',
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';
                e.currentTarget.style.borderColor = primaryColor;
                e.currentTarget.style.color = primaryColor;
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = isDarkMode ? '#404040' : '#e5e7eb';
                e.currentTarget.style.color = isDarkMode ? '#ffffff' : '#111827';
              }
            }}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className='text-[10px] text-secondary-text'>
            Page {page} of {totalPages}
          </span>
          <Button
            variant='outline'
            size='sm'
            className='h-7 text-xs border-card-border bg-transparent'
            style={{
              color: isDarkMode ? '#ffffff' : '#111827',
              borderColor: isDarkMode ? '#404040' : '#e5e7eb',
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';
                e.currentTarget.style.borderColor = primaryColor;
                e.currentTarget.style.color = primaryColor;
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = isDarkMode ? '#404040' : '#e5e7eb';
                e.currentTarget.style.color = isDarkMode ? '#ffffff' : '#111827';
              }
            }}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-card border-card-border p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Delete Student</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Are you sure you want to delete this student? This action cannot
              be undone.
              {selectedStudent && selectedStudent.currentStudents > 0 && (
                <span className='block text-[var(--error)] mt-2 text-[10px]'>
                  Warning: This student is enrolled in{' '}
                  {selectedStudent.currentStudents} section(s). You must remove
                  them from all sections before deleting.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant='outline'
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
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
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
              disabled={deleting || (selectedStudent?.currentStudents ?? 0) > 0}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
