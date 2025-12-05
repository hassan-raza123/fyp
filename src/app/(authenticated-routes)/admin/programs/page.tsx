'use client';

import { useEffect, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Search, Filter, School, AlertCircle, Eye, Edit, Trash2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { programs_status } from '@prisma/client';

interface Program {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  department: {
    id: number;
    name: string;
    code: string;
  };
  totalCreditHours: number;
  duration: number;
  status: string;
  _count: {
    students: number;
    courses: number;
  };
}

interface Department {
  id: number;
  name: string;
  code: string;
}

export default function ProgramsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [viewingProgram, setViewingProgram] = useState<any>(null);
  const [isLoadingProgram, setIsLoadingProgram] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentDepartmentId, setCurrentDepartmentId] = useState<string>('');
  
  // Form states
  const [newProgram, setNewProgram] = useState({
    name: '',
    code: '',
    totalCreditHours: '',
    duration: '',
    description: '',
    status: 'active' as programs_status,
  });
  const [editProgram, setEditProgram] = useState({
    name: '',
    code: '',
    totalCreditHours: '',
    duration: '',
    description: '',
    status: 'active' as programs_status,
  });
  
  useEffect(() => {
    setMounted(true);
    fetchCurrentDepartment();
  }, []);

  useEffect(() => {
    fetchPrograms();
  }, [search, status, page]);

  const fetchCurrentDepartment = async () => {
    try {
      const checkResponse = await fetch('/api/admin/check-department', {
        credentials: 'include',
      });
      
      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        if (checkData.success && checkData.hasDepartment && checkData.department) {
          setCurrentDepartmentId(checkData.department.id.toString());
        }
      }
    } catch (error) {
      console.error('Error fetching current department:', error);
    }
  };

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (search) params.append('search', search);
      // Department filter removed - API automatically uses current department
      if (status && status !== 'all') params.append('status', status);

      const response = await fetch(`/api/programs?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch programs');
      }
      const data = await response.json();
      if (data.success) {
        setPrograms(data.data);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch programs');
      toast.error('Failed to fetch programs');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProgram = async (program: Program) => {
    setSelectedProgram(program);
    setIsLoadingProgram(true);
    setShowViewModal(true);
    try {
      const response = await fetch(`/api/programs/${program.id}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch program');
      const data = await response.json();
      setViewingProgram(data.data);
    } catch (error) {
      console.error('Error fetching program:', error);
      toast.error('Failed to load program details');
      setShowViewModal(false);
    } finally {
      setIsLoadingProgram(false);
    }
  };

  const handleEditProgram = async (program: Program) => {
    setSelectedProgram(program);
    setIsLoadingProgram(true);
    setShowEditModal(true);
    try {
      const response = await fetch(`/api/programs/${program.id}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch program');
      const data = await response.json();
      const prog = data.data;
      setEditProgram({
        name: prog.name || '',
        code: prog.code || '',
        totalCreditHours: prog.totalCreditHours?.toString() || '',
        duration: prog.duration?.toString() || '',
        description: prog.description || '',
        status: (prog.status || 'active') as programs_status,
      });
    } catch (error) {
      console.error('Error fetching program:', error);
      toast.error('Failed to load program details');
      setShowEditModal(false);
    } finally {
      setIsLoadingProgram(false);
    }
  };

  const handleCreateProgram = async () => {
    if (!newProgram.name.trim() || !newProgram.code.trim() || !newProgram.totalCreditHours || !newProgram.duration) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!currentDepartmentId) {
      toast.error('Department not configured. Please set in Settings.');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newProgram.name,
          code: newProgram.code,
          departmentId: currentDepartmentId,
          totalCreditHours: Number(newProgram.totalCreditHours),
          duration: Number(newProgram.duration),
          description: newProgram.description,
          status: newProgram.status,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create program');
      }

      toast.success('Program created successfully');
      setShowCreateModal(false);
      setNewProgram({
        name: '',
        code: '',
        totalCreditHours: '',
        duration: '',
        description: '',
        status: 'active',
      });
      fetchPrograms();
    } catch (error) {
      console.error('Error creating program:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create program');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateProgram = async () => {
    if (!selectedProgram || !editProgram.name.trim() || !editProgram.code.trim() || !editProgram.totalCreditHours || !editProgram.duration) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/programs/${selectedProgram.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: editProgram.name,
          code: editProgram.code,
          totalCreditHours: Number(editProgram.totalCreditHours),
          duration: Number(editProgram.duration),
          description: editProgram.description,
          status: editProgram.status,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update program');
      }

      toast.success('Program updated successfully');
      setShowEditModal(false);
      setSelectedProgram(null);
      fetchPrograms();
    } catch (error) {
      console.error('Error updating program:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update program');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProgram) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/programs/${selectedProgram.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete program');
      }

      toast.success('Program deleted successfully');
      setShowDeleteDialog(false);
      setSelectedProgram(null);
      fetchPrograms();
    } catch (error) {
      console.error('Error deleting program:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete program');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant='success'>Active</Badge>;
      case 'inactive':
        return <Badge variant='secondary'>Inactive</Badge>;
      case 'archived':
        return <Badge variant='destructive'>Archived</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const primaryColorDark = isDarkMode ? 'var(--orange-dark)' : 'var(--blue-dark)';
  const iconBgColor = isDarkMode 
    ? 'rgba(252, 153, 40, 0.15)' 
    : 'rgba(38, 40, 149, 0.15)';

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
            Loading programs...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-page">
        <div className="text-center">
          <AlertCircle 
            className="w-16 h-16 mx-auto mb-4" 
            style={{ color: 'var(--error)' }}
          />
          <div 
            className="text-sm font-semibold mb-2"
            style={{ color: 'var(--error)' }}
          >
            Error
          </div>
          <div className="text-xs text-secondary-text mb-4">{error}</div>
          <button
            onClick={() => fetchPrograms()}
            className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8"
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
            Try Again
          </button>
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
            Programs
          </h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Manage academic programs and their details
          </p>
        </div>
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
          Create Program
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-text" />
            <Input
              placeholder="Search programs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-7 h-8 text-xs bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
            />
          </div>
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[140px] h-8 text-xs bg-card border-card-border text-primary-text">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-card border-card-border">
            <SelectItem value="all" className="text-primary-text hover:bg-card/50">All Status</SelectItem>
            <SelectItem value="active" className="text-primary-text hover:bg-card/50">Active</SelectItem>
            <SelectItem value="inactive" className="text-primary-text hover:bg-card/50">Inactive</SelectItem>
            <SelectItem value="archived" className="text-primary-text hover:bg-card/50">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Programs Table */}
      <div className="rounded-lg border border-card-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold text-primary-text">ID</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Name</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Code</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Department</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Credit Hours</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Duration</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Courses</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Students</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Status</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {programs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  <div className="flex flex-col items-center space-y-2">
                    <School className="w-8 h-8 text-muted-text" />
                    <p className="text-xs text-secondary-text">No programs found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              programs.map((program) => (
                <TableRow 
                  key={program.id}
                  className="hover:bg-hover-bg transition-colors"
                >
                  <TableCell className="text-xs text-primary-text">{program.id}</TableCell>
                  <TableCell className="text-xs font-medium text-primary-text">{program.name}</TableCell>
                  <TableCell className="text-xs text-secondary-text">{program.code}</TableCell>
                  <TableCell className="text-xs text-secondary-text">
                    {program.department.name} ({program.department.code})
                  </TableCell>
                  <TableCell className="text-xs text-primary-text">{program.totalCreditHours}</TableCell>
                  <TableCell className="text-xs text-primary-text">{program.duration} years</TableCell>
                  <TableCell className="text-xs text-primary-text">{program._count.courses}</TableCell>
                  <TableCell className="text-xs text-primary-text">{program._count.students}</TableCell>
                  <TableCell>{getStatusBadge(program.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleViewProgram(program)}
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
                        onClick={() => handleEditProgram(program)}
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
                          setSelectedProgram(program);
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

      {/* Create Program Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Create New Program</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Add a new academic program to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create_name" className="text-xs text-primary-text">Program Name *</Label>
                <Input
                  id="create_name"
                  value={newProgram.name}
                  onChange={(e) => setNewProgram({ ...newProgram, name: e.target.value })}
                  placeholder="Enter program name"
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create_code" className="text-xs text-primary-text">Program Code *</Label>
                <Input
                  id="create_code"
                  value={newProgram.code}
                  onChange={(e) => setNewProgram({ ...newProgram, code: e.target.value })}
                  placeholder="Enter program code"
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
            </div>
            {currentDepartmentId && (
              <div className="space-y-2">
                <Label htmlFor="create_department" className="text-xs text-primary-text">Department</Label>
                <Input
                  id="create_department"
                  value="Current Department (Assigned by Super Admin)"
                  disabled
                  className="bg-card border-card-border text-secondary-text"
                />
                <p className="text-[10px] text-muted-text">Department is assigned by super admin</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create_creditHours" className="text-xs text-primary-text">Total Credit Hours *</Label>
                <Input
                  id="create_creditHours"
                  type="number"
                  min="0"
                  value={newProgram.totalCreditHours}
                  onChange={(e) => setNewProgram({ ...newProgram, totalCreditHours: e.target.value })}
                  placeholder="Enter total credit hours"
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create_duration" className="text-xs text-primary-text">Duration (Years) *</Label>
                <Input
                  id="create_duration"
                  type="number"
                  min="1"
                  value={newProgram.duration}
                  onChange={(e) => setNewProgram({ ...newProgram, duration: e.target.value })}
                  placeholder="Enter duration in years"
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create_status" className="text-xs text-primary-text">Status *</Label>
              <Select
                value={newProgram.status}
                onValueChange={(value: programs_status) => setNewProgram({ ...newProgram, status: value })}
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
            <div className="space-y-2">
              <Label htmlFor="create_description" className="text-xs text-primary-text">Description</Label>
              <Input
                id="create_description"
                value={newProgram.description}
                onChange={(e) => setNewProgram({ ...newProgram, description: e.target.value })}
                placeholder="Enter program description (optional)"
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
              />
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
                if (!isCreating && !e.currentTarget.disabled) {
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
                setNewProgram({
                  name: '',
                  code: '',
                  totalCreditHours: '',
                  duration: '',
                  description: '',
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
              onClick={handleCreateProgram}
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Program'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Program Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Program Details</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              View complete information about this program
            </DialogDescription>
          </DialogHeader>
          {isLoadingProgram ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-3">
                <div 
                  className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: primaryColor }}
                />
                <p className="text-xs text-secondary-text">Loading...</p>
              </div>
            </div>
          ) : viewingProgram ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-secondary-text mb-3">Program Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Program Name</p>
                    <p className="text-xs text-primary-text">{viewingProgram.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Program Code</p>
                    <p className="text-xs text-primary-text">{viewingProgram.code || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Department</p>
                    <p className="text-xs text-primary-text">
                      {viewingProgram.department ? `${viewingProgram.department.name} (${viewingProgram.department.code})` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Status</p>
                    <div className="mt-1">{getStatusBadge(viewingProgram.status)}</div>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Total Credit Hours</p>
                    <p className="text-xs text-primary-text">{viewingProgram.totalCreditHours || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Duration</p>
                    <p className="text-xs text-primary-text">{viewingProgram.duration ? `${viewingProgram.duration} years` : 'N/A'}</p>
                  </div>
                  {viewingProgram.description && (
                    <div className="col-span-2">
                      <p className="text-[10px] text-muted-text mb-1">Description</p>
                      <p className="text-xs text-primary-text">{viewingProgram.description}</p>
                    </div>
                  )}
                </div>
              </div>
              {viewingProgram.stats && (
                <div>
                  <h3 className="text-xs font-semibold text-secondary-text mb-3">Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-muted-text mb-1">Total Courses</p>
                      <p className="text-xs text-primary-text">{viewingProgram.stats.courses || 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-text mb-1">Total Students</p>
                      <p className="text-xs text-primary-text">{viewingProgram.stats.students || 0}</p>
                    </div>
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
                setViewingProgram(null);
              }}
            >
              Close
            </Button>
            {viewingProgram && (
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
                  const program = programs.find(p => p.id === viewingProgram.id);
                  if (program) {
                    setShowViewModal(false);
                    handleEditProgram(program);
                  }
                }}
              >
                <Edit className="h-3.5 w-3.5 mr-1.5" />
                Edit Program
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Program Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Edit Program</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Update program information
            </DialogDescription>
          </DialogHeader>
          {isLoadingProgram ? (
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
                  <Label htmlFor="edit_name" className="text-xs text-primary-text">Program Name *</Label>
                  <Input
                    id="edit_name"
                    value={editProgram.name}
                    onChange={(e) => setEditProgram({ ...editProgram, name: e.target.value })}
                    className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_code" className="text-xs text-primary-text">Program Code *</Label>
                  <Input
                    id="edit_code"
                    value={editProgram.code}
                    onChange={(e) => setEditProgram({ ...editProgram, code: e.target.value })}
                    className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_creditHours" className="text-xs text-primary-text">Total Credit Hours *</Label>
                  <Input
                    id="edit_creditHours"
                    type="number"
                    min="0"
                    value={editProgram.totalCreditHours}
                    onChange={(e) => setEditProgram({ ...editProgram, totalCreditHours: e.target.value })}
                    className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_duration" className="text-xs text-primary-text">Duration (Years) *</Label>
                  <Input
                    id="edit_duration"
                    type="number"
                    min="1"
                    value={editProgram.duration}
                    onChange={(e) => setEditProgram({ ...editProgram, duration: e.target.value })}
                    className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_status" className="text-xs text-primary-text">Status *</Label>
                <Select
                  value={editProgram.status}
                  onValueChange={(value: programs_status) => setEditProgram({ ...editProgram, status: value })}
                >
                  <SelectTrigger className="bg-card border-card-border text-primary-text">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-card-border">
                    <SelectItem value="active" className="text-primary-text hover:bg-card/50">Active</SelectItem>
                    <SelectItem value="inactive" className="text-primary-text hover:bg-card/50">Inactive</SelectItem>
                    <SelectItem value="archived" className="text-primary-text hover:bg-card/50">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_description" className="text-xs text-primary-text">Description</Label>
                <Input
                  id="edit_description"
                  value={editProgram.description}
                  onChange={(e) => setEditProgram({ ...editProgram, description: e.target.value })}
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
            </div>
          )}
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
                setSelectedProgram(null);
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
              onClick={handleUpdateProgram}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Program'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Program Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-card border-card-border p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Delete Program</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Are you sure you want to delete{' '}
              {selectedProgram ? `${selectedProgram.name} (${selectedProgram.code})` : 'this program'}
              ? This action cannot be undone and will remove all associated data.
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
                setSelectedProgram(null);
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
              {isDeleting ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
