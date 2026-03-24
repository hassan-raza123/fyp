'use client';

import { useEffect, useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Search, BookCheck, AlertCircle, Eye, Edit, Trash2, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { course_offering_status } from '@prisma/client';
import { format } from 'date-fns';

interface CourseOffering {
  id: number;
  course: {
    id: number;
    code: string;
    name: string;
  };
  semester: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
  };
  status: course_offering_status;
  _count: {
    sections: number;
  };
}

interface Course {
  id: number;
  code: string;
  name: string;
}

interface Semester {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
}

export default function CourseOfferingsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  
  const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
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
  const [selectedOffering, setSelectedOffering] = useState<CourseOffering | null>(null);
  const [viewingOffering, setViewingOffering] = useState<any>(null);
  const [isLoadingOffering, setIsLoadingOffering] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form states
  const [newOffering, setNewOffering] = useState({
    courseId: '',
    semesterId: '',
    status: 'active' as course_offering_status,
  });
  const [editOffering, setEditOffering] = useState({
    courseId: '',
    semesterId: '',
    status: 'active' as course_offering_status,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchCourseOfferings = async () => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(status !== 'all' && { status }),
      });

      const response = await fetch(`/api/courses/offerings?${queryParams}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setCourseOfferings(data.data);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        setError(data.error || 'Failed to fetch course offerings');
        toast.error(data.error || 'Failed to fetch course offerings');
      }
    } catch (error) {
      console.error('Error fetching course offerings:', error);
      setError('Failed to fetch course offerings');
      toast.error('Failed to fetch course offerings');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses?limit=1000', {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setCourses(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchSemesters = async () => {
    try {
      const response = await fetch('/api/semesters?limit=1000', {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setSemesters(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching semesters:', error);
    }
  };

  useEffect(() => {
    if (mounted) {
      fetchCourseOfferings();
      fetchCourses();
      fetchSemesters();
    }
  }, [mounted, page, search, status]);

  const handleViewOffering = async (offering: CourseOffering) => {
    setSelectedOffering(offering);
    setIsLoadingOffering(true);
    setShowViewModal(true);
    try {
      const response = await fetch(`/api/courses/offerings/${offering.id}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch course offering');
      const data = await response.json();
      setViewingOffering(data.data);
    } catch (error) {
      console.error('Error fetching course offering:', error);
      toast.error('Failed to load course offering details');
      setShowViewModal(false);
    } finally {
      setIsLoadingOffering(false);
    }
  };

  const handleEditOffering = async (offering: CourseOffering) => {
    setSelectedOffering(offering);
    setIsLoadingOffering(true);
    setShowEditModal(true);
    try {
      const response = await fetch(`/api/courses/offerings/${offering.id}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch course offering');
      const data = await response.json();
      const off = data.data;
      setEditOffering({
        courseId: off.course?.id?.toString() || '',
        semesterId: off.semester?.id?.toString() || '',
        status: (off.status || 'active') as course_offering_status,
      });
    } catch (error) {
      console.error('Error fetching course offering:', error);
      toast.error('Failed to load course offering details');
      setShowEditModal(false);
    } finally {
      setIsLoadingOffering(false);
    }
  };

  const handleCreateOffering = async () => {
    if (!newOffering.courseId || !newOffering.semesterId) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/courses/offerings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          courseId: Number(newOffering.courseId),
          semesterId: Number(newOffering.semesterId),
          status: newOffering.status,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create course offering');
      }

      toast.success('Course offering created successfully');
      setShowCreateModal(false);
      setNewOffering({
        courseId: '',
        semesterId: '',
        status: 'active',
      });
      fetchCourseOfferings();
    } catch (error) {
      console.error('Error creating course offering:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create course offering');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateOffering = async () => {
    if (!selectedOffering || !editOffering.courseId || !editOffering.semesterId) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch('/api/courses/offerings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: selectedOffering.id,
          courseId: Number(editOffering.courseId),
          semesterId: Number(editOffering.semesterId),
          status: editOffering.status,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update course offering');
      }

      toast.success('Course offering updated successfully');
      setShowEditModal(false);
      setSelectedOffering(null);
      fetchCourseOfferings();
    } catch (error) {
      console.error('Error updating course offering:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update course offering');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedOffering) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/courses/offerings?id=${selectedOffering.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete course offering');
      }

      toast.success('Course offering deleted successfully');
      setShowDeleteDialog(false);
      setSelectedOffering(null);
      fetchCourseOfferings();
    } catch (error) {
      console.error('Error deleting course offering:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete course offering');
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
      case 'cancelled':
        return <Badge variant='destructive'>Cancelled</Badge>;
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
            Loading course offerings...
          </p>
        </div>
      </div>
    );
  }

  if (error && courseOfferings.length === 0) {
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
            onClick={() => fetchCourseOfferings()}
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
            Course Offerings
          </h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Manage course offerings for each semester
          </p>
        </div>
        <button 
          onClick={() => {
            fetchCourses();
            fetchSemesters();
            setShowCreateModal(true);
          }}
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
          Create Offering
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-text" />
            <Input
              placeholder="Search by course code, name, or semester..."
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
            <SelectItem value="cancelled" className="text-primary-text hover:bg-card/50">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Course Offerings Table */}
      <div className="rounded-lg border border-card-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold text-primary-text">ID</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Course</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Semester</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Duration</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Sections</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Status</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courseOfferings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center space-y-2">
                    <BookCheck className="w-8 h-8 text-muted-text" />
                    <p className="text-xs text-secondary-text">No course offerings found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              courseOfferings.map((offering) => (
                <TableRow 
                  key={offering.id}
                  className="hover:bg-hover-bg transition-colors"
                >
                  <TableCell className="text-xs text-primary-text">{offering.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="text-xs font-medium text-primary-text">{offering.course.code}</div>
                      <div className="text-xs text-secondary-text">{offering.course.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-xs font-medium text-primary-text">{offering.semester.name}</div>
                      <div className="text-xs text-secondary-text">
                        {format(new Date(offering.semester.startDate), 'MMM d, yyyy')} - {format(new Date(offering.semester.endDate), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-secondary-text">
                    {format(new Date(offering.semester.startDate), 'MMM d, yyyy')} - {format(new Date(offering.semester.endDate), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-xs text-primary-text">{offering._count.sections}</TableCell>
                  <TableCell>{getStatusBadge(offering.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleViewOffering(offering)}
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
                        onClick={() => {
                          fetchCourses();
                          fetchSemesters();
                          handleEditOffering(offering);
                        }}
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
                          setSelectedOffering(offering);
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
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: page === 1 ? 'transparent' : iconBgColor,
              color: page === 1 ? 'var(--muted-text)' : primaryColor,
              border: page === 1 ? '1px solid var(--card-border)' : 'none',
            }}
          >
            Previous
          </button>
          <span className="text-xs text-secondary-text">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: page === totalPages ? 'transparent' : iconBgColor,
              color: page === totalPages ? 'var(--muted-text)' : primaryColor,
              border: page === totalPages ? '1px solid var(--card-border)' : 'none',
            }}
          >
            Next
          </button>
        </div>
      )}

      {/* Create Course Offering Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Create Course Offering</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Add a new course offering for a semester
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create_course" className="text-xs text-primary-text">Course *</Label>
                <Select
                  value={newOffering.courseId}
                  onValueChange={(value) => setNewOffering({ ...newOffering, courseId: value })}
                >
                  <SelectTrigger className="bg-card border-card-border text-primary-text">
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-card-border">
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id.toString()} className="text-primary-text hover:bg-card/50">
                        {course.code} - {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create_semester" className="text-xs text-primary-text">Semester *</Label>
                <Select
                  value={newOffering.semesterId}
                  onValueChange={(value) => setNewOffering({ ...newOffering, semesterId: value })}
                >
                  <SelectTrigger className="bg-card border-card-border text-primary-text">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-card-border">
                    {semesters.map((semester) => (
                      <SelectItem key={semester.id} value={semester.id.toString()} className="text-primary-text hover:bg-card/50">
                        {semester.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create_status" className="text-xs text-primary-text">Status *</Label>
              <Select
                value={newOffering.status}
                onValueChange={(value: course_offering_status) => setNewOffering({ ...newOffering, status: value })}
              >
                <SelectTrigger className="bg-card border-card-border text-primary-text">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  <SelectItem value="active" className="text-primary-text hover:bg-card/50">Active</SelectItem>
                  <SelectItem value="inactive" className="text-primary-text hover:bg-card/50">Inactive</SelectItem>
                  <SelectItem value="cancelled" className="text-primary-text hover:bg-card/50">Cancelled</SelectItem>
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
                setNewOffering({
                  courseId: '',
                  semesterId: '',
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
                backgroundColor: primaryColor,
              }}
              onMouseEnter={(e) => {
                if (!isCreating && !e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = primaryColorDark;
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = primaryColor;
                }
              }}
              onClick={handleCreateOffering}
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Offering'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Course Offering Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Course Offering Details</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              View complete information about this course offering
            </DialogDescription>
          </DialogHeader>
          {isLoadingOffering ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-3">
                <div 
                  className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: primaryColor }}
                />
                <p className="text-xs text-secondary-text">Loading...</p>
              </div>
            </div>
          ) : viewingOffering ? (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-secondary-text">Course</Label>
                  <div className="text-xs font-medium text-primary-text">
                    {viewingOffering.course?.code} - {viewingOffering.course?.name}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-secondary-text">Semester</Label>
                  <div className="text-xs font-medium text-primary-text">
                    {viewingOffering.semester?.name}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-secondary-text">Start Date</Label>
                  <div className="text-xs text-primary-text">
                    {viewingOffering.semester?.startDate ? format(new Date(viewingOffering.semester.startDate), 'MMM d, yyyy') : 'N/A'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-secondary-text">End Date</Label>
                  <div className="text-xs text-primary-text">
                    {viewingOffering.semester?.endDate ? format(new Date(viewingOffering.semester.endDate), 'MMM d, yyyy') : 'N/A'}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-secondary-text">Status</Label>
                <div>{getStatusBadge(viewingOffering.status)}</div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-secondary-text">Sections</Label>
                <div className="text-xs text-primary-text">
                  {viewingOffering.sections?.length || 0} section(s)
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-card-border bg-transparent"
              style={{
                color: isDarkMode ? '#ffffff' : '#111827',
                borderColor: isDarkMode ? '#404040' : '#e5e7eb',
              }}
              onClick={() => {
                setShowViewModal(false);
                setViewingOffering(null);
              }}
            >
              Close
            </Button>
            {selectedOffering && (
              <Button
                size="sm"
                className="h-8 text-xs text-white"
                style={{
                  backgroundColor: primaryColor,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = primaryColorDark;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = primaryColor;
                }}
                onClick={() => {
                  setShowViewModal(false);
                  fetchCourses();
                  fetchSemesters();
                  handleEditOffering(selectedOffering);
                }}
              >
                <Edit className="h-3.5 w-3.5 mr-1.5" />
                Edit Offering
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Course Offering Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Edit Course Offering</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Update course offering information
            </DialogDescription>
          </DialogHeader>
          {isLoadingOffering ? (
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
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_course" className="text-xs text-primary-text">Course *</Label>
                  <Select
                    value={editOffering.courseId}
                    onValueChange={(value) => setEditOffering({ ...editOffering, courseId: value })}
                  >
                    <SelectTrigger className="bg-card border-card-border text-primary-text">
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-card-border">
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id.toString()} className="text-primary-text hover:bg-card/50">
                          {course.code} - {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_semester" className="text-xs text-primary-text">Semester *</Label>
                  <Select
                    value={editOffering.semesterId}
                    onValueChange={(value) => setEditOffering({ ...editOffering, semesterId: value })}
                  >
                    <SelectTrigger className="bg-card border-card-border text-primary-text">
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-card-border">
                      {semesters.map((semester) => (
                        <SelectItem key={semester.id} value={semester.id.toString()} className="text-primary-text hover:bg-card/50">
                          {semester.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_status" className="text-xs text-primary-text">Status *</Label>
                <Select
                  value={editOffering.status}
                  onValueChange={(value: course_offering_status) => setEditOffering({ ...editOffering, status: value })}
                >
                  <SelectTrigger className="bg-card border-card-border text-primary-text">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-card-border">
                    <SelectItem value="active" className="text-primary-text hover:bg-card/50">Active</SelectItem>
                    <SelectItem value="inactive" className="text-primary-text hover:bg-card/50">Inactive</SelectItem>
                    <SelectItem value="cancelled" className="text-primary-text hover:bg-card/50">Cancelled</SelectItem>
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
                setSelectedOffering(null);
              }}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs text-white"
              style={{
                backgroundColor: isUpdating ? (isDarkMode ? '#6b7280' : '#9ca3af') : primaryColor,
              }}
              onMouseEnter={(e) => {
                if (!isUpdating && !e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = primaryColorDark;
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = isUpdating ? (isDarkMode ? '#6b7280' : '#9ca3af') : primaryColor;
                }
              }}
              onClick={handleUpdateOffering}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Offering'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Course Offering Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-card border-card-border p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Delete Course Offering</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Are you sure you want to delete this course offering? This action cannot be undone and will remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-card-border bg-transparent"
              style={{
                color: isDeleting ? (isDarkMode ? '#6b7280' : '#9ca3af') : (isDarkMode ? '#ffffff' : '#111827'),
                borderColor: isDarkMode ? '#404040' : '#e5e7eb',
              }}
              onMouseEnter={(e) => {
                if (!isDeleting && !e.currentTarget.disabled) {
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
                setSelectedOffering(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs text-white"
              style={{
                backgroundColor: isDeleting ? (isDarkMode ? '#6b7280' : '#9ca3af') : 'var(--error)',
              }}
              onMouseEnter={(e) => {
                if (!isDeleting && !e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = 'var(--error-dark)';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = isDeleting ? (isDarkMode ? '#6b7280' : '#9ca3af') : 'var(--error)';
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
                'Delete Offering'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
