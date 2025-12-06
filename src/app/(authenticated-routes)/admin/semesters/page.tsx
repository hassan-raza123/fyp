'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Plus, Search, Calendar, AlertCircle, Eye, Edit, Trash2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { semester_status } from '@prisma/client';
import { format } from 'date-fns';

interface Semester {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: semester_status;
  _count: {
    courseOfferings: number;
  };
}

export default function SemestersPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  
  const [semesters, setSemesters] = useState<Semester[]>([]);
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
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);
  const [viewingSemester, setViewingSemester] = useState<any>(null);
  const [isLoadingSemester, setIsLoadingSemester] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form states
  const [newSemester, setNewSemester] = useState({
    name: '',
    startDate: '',
    endDate: '',
    status: 'active' as semester_status,
  });
  const [editSemester, setEditSemester] = useState({
    name: '',
    startDate: '',
    endDate: '',
    status: 'active' as semester_status,
  });
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchSemesters();
  }, [search, status, page]);

  const fetchSemesters = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (search) params.append('search', search);
      if (status && status !== 'all') params.append('status', status);

      const response = await fetch(`/api/semesters?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch semesters');
      }
      const data = await response.json();
      if (data.success) {
        setSemesters(data.data);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching semesters:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch semesters');
      toast.error('Failed to fetch semesters');
    } finally {
      setLoading(false);
    }
  };

  const handleViewSemester = async (semester: Semester) => {
    setSelectedSemester(semester);
    setIsLoadingSemester(true);
    setShowViewModal(true);
    try {
      const response = await fetch(`/api/semesters/${semester.id}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch semester');
      const data = await response.json();
      setViewingSemester(data.data);
    } catch (error) {
      console.error('Error fetching semester:', error);
      toast.error('Failed to load semester details');
      setShowViewModal(false);
    } finally {
      setIsLoadingSemester(false);
    }
  };

  const handleEditSemester = async (semester: Semester) => {
    setSelectedSemester(semester);
    setIsLoadingSemester(true);
    setShowEditModal(true);
    try {
      const response = await fetch(`/api/semesters/${semester.id}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch semester');
      const data = await response.json();
      const sem = data.data;
      setEditSemester({
        name: sem.name || '',
        startDate: sem.startDate ? format(new Date(sem.startDate), 'yyyy-MM-dd') : '',
        endDate: sem.endDate ? format(new Date(sem.endDate), 'yyyy-MM-dd') : '',
        status: (sem.status || 'active') as semester_status,
      });
    } catch (error) {
      console.error('Error fetching semester:', error);
      toast.error('Failed to load semester details');
      setShowEditModal(false);
    } finally {
      setIsLoadingSemester(false);
    }
  };

  const handleCreateSemester = async () => {
    if (!newSemester.name.trim() || !newSemester.startDate || !newSemester.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (new Date(newSemester.startDate) >= new Date(newSemester.endDate)) {
      toast.error('End date must be after start date');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/semesters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newSemester.name,
          startDate: newSemester.startDate,
          endDate: newSemester.endDate,
          status: newSemester.status,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create semester');
      }

      toast.success('Semester created successfully');
      setShowCreateModal(false);
      setNewSemester({
        name: '',
        startDate: '',
        endDate: '',
        status: 'active',
      });
      fetchSemesters();
    } catch (error) {
      console.error('Error creating semester:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create semester');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateSemester = async () => {
    if (!selectedSemester || !editSemester.name.trim() || !editSemester.startDate || !editSemester.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (new Date(editSemester.startDate) >= new Date(editSemester.endDate)) {
      toast.error('End date must be after start date');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/semesters/${selectedSemester.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: editSemester.name,
          startDate: editSemester.startDate,
          endDate: editSemester.endDate,
          status: editSemester.status,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update semester');
      }

      toast.success('Semester updated successfully');
      setShowEditModal(false);
      setSelectedSemester(null);
      fetchSemesters();
    } catch (error) {
      console.error('Error updating semester:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update semester');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSemester) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/semesters/${selectedSemester.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete semester');
      }

      toast.success('Semester deleted successfully');
      setShowDeleteDialog(false);
      setSelectedSemester(null);
      fetchSemesters();
    } catch (error) {
      console.error('Error deleting semester:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete semester');
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
      case 'completed':
        return <Badge variant='destructive'>Completed</Badge>;
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
            Loading semesters...
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
            onClick={() => fetchSemesters()}
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
            Semesters
          </h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Manage academic semesters and their details
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
          Create Semester
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-text" />
            <Input
              placeholder="Search semesters..."
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
            <SelectItem value="completed" className="text-primary-text hover:bg-card/50">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Semesters Table */}
      <div className="rounded-lg border border-card-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold text-primary-text">ID</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Name</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Start Date</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">End Date</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Status</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Course Offerings</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {semesters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center space-y-2">
                    <Calendar className="w-8 h-8 text-muted-text" />
                    <p className="text-xs text-secondary-text">No semesters found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              semesters.map((semester) => (
                <TableRow 
                  key={semester.id}
                  className="hover:bg-hover-bg transition-colors"
                >
                  <TableCell className="text-xs text-primary-text">{semester.id}</TableCell>
                  <TableCell className="text-xs font-medium text-primary-text">{semester.name}</TableCell>
                  <TableCell className="text-xs text-primary-text">
                    {format(new Date(semester.startDate), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-xs text-primary-text">
                    {format(new Date(semester.endDate), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>{getStatusBadge(semester.status)}</TableCell>
                  <TableCell className="text-xs text-primary-text">{semester._count.courseOfferings}</TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleViewSemester(semester)}
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
                        onClick={() => handleEditSemester(semester)}
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
                          setSelectedSemester(semester);
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

      {/* Create Semester Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Create New Semester</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Add a new academic semester to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create_name" className="text-xs text-primary-text">Semester Name *</Label>
              <Input
                id="create_name"
                value={newSemester.name}
                onChange={(e) => setNewSemester({ ...newSemester, name: e.target.value })}
                placeholder="e.g., Fall 2024"
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create_startDate" className="text-xs text-primary-text">Start Date *</Label>
                <Input
                  id="create_startDate"
                  type="date"
                  value={newSemester.startDate}
                  onChange={(e) => setNewSemester({ ...newSemester, startDate: e.target.value })}
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create_endDate" className="text-xs text-primary-text">End Date *</Label>
                <Input
                  id="create_endDate"
                  type="date"
                  value={newSemester.endDate}
                  onChange={(e) => setNewSemester({ ...newSemester, endDate: e.target.value })}
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create_status" className="text-xs text-primary-text">Status *</Label>
              <Select
                value={newSemester.status}
                onValueChange={(value: semester_status) => setNewSemester({ ...newSemester, status: value })}
              >
                <SelectTrigger className="bg-card border-card-border text-primary-text">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  <SelectItem value="active" className="text-primary-text hover:bg-card/50">Active</SelectItem>
                  <SelectItem value="inactive" className="text-primary-text hover:bg-card/50">Inactive</SelectItem>
                  <SelectItem value="completed" className="text-primary-text hover:bg-card/50">Completed</SelectItem>
                </SelectContent>
              </Select>
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
                setNewSemester({
                  name: '',
                  startDate: '',
                  endDate: '',
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
              onClick={handleCreateSemester}
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Semester'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Semester Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Semester Details</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              View complete information about this semester
            </DialogDescription>
          </DialogHeader>
          {isLoadingSemester ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-3">
                <div 
                  className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: primaryColor }}
                />
                <p className="text-xs text-secondary-text">Loading...</p>
              </div>
            </div>
          ) : viewingSemester ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-secondary-text mb-3">Semester Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Semester Name</p>
                    <p className="text-xs text-primary-text">{viewingSemester.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Status</p>
                    <div className="mt-1">{getStatusBadge(viewingSemester.status)}</div>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Start Date</p>
                    <p className="text-xs text-primary-text">
                      {viewingSemester.startDate ? format(new Date(viewingSemester.startDate), 'MMM d, yyyy') : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">End Date</p>
                    <p className="text-xs text-primary-text">
                      {viewingSemester.endDate ? format(new Date(viewingSemester.endDate), 'MMM d, yyyy') : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
              {viewingSemester.stats && (
                <div>
                  <h3 className="text-xs font-semibold text-secondary-text mb-3">Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-muted-text mb-1">Course Offerings</p>
                      <p className="text-xs text-primary-text">{viewingSemester.stats.courseOfferings || 0}</p>
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
                setViewingSemester(null);
              }}
            >
              Close
            </Button>
            {viewingSemester && (
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
                  const semester = semesters.find(s => s.id === viewingSemester.id);
                  if (semester) {
                    setShowViewModal(false);
                    handleEditSemester(semester);
                  }
                }}
              >
                <Edit className="h-3.5 w-3.5 mr-1.5" />
                Edit Semester
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Semester Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Edit Semester</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Update semester information
            </DialogDescription>
          </DialogHeader>
          {isLoadingSemester ? (
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
              <div className="space-y-2">
                <Label htmlFor="edit_name" className="text-xs text-primary-text">Semester Name *</Label>
                <Input
                  id="edit_name"
                  value={editSemester.name}
                  onChange={(e) => setEditSemester({ ...editSemester, name: e.target.value })}
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_startDate" className="text-xs text-primary-text">Start Date *</Label>
                  <Input
                    id="edit_startDate"
                    type="date"
                    value={editSemester.startDate}
                    onChange={(e) => setEditSemester({ ...editSemester, startDate: e.target.value })}
                    className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_endDate" className="text-xs text-primary-text">End Date *</Label>
                  <Input
                    id="edit_endDate"
                    type="date"
                    value={editSemester.endDate}
                    onChange={(e) => setEditSemester({ ...editSemester, endDate: e.target.value })}
                    className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_status" className="text-xs text-primary-text">Status *</Label>
                <Select
                  value={editSemester.status}
                  onValueChange={(value: semester_status) => setEditSemester({ ...editSemester, status: value })}
                >
                  <SelectTrigger className="bg-card border-card-border text-primary-text">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-card-border">
                    <SelectItem value="active" className="text-primary-text hover:bg-card/50">Active</SelectItem>
                    <SelectItem value="inactive" className="text-primary-text hover:bg-card/50">Inactive</SelectItem>
                    <SelectItem value="completed" className="text-primary-text hover:bg-card/50">Completed</SelectItem>
                  </SelectContent>
                </Select>
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
                setSelectedSemester(null);
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
              onClick={handleUpdateSemester}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Semester'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Semester Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-card border-card-border p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Delete Semester</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Are you sure you want to delete{' '}
              {selectedSemester ? `${selectedSemester.name}` : 'this semester'}
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
                setSelectedSemester(null);
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
