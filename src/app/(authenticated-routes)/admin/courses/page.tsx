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
import { Plus, Search, BookOpen, AlertCircle, Eye, Edit, Trash2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { course_type, course_status } from '@prisma/client';

interface Course {
  id: number;
  code: string;
  name: string;
  creditHours: number;
  theoryHours?: number;
  labHours?: number;
  type: course_type;
  department: {
    id: number;
    name: string;
    code: string;
  };
  status: course_status;
  description?: string | null;
}

export default function CoursesPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [viewingCourse, setViewingCourse] = useState<any>(null);
  const [isLoadingCourse, setIsLoadingCourse] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form states
  const [newCourse, setNewCourse] = useState({
    code: '',
    name: '',
    description: '',
    creditHours: '',
    theoryHours: '',
    labHours: '',
    type: 'THEORY' as course_type,
    status: 'active' as course_status,
  });
  const [editCourse, setEditCourse] = useState({
    code: '',
    name: '',
    description: '',
    creditHours: '',
    theoryHours: '',
    labHours: '',
    type: 'THEORY' as course_type,
    status: 'active' as course_status,
  });
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [search, type, status, page]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (search) params.append('search', search);
      if (type && type !== 'all') params.append('type', type);
      if (status && status !== 'all') params.append('status', status);

      const response = await fetch(`/api/courses?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      const data = await response.json();
      if (data.success) {
        setCourses(data.data);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch courses');
      toast.error('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCourse = async (course: Course) => {
    setSelectedCourse(course);
    setIsLoadingCourse(true);
    setShowViewModal(true);
    try {
      const response = await fetch(`/api/courses/${course.id}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch course');
      const data = await response.json();
      setViewingCourse(data.data);
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error('Failed to load course details');
      setShowViewModal(false);
    } finally {
      setIsLoadingCourse(false);
    }
  };

  const handleEditCourse = async (course: Course) => {
    setSelectedCourse(course);
    setIsLoadingCourse(true);
    setShowEditModal(true);
    try {
      const response = await fetch(`/api/courses/${course.id}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch course');
      const data = await response.json();
      const c = data.data;
      setEditCourse({
        code: c.code || '',
        name: c.name || '',
        description: c.description || '',
        creditHours: c.creditHours?.toString() || '',
        theoryHours: c.theoryHours?.toString() || '',
        labHours: c.labHours?.toString() || '',
        type: (c.type || 'THEORY') as course_type,
        status: (c.status || 'active') as course_status,
      });
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error('Failed to load course details');
      setShowEditModal(false);
    } finally {
      setIsLoadingCourse(false);
    }
  };

  const handleCreateCourse = async () => {
    if (!newCourse.code.trim() || !newCourse.name.trim() || !newCourse.creditHours) {
      toast.error('Please fill in all required fields');
      return;
    }

    const creditHoursNum = Number(newCourse.creditHours);
    if (isNaN(creditHoursNum) || creditHoursNum < 1) {
      toast.error('Please enter a valid credit hours value');
      return;
    }

    // Calculate theoryHours and labHours based on type
    let theoryHoursNum = 0;
    let labHoursNum = 0;
    if (newCourse.type === 'LAB') {
      labHoursNum = creditHoursNum;
      theoryHoursNum = 0;
    } else {
      theoryHoursNum = creditHoursNum;
      labHoursNum = 0;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          code: newCourse.code,
          name: newCourse.name,
          description: newCourse.description,
          creditHours: creditHoursNum,
          theoryHours: theoryHoursNum,
          labHours: labHoursNum,
          type: newCourse.type,
          status: newCourse.status,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create course');
      }

      toast.success('Course created successfully');
      setShowCreateModal(false);
      setNewCourse({
        code: '',
        name: '',
        description: '',
        creditHours: '',
        theoryHours: '',
        labHours: '',
        type: 'THEORY',
        status: 'active',
      });
      fetchCourses();
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create course');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateCourse = async () => {
    if (!selectedCourse || !editCourse.code.trim() || !editCourse.name.trim() || !editCourse.creditHours) {
      toast.error('Please fill in all required fields');
      return;
    }

    const creditHoursNum = Number(editCourse.creditHours);
    if (isNaN(creditHoursNum) || creditHoursNum < 1) {
      toast.error('Please enter a valid credit hours value');
      return;
    }

    // Calculate theoryHours and labHours based on type
    let theoryHoursNum = 0;
    let labHoursNum = 0;
    if (editCourse.type === 'LAB') {
      labHoursNum = creditHoursNum;
      theoryHoursNum = 0;
    } else {
      theoryHoursNum = creditHoursNum;
      labHoursNum = 0;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/courses/${selectedCourse.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          code: editCourse.code,
          name: editCourse.name,
          description: editCourse.description,
          creditHours: creditHoursNum,
          theoryHours: theoryHoursNum,
          labHours: labHoursNum,
          type: editCourse.type,
          status: editCourse.status,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update course');
      }

      toast.success('Course updated successfully');
      setShowEditModal(false);
      setSelectedCourse(null);
      fetchCourses();
    } catch (error) {
      console.error('Error updating course:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update course');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCourse) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/courses/${selectedCourse.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete course');
      }

      toast.success('Course deleted successfully');
      setShowDeleteDialog(false);
      setSelectedCourse(null);
      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete course');
    } finally {
      setIsDeleting(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'THEORY':
        return <Badge variant='default'>Theory</Badge>;
      case 'LAB':
        return <Badge variant='success'>Lab</Badge>;
      case 'PROJECT':
        return <Badge variant='secondary'>Project</Badge>;
      case 'THESIS':
        return <Badge variant='destructive'>Thesis</Badge>;
      default:
        return <Badge>{type}</Badge>;
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
            Loading courses...
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
            onClick={() => fetchCourses()}
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
            Courses
          </h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Manage academic courses and their details
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
          Create Course
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-text" />
            <Input
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-7 h-8 text-xs bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
            />
          </div>
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[140px] h-8 text-xs bg-card border-card-border text-primary-text">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent className="bg-card border-card-border">
            <SelectItem value="all" className="text-primary-text hover:bg-card/50">All Types</SelectItem>
            <SelectItem value="THEORY" className="text-primary-text hover:bg-card/50">Theory</SelectItem>
            <SelectItem value="LAB" className="text-primary-text hover:bg-card/50">Lab</SelectItem>
            <SelectItem value="PROJECT" className="text-primary-text hover:bg-card/50">Project</SelectItem>
            <SelectItem value="THESIS" className="text-primary-text hover:bg-card/50">Thesis</SelectItem>
          </SelectContent>
        </Select>
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

      {/* Courses Table */}
      <div className="rounded-lg border border-card-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold text-primary-text">ID</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Code</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Name</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Department</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Credit Hours</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Type</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Status</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex flex-col items-center space-y-2">
                    <BookOpen className="w-8 h-8 text-muted-text" />
                    <p className="text-xs text-secondary-text">No courses found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              courses.map((course) => (
                <TableRow 
                  key={course.id}
                  className="hover:bg-hover-bg transition-colors"
                >
                  <TableCell className="text-xs text-primary-text">{course.id}</TableCell>
                  <TableCell className="text-xs font-medium text-primary-text">{course.code}</TableCell>
                  <TableCell className="text-xs text-primary-text">{course.name}</TableCell>
                  <TableCell className="text-xs text-secondary-text">
                    {course.department.name} ({course.department.code})
                  </TableCell>
                  <TableCell className="text-xs text-primary-text">{course.creditHours}</TableCell>
                  <TableCell>{getTypeBadge(course.type)}</TableCell>
                  <TableCell>{getStatusBadge(course.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleViewCourse(course)}
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
                        onClick={() => handleEditCourse(course)}
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
                          setSelectedCourse(course);
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

      {/* Create Course Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Create New Course</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Add a new course to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create_code" className="text-xs text-primary-text">Course Code *</Label>
                <Input
                  id="create_code"
                  value={newCourse.code}
                  onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                  placeholder="Enter course code"
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create_name" className="text-xs text-primary-text">Course Name *</Label>
                <Input
                  id="create_name"
                  value={newCourse.name}
                  onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                  placeholder="Enter course name"
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create_type" className="text-xs text-primary-text">Course Type *</Label>
                <Select
                  value={newCourse.type}
                  onValueChange={(value: course_type) => {
                    // Reset hours when type changes
                    setNewCourse({ 
                      ...newCourse, 
                      type: value,
                      creditHours: '',
                      theoryHours: '',
                      labHours: '',
                    });
                  }}
                >
                  <SelectTrigger className="bg-card border-card-border text-primary-text">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-card-border">
                    <SelectItem value="THEORY" className="text-primary-text hover:bg-card/50">Theory</SelectItem>
                    <SelectItem value="LAB" className="text-primary-text hover:bg-card/50">Lab</SelectItem>
                    <SelectItem value="PROJECT" className="text-primary-text hover:bg-card/50">Project</SelectItem>
                    <SelectItem value="THESIS" className="text-primary-text hover:bg-card/50">Thesis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create_status" className="text-xs text-primary-text">Status *</Label>
                <Select
                  value={newCourse.status}
                  onValueChange={(value: course_status) => setNewCourse({ ...newCourse, status: value })}
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
            </div>
            {newCourse.type && (
              <div className="space-y-2">
                <Label htmlFor="create_creditHours" className="text-xs text-primary-text">Credit Hours *</Label>
                <Input
                  id="create_creditHours"
                  type="number"
                  min="1"
                  value={newCourse.creditHours}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (newCourse.type === 'LAB') {
                      setNewCourse({ 
                        ...newCourse, 
                        creditHours: val,
                        labHours: val,
                        theoryHours: '0',
                      });
                    } else {
                      setNewCourse({ 
                        ...newCourse, 
                        creditHours: val,
                        theoryHours: val,
                        labHours: '0',
                      });
                    }
                  }}
                  placeholder="Enter credit hours"
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="create_description" className="text-xs text-primary-text">Description</Label>
              <Input
                id="create_description"
                value={newCourse.description}
                onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                placeholder="Enter course description (optional)"
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
                setNewCourse({
                  code: '',
                  name: '',
                  description: '',
                  creditHours: '',
                  theoryHours: '',
                  labHours: '',
                  type: 'THEORY',
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
              onClick={handleCreateCourse}
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Course'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Course Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Course Details</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              View complete information about this course
            </DialogDescription>
          </DialogHeader>
          {isLoadingCourse ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-3">
                <div 
                  className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: primaryColor }}
                />
                <p className="text-xs text-secondary-text">Loading...</p>
              </div>
            </div>
          ) : viewingCourse ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-secondary-text mb-3">Course Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Course Code</p>
                    <p className="text-xs text-primary-text">{viewingCourse.code || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Course Name</p>
                    <p className="text-xs text-primary-text">{viewingCourse.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Department</p>
                    <p className="text-xs text-primary-text">
                      {viewingCourse.department ? `${viewingCourse.department.name} (${viewingCourse.department.code})` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Status</p>
                    <div className="mt-1">{getStatusBadge(viewingCourse.status)}</div>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Credit Hours</p>
                    <p className="text-xs text-primary-text">{viewingCourse.creditHours || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Course Type</p>
                    <div className="mt-1">{getTypeBadge(viewingCourse.type)}</div>
                  </div>
                  {viewingCourse.theoryHours !== undefined && (
                    <div>
                      <p className="text-[10px] text-muted-text mb-1">Theory Hours</p>
                      <p className="text-xs text-primary-text">{viewingCourse.theoryHours || 0}</p>
                    </div>
                  )}
                  {viewingCourse.labHours !== undefined && (
                    <div>
                      <p className="text-[10px] text-muted-text mb-1">Lab Hours</p>
                      <p className="text-xs text-primary-text">{viewingCourse.labHours || 0}</p>
                    </div>
                  )}
                  {viewingCourse.description && (
                    <div className="col-span-2">
                      <p className="text-[10px] text-muted-text mb-1">Description</p>
                      <p className="text-xs text-primary-text">{viewingCourse.description}</p>
                    </div>
                  )}
                </div>
              </div>
              {viewingCourse.stats && (
                <div>
                  <h3 className="text-xs font-semibold text-secondary-text mb-3">Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-muted-text mb-1">CLOs</p>
                      <p className="text-xs text-primary-text">{viewingCourse.stats.clos || 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-text mb-1">Course Offerings</p>
                      <p className="text-xs text-primary-text">{viewingCourse.stats.offerings || 0}</p>
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
                setViewingCourse(null);
              }}
            >
              Close
            </Button>
            {viewingCourse && (
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
                  const course = courses.find(c => c.id === viewingCourse.id);
                  if (course) {
                    setShowViewModal(false);
                    handleEditCourse(course);
                  }
                }}
              >
                <Edit className="h-3.5 w-3.5 mr-1.5" />
                Edit Course
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Course Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Edit Course</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Update course information
            </DialogDescription>
          </DialogHeader>
          {isLoadingCourse ? (
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
                  <Label htmlFor="edit_code" className="text-xs text-primary-text">Course Code *</Label>
                  <Input
                    id="edit_code"
                    value={editCourse.code}
                    onChange={(e) => setEditCourse({ ...editCourse, code: e.target.value })}
                    className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_name" className="text-xs text-primary-text">Course Name *</Label>
                  <Input
                    id="edit_name"
                    value={editCourse.name}
                    onChange={(e) => setEditCourse({ ...editCourse, name: e.target.value })}
                    className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_type" className="text-xs text-primary-text">Course Type *</Label>
                  <Select
                    value={editCourse.type}
                    onValueChange={(value: course_type) => {
                      // Reset hours when type changes
                      const currentHours = value === 'LAB' ? editCourse.labHours : editCourse.theoryHours;
                      setEditCourse({ 
                        ...editCourse, 
                        type: value,
                        creditHours: currentHours,
                        theoryHours: value === 'LAB' ? '0' : currentHours,
                        labHours: value === 'LAB' ? currentHours : '0',
                      });
                    }}
                  >
                    <SelectTrigger className="bg-card border-card-border text-primary-text">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-card-border">
                      <SelectItem value="THEORY" className="text-primary-text hover:bg-card/50">Theory</SelectItem>
                      <SelectItem value="LAB" className="text-primary-text hover:bg-card/50">Lab</SelectItem>
                      <SelectItem value="PROJECT" className="text-primary-text hover:bg-card/50">Project</SelectItem>
                      <SelectItem value="THESIS" className="text-primary-text hover:bg-card/50">Thesis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_status" className="text-xs text-primary-text">Status *</Label>
                  <Select
                    value={editCourse.status}
                    onValueChange={(value: course_status) => setEditCourse({ ...editCourse, status: value })}
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
              </div>
              {editCourse.type && (
                <div className="space-y-2">
                  <Label htmlFor="edit_creditHours" className="text-xs text-primary-text">Credit Hours *</Label>
                  <Input
                    id="edit_creditHours"
                    type="number"
                    min="1"
                    value={editCourse.creditHours}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (editCourse.type === 'LAB') {
                        setEditCourse({ 
                          ...editCourse, 
                          creditHours: val,
                          labHours: val,
                          theoryHours: '0',
                        });
                      } else {
                        setEditCourse({ 
                          ...editCourse, 
                          creditHours: val,
                          theoryHours: val,
                          labHours: '0',
                        });
                      }
                    }}
                    placeholder="Enter credit hours"
                    className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="edit_description" className="text-xs text-primary-text">Description</Label>
                <Input
                  id="edit_description"
                  value={editCourse.description}
                  onChange={(e) => setEditCourse({ ...editCourse, description: e.target.value })}
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
                setSelectedCourse(null);
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
              onClick={handleUpdateCourse}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Course'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Course Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-card border-card-border p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Delete Course</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Are you sure you want to delete{' '}
              {selectedCourse ? `${selectedCourse.name} (${selectedCourse.code})` : 'this course'}
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
                setSelectedCourse(null);
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
