'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
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
import { Plus, Search, Eye, Trash2, Loader2, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const primaryColorDark = isDarkMode ? 'var(--orange-dark)' : 'var(--blue-dark)';
  const iconBgColor = isDarkMode 
    ? 'rgba(252, 153, 40, 0.15)' 
    : 'rgba(38, 40, 149, 0.15)';
  
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoadingStudent, setIsLoadingStudent] = useState(false);
  const [viewingStudent, setViewingStudent] = useState<any>(null);
  const [programs, setPrograms] = useState<{ id: number; name: string; code: string }[]>([]);
  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    email: '',
    rollNumber: '',
    departmentId: '',
    programId: '',
    batchId: '',
    status: 'active' as 'active' | 'inactive',
  });
  const [editStudent, setEditStudent] = useState({
    firstName: '',
    lastName: '',
    email: '',
    rollNumber: '',
    departmentId: '',
    programId: '',
    batchId: '',
    status: 'active' as 'active' | 'inactive',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fetchingPrograms, setFetchingPrograms] = useState(false);
  const [fetchingBatches, setFetchingBatches] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchPrograms(); // Fetch programs without department ID - backend will handle it
  }, []);

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [page, statusFilter, batchFilter]);

  useEffect(() => {
    if (newStudent.programId) {
      fetchBatchesForProgram(newStudent.programId);
    }
  }, [newStudent.programId]);


  const fetchPrograms = async () => {
    try {
      setFetchingPrograms(true);
      // Backend will automatically filter by authenticated user's department
      const response = await fetch('/api/programs', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch programs');
      }
      const data = await response.json();
      if (data.success) {
        setPrograms(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
    } finally {
      setFetchingPrograms(false);
    }
  };

  const fetchBatchesForProgram = async (programId: string) => {
    if (!programId) {
      setBatches([]);
      return;
    }
    try {
      setFetchingBatches(true);
      const response = await fetch(`/api/programs/${programId}/batches`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch batches');
      }
      const data = await response.json();
      if (data.success) {
        setBatches(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to fetch batches');
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch batches');
      setBatches([]);
    } finally {
      setFetchingBatches(false);
    }
  };


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

  const handleViewStudent = async (student: Student) => {
    setSelectedStudent(student);
    setIsLoadingStudent(true);
    setShowViewModal(true);
    try {
      const response = await fetch(`/api/students/${student.id}`);
      if (!response.ok) throw new Error('Failed to fetch student');
      const data = await response.json();
      if (data.success && data.data) {
        setViewingStudent(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch student');
      }
    } catch (error) {
      console.error('Error fetching student:', error);
      toast.error('Failed to load student details');
      setShowViewModal(false);
    } finally {
      setIsLoadingStudent(false);
    }
  };

  const handleEditStudent = async (student: Student) => {
    setSelectedStudent(student);
    setIsLoadingStudent(true);
    setShowEditModal(true);
    try {
      const response = await fetch(`/api/students/${student.id}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch student');
      const data = await response.json();
      if (data.success && data.data) {
        setEditStudent({
          firstName: data.data.user.firstName,
          lastName: data.data.user.lastName,
          email: data.data.user.email,
          rollNumber: data.data.rollNumber,
          departmentId: data.data.department?.id.toString() || '',
          programId: data.data.program?.id.toString() || '',
          batchId: data.data.batch?.id || '',
          status: data.data.status,
        });
        if (data.data.program?.id) {
          await fetchBatchesForProgram(data.data.program.id.toString());
        }
      } else {
        throw new Error(data.error || 'Failed to fetch student');
      }
    } catch (error) {
      console.error('Error fetching student:', error);
      toast.error('Failed to load student details');
      setShowEditModal(false);
    } finally {
      setIsLoadingStudent(false);
    }
  };

  const handleCreateStudent = async () => {
    if (!newStudent.firstName || !newStudent.lastName || !newStudent.email || !newStudent.rollNumber || !newStudent.programId || !newStudent.batchId) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Department ID will be automatically set by backend from authenticated user

    setIsCreating(true);
    setErrors({});
    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...newStudent,
          departmentId: parseInt(newStudent.departmentId),
          programId: parseInt(newStudent.programId),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create student');
      }

      toast.success('Student created successfully');
      setShowCreateModal(false);
      setNewStudent({
        firstName: '',
        lastName: '',
        email: '',
        rollNumber: '',
        departmentId: '',
        programId: '',
        batchId: '',
        status: 'active',
      });
      fetchStudents();
    } catch (error) {
      console.error('Error creating student:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create student');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateStudent = async () => {
    if (!selectedStudent) return;

    if (!editStudent.firstName || !editStudent.lastName || !editStudent.email || !editStudent.rollNumber) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsUpdating(true);
    setErrors({});
    try {
      const response = await fetch(`/api/students/${selectedStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...editStudent,
          departmentId: editStudent.departmentId ? parseInt(editStudent.departmentId) : null,
          programId: editStudent.programId ? parseInt(editStudent.programId) : null,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update student');
      }

      toast.success('Student updated successfully');
      setShowEditModal(false);
      setSelectedStudent(null);
      fetchStudents();
    } catch (error) {
      console.error('Error updating student:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update student');
    } finally {
      setIsUpdating(false);
    }
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
      <div className="flex items-center justify-center min-h-screen bg-page">
        <div className="flex flex-col items-center space-y-3">
          <div 
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
            style={{
              borderTopColor: primaryColor,
              borderBottomColor: primaryColor,
              borderRightColor: 'transparent',
              borderLeftColor: 'transparent',
            }}
          ></div>
          <p className="text-xs text-secondary-text">
            Loading students...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-primary-text">
            Students
          </h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Manage student accounts and information
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/admin/students/bulk-import')}
            className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 border border-card-border bg-transparent"
            style={{
              color: isDarkMode ? '#ffffff' : '#111827',
              borderColor: isDarkMode ? '#404040' : '#e5e7eb',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = iconBgColor;
              e.currentTarget.style.borderColor = primaryColor;
              e.currentTarget.style.color = primaryColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = isDarkMode ? '#404040' : '#e5e7eb';
              e.currentTarget.style.color = isDarkMode ? '#ffffff' : '#111827';
            }}
          >
            Bulk Import
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 flex items-center gap-1.5"
            style={{
              backgroundColor: iconBgColor,
              color: primaryColor,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = iconBgColor;
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Create Student
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-text" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch(e);
                }
              }}
              className="pl-7 h-8 text-xs bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
            />
          </div>
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[140px] h-8 text-xs bg-card border-card-border text-primary-text">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-card border-card-border">
            <SelectItem value="all" className="text-primary-text hover:bg-card/50">All Status</SelectItem>
            <SelectItem value="active" className="text-primary-text hover:bg-card/50">Active</SelectItem>
            <SelectItem value="inactive" className="text-primary-text hover:bg-card/50">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={batchFilter}
          onValueChange={(value) => {
            setBatchFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[140px] h-8 text-xs bg-card border-card-border text-primary-text">
            <SelectValue placeholder="Filter by batch" />
          </SelectTrigger>
          <SelectContent className="bg-card border-card-border">
            <SelectItem value="all" className="text-primary-text hover:bg-card/50">All Batches</SelectItem>
            {batches.map((batch) => (
              <SelectItem key={batch.id} value={batch.id} className="text-primary-text hover:bg-card/50">
                {batch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Students Table */}
      <div className="rounded-lg border border-card-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold text-primary-text">ID</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Roll Number</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Name</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Email</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Batch</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Status</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center space-y-2">
                    <Plus className="w-8 h-8 text-muted-text" />
                    <p className="text-xs text-secondary-text">No students found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => (
                <TableRow 
                  key={student.id}
                  className="hover:bg-hover-bg transition-colors"
                >
                  <TableCell className="text-xs text-primary-text">{student.id}</TableCell>
                  <TableCell className="text-xs font-medium text-primary-text">{student.rollNumber}</TableCell>
                  <TableCell className="text-xs font-medium text-primary-text">
                    {student.user.firstName} {student.user.lastName}
                  </TableCell>
                  <TableCell className="text-xs text-secondary-text">{student.user.email}</TableCell>
                  <TableCell className="text-xs text-secondary-text">{student.batch?.name || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge
                      className={`${getStatusColor(student.status)} text-[10px] px-1.5 py-0.5`}
                      variant='secondary'
                    >
                      {student.status.charAt(0).toUpperCase() +
                        student.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleViewStudent(student)}
                        className="px-2 py-1 rounded-md transition-colors text-xs font-medium h-7"
                        style={{
                          backgroundColor: iconBgColor,
                          color: primaryColor,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = iconBgColor;
                        }}
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleEditStudent(student)}
                        className="px-2 py-1 rounded-md transition-colors text-xs font-medium h-7"
                        style={{
                          backgroundColor: iconBgColor,
                          color: primaryColor,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = iconBgColor;
                        }}
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedStudent(student);
                          setShowDeleteDialog(true);
                        }}
                        className="px-2 py-1 rounded-md transition-colors text-xs font-medium h-7"
                        style={{
                          backgroundColor: 'var(--error-opacity-10)',
                          color: 'var(--error)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--error-opacity-20)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--error-opacity-10)';
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: page === 1 
                ? 'var(--gray-100)' 
                : iconBgColor,
              color: page === 1 ? 'var(--gray-500)' : primaryColor,
            }}
            onMouseEnter={(e) => {
              if (page !== 1) {
                e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (page !== 1) {
                e.currentTarget.style.backgroundColor = iconBgColor;
              }
            }}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Previous
          </button>
          <span className="text-xs text-secondary-text px-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: page === totalPages 
                ? 'var(--gray-100)' 
                : iconBgColor,
              color: page === totalPages ? 'var(--gray-500)' : primaryColor,
            }}
            onMouseEnter={(e) => {
              if (page !== totalPages) {
                e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (page !== totalPages) {
                e.currentTarget.style.backgroundColor = iconBgColor;
              }
            }}
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Create Student Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Create New Student</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Create a new student account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create_firstName" className="text-xs text-primary-text">First Name *</Label>
                <Input
                  id="create_firstName"
                  value={newStudent.firstName}
                  onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })}
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create_lastName" className="text-xs text-primary-text">Last Name *</Label>
                <Input
                  id="create_lastName"
                  value={newStudent.lastName}
                  onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })}
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create_email" className="text-xs text-primary-text">Email *</Label>
              <Input
                id="create_email"
                type="email"
                value={newStudent.email}
                onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create_rollNumber" className="text-xs text-primary-text">Roll Number *</Label>
              <Input
                id="create_rollNumber"
                value={newStudent.rollNumber}
                onChange={(e) => setNewStudent({ ...newStudent, rollNumber: e.target.value })}
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
              />
            </div>
            {/* Department is automatically set by backend from authenticated user */}
            <div className="space-y-2">
              <Label htmlFor="create_programId" className="text-xs text-primary-text">Program *</Label>
              <Select
                value={newStudent.programId}
                onValueChange={(value) => {
                  setNewStudent({ ...newStudent, programId: value, batchId: '' });
                }}
                disabled={fetchingPrograms}
              >
                <SelectTrigger className="bg-card border-card-border text-primary-text">
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  {programs.map((program) => (
                    <SelectItem
                      key={program.id}
                      value={program.id.toString()}
                      className="text-primary-text hover:bg-card/50"
                    >
                      {program.name} ({program.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create_batchId" className="text-xs text-primary-text">Batch *</Label>
              <Select
                value={newStudent.batchId}
                onValueChange={(value) => {
                  setNewStudent({ ...newStudent, batchId: value });
                }}
                disabled={fetchingBatches || !newStudent.programId}
              >
                <SelectTrigger className="bg-card border-card-border text-primary-text">
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id} className="text-primary-text hover:bg-card/50">
                      {batch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create_status" className="text-xs text-primary-text">Status *</Label>
              <Select
                value={newStudent.status}
                onValueChange={(value: 'active' | 'inactive') => setNewStudent({ ...newStudent, status: value })}
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
          <DialogFooter className="mt-4">
            <button
              onClick={() => {
                setShowCreateModal(false);
                setNewStudent({
                  firstName: '',
                  lastName: '',
                  email: '',
                  rollNumber: '',
                  departmentId: '',
                  programId: '',
                  batchId: '',
                  sectionId: '',
                  status: 'active',
                });
              }}
              disabled={isCreating}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 border border-card-border bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                color: isDarkMode ? '#ffffff' : '#111827',
                borderColor: isDarkMode ? '#404040' : '#e5e7eb',
              }}
              onMouseEnter={(e) => {
                if (!isCreating) {
                  e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isCreating) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateStudent}
              disabled={isCreating}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
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
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Student'
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Student Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Student Details</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              View complete information about this student
            </DialogDescription>
          </DialogHeader>
          {isLoadingStudent ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-3">
                <div 
                  className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: primaryColor }}
                />
                <p className="text-xs text-secondary-text">Loading...</p>
              </div>
            </div>
          ) : viewingStudent ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-secondary-text mb-3">Student Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Name</p>
                    <p className="text-xs text-primary-text">
                      {viewingStudent.user.firstName} {viewingStudent.user.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Email</p>
                    <p className="text-xs text-primary-text">{viewingStudent.user.email}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Roll Number</p>
                    <p className="text-xs text-primary-text">{viewingStudent.rollNumber}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Department</p>
                    <p className="text-xs text-primary-text">
                      {viewingStudent.department?.name || 'Not assigned'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Program</p>
                    <p className="text-xs text-primary-text">
                      {viewingStudent.program?.name || 'Not assigned'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Batch</p>
                    <p className="text-xs text-primary-text">
                      {viewingStudent.batch?.name || 'Not assigned'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Status</p>
                    <Badge
                      className={`text-[10px] px-1.5 py-0.5 ${getStatusColor(viewingStudent.status)}`}
                      variant="secondary"
                    >
                      {viewingStudent.status}
                    </Badge>
                  </div>
                </div>
              </div>
              {viewingStudent.studentsections && viewingStudent.studentsections.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-secondary-text mb-3">Enrolled Sections</h3>
                  <div className="rounded-lg border border-card-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[10px] font-semibold text-primary-text h-8 py-1.5">Section</TableHead>
                          <TableHead className="text-[10px] font-semibold text-primary-text h-8 py-1.5">Course</TableHead>
                          <TableHead className="text-[10px] font-semibold text-primary-text h-8 py-1.5">Semester</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewingStudent.studentsections.map((enrollment: any) => (
                          <TableRow key={enrollment.id} className="hover:bg-hover-bg transition-colors">
                            <TableCell className="text-xs text-primary-text py-1.5">{enrollment.section.name}</TableCell>
                            <TableCell className="text-xs text-secondary-text py-1.5">
                              {enrollment.section.courseOffering.course.code} - {enrollment.section.courseOffering.course.name}
                            </TableCell>
                            <TableCell className="text-xs text-secondary-text py-1.5">
                              {enrollment.section.courseOffering.semester.name}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-xs text-secondary-text">
              <p>No data available</p>
            </div>
          )}
          <DialogFooter className="mt-4">
            <button
              onClick={() => {
                setShowViewModal(false);
                setViewingStudent(null);
              }}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 border border-card-border bg-transparent"
              style={{
                color: isDarkMode ? '#ffffff' : '#111827',
                borderColor: isDarkMode ? '#404040' : '#e5e7eb',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Close
            </button>
            {viewingStudent && (
              <button
                onClick={() => {
                  if (selectedStudent) {
                    setShowViewModal(false);
                    handleEditStudent(selectedStudent);
                  }
                }}
                className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 text-white flex items-center gap-1.5"
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
              >
                <Edit className="h-3.5 w-3.5" />
                Edit Student
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Student Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Edit Student</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Update student information
            </DialogDescription>
          </DialogHeader>
          {isLoadingStudent ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-3">
                <div 
                  className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: primaryColor }}
                />
                <p className="text-xs text-secondary-text">Loading...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_firstName" className="text-xs text-primary-text">First Name *</Label>
                  <Input
                    id="edit_firstName"
                    value={editStudent.firstName}
                    onChange={(e) => setEditStudent({ ...editStudent, firstName: e.target.value })}
                    required
                    className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_lastName" className="text-xs text-primary-text">Last Name *</Label>
                  <Input
                    id="edit_lastName"
                    value={editStudent.lastName}
                    onChange={(e) => setEditStudent({ ...editStudent, lastName: e.target.value })}
                    required
                    className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_email" className="text-xs text-primary-text">Email *</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={editStudent.email}
                  onChange={(e) => setEditStudent({ ...editStudent, email: e.target.value })}
                  required
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_rollNumber" className="text-xs text-primary-text">Roll Number *</Label>
                <Input
                  id="edit_rollNumber"
                  value={editStudent.rollNumber}
                  onChange={(e) => setEditStudent({ ...editStudent, rollNumber: e.target.value })}
                  required
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
              {/* Department is automatically set by backend from authenticated user */}
              <div className="space-y-2">
                <Label htmlFor="edit_programId" className="text-xs text-primary-text">Program</Label>
                <Select
                  value={editStudent.programId}
                  onValueChange={(value) => {
                    setEditStudent({ ...editStudent, programId: value, batchId: '' });
                    if (value) {
                      fetchBatchesForProgram(value);
                    }
                  }}
                >
                  <SelectTrigger className="bg-card border-card-border text-primary-text">
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-card-border">
                    {programs.map((program) => (
                      <SelectItem
                        key={program.id}
                        value={program.id.toString()}
                        className="text-primary-text hover:bg-card/50"
                      >
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_batchId" className="text-xs text-primary-text">Batch</Label>
                <Select
                  value={editStudent.batchId}
                  onValueChange={(value) => setEditStudent({ ...editStudent, batchId: value })}
                >
                  <SelectTrigger className="bg-card border-card-border text-primary-text">
                    <SelectValue placeholder="Select batch" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-card-border">
                    {batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id} className="text-primary-text hover:bg-card/50">
                        {batch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_status" className="text-xs text-primary-text">Status</Label>
                <Select
                  value={editStudent.status}
                  onValueChange={(value: 'active' | 'inactive') => setEditStudent({ ...editStudent, status: value })}
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
          )}
          <DialogFooter className="mt-4">
            <button
              onClick={() => {
                setShowEditModal(false);
                setSelectedStudent(null);
              }}
              disabled={isUpdating}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 border border-card-border bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                color: isUpdating ? (isDarkMode ? '#6b7280' : '#9ca3af') : (isDarkMode ? '#ffffff' : '#111827'),
                borderColor: isDarkMode ? '#404040' : '#e5e7eb',
              }}
              onMouseEnter={(e) => {
                if (!isUpdating) {
                  e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isUpdating) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateStudent}
              disabled={isUpdating}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
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
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Student Dialog */}
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
            <button
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 border border-card-border bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                color: isDarkMode ? '#ffffff' : '#111827',
                borderColor: isDarkMode ? '#404040' : '#e5e7eb',
              }}
              onMouseEnter={(e) => {
                if (!deleting) {
                  e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!deleting) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting || (selectedStudent?.currentStudents ?? 0) > 0}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
                borderColor: '#dc2626',
              }}
              onMouseEnter={(e) => {
                if (!deleting && !e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = '#b91c1c';
                }
              }}
              onMouseLeave={(e) => {
                if (!deleting) {
                  e.currentTarget.style.backgroundColor = '#dc2626';
                }
              }}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
