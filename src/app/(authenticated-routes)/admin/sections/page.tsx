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
import { toast } from 'sonner';
import { Plus, Search, UserCheck, AlertCircle, Eye, Edit, Trash2, Loader2, Users, UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';

interface Section {
  id: number;
  name: string;
  courseOffering: {
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
  };
  faculty: {
    id: number;
    user: {
      first_name: string;
      last_name: string;
      email: string;
    };
  } | null;
  batch: {
    id: string;
    name: string;
  };
  maxStudents: number;
  currentStudents: number;
  status: 'active' | 'inactive' | 'suspended' | 'deleted';
}

interface CourseOffering {
  id: number;
  course: {
    code: string;
    name: string;
  };
  semester: {
    name: string;
  };
}

interface Batch {
  id: string;
  name: string;
}

interface Faculty {
  id: number;
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export default function SectionsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  
  const [sections, setSections] = useState<Section[]>([]);
  const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
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
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showBulkEnrollModal, setShowBulkEnrollModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [viewingSection, setViewingSection] = useState<any>(null);
  const [isLoadingSection, setIsLoadingSection] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isBulkEnrolling, setIsBulkEnrolling] = useState(false);
  
  // Student enrollment states
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  
  // Form states
  const [newSection, setNewSection] = useState({
    name: '',
    courseOfferingId: '',
    batchId: '',
    facultyId: '',
    maxStudents: '',
  });
  const [editSection, setEditSection] = useState({
    name: '',
    courseOfferingId: '',
    batchId: '',
    facultyId: '',
    maxStudents: '',
    status: 'active' as 'active' | 'inactive' | 'suspended' | 'deleted',
  });
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(status !== 'all' && { status }),
      });

      const response = await fetch(`/api/sections?${queryParams}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setSections(data.data);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        setError(data.error || 'Failed to fetch sections');
        toast.error(data.error || 'Failed to fetch sections');
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
      setError('Failed to fetch sections');
      toast.error('Failed to fetch sections');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseOfferings = async () => {
    try {
      const response = await fetch('/api/courses/offerings?limit=1000', {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setCourseOfferings(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching course offerings:', error);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/batches?limit=1000', {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setBatches(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const fetchFaculty = async () => {
    try {
      const response = await fetch('/api/faculties', {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setFaculty(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching faculty:', error);
    }
  };

  useEffect(() => {
    if (mounted) {
      fetchSections();
      fetchCourseOfferings();
      fetchBatches();
      fetchFaculty();
    }
  }, [mounted, page, search, status]);

  const handleViewSection = async (section: Section) => {
    setSelectedSection(section);
    setIsLoadingSection(true);
    setShowViewModal(true);
    try {
      const response = await fetch(`/api/sections/${section.id}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch section');
      const data = await response.json();
      setViewingSection(data.data);
      
      // Fetch enrolled students
      const studentsResponse = await fetch(`/api/sections/${section.id}/students`, {
        credentials: 'include',
      });
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        setEnrolledStudents(Array.isArray(studentsData) ? studentsData : []);
      }
    } catch (error) {
      console.error('Error fetching section:', error);
      toast.error('Failed to load section details');
      setShowViewModal(false);
    } finally {
      setIsLoadingSection(false);
    }
  };

  const handleEditSection = async (section: Section) => {
    setSelectedSection(section);
    setIsLoadingSection(true);
    setShowEditModal(true);
    try {
      const response = await fetch(`/api/sections/${section.id}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch section');
      const data = await response.json();
      const sec = data.data;
      setEditSection({
        name: sec.name || '',
        courseOfferingId: sec.courseOffering?.id?.toString() || '',
        batchId: sec.batch?.id?.toString() || '',
        facultyId: sec.faculty?.id?.toString() || 'none',
        maxStudents: sec.maxStudents?.toString() || '',
        status: (sec.status || 'active') as 'active' | 'inactive' | 'suspended' | 'deleted',
      });
    } catch (error) {
      console.error('Error fetching section:', error);
      toast.error('Failed to load section details');
      setShowEditModal(false);
    } finally {
      setIsLoadingSection(false);
    }
  };

  const handleCreateSection = async () => {
    if (!newSection.name.trim() || !newSection.courseOfferingId || !newSection.batchId || !newSection.maxStudents) {
      toast.error('Please fill in all required fields');
      return;
    }

    const maxStudentsNum = Number(newSection.maxStudents);
    if (isNaN(maxStudentsNum) || maxStudentsNum < 1) {
      toast.error('Please enter a valid max students value');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newSection.name,
          courseOfferingId: Number(newSection.courseOfferingId),
          batchId: newSection.batchId,
          facultyId: newSection.facultyId && newSection.facultyId !== 'none' ? Number(newSection.facultyId) : null,
          maxStudents: maxStudentsNum,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create section');
      }

      toast.success('Section created successfully');
      setShowCreateModal(false);
      setNewSection({
        name: '',
        courseOfferingId: '',
        batchId: '',
        facultyId: '',
        maxStudents: '',
      });
      fetchSections();
    } catch (error) {
      console.error('Error creating section:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create section');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateSection = async () => {
    if (!selectedSection || !editSection.name.trim() || !editSection.courseOfferingId || !editSection.batchId || !editSection.maxStudents) {
      toast.error('Please fill in all required fields');
      return;
    }

    const maxStudentsNum = Number(editSection.maxStudents);
    if (isNaN(maxStudentsNum) || maxStudentsNum < 1) {
      toast.error('Please enter a valid max students value');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/sections/${selectedSection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: editSection.name,
          courseOfferingId: Number(editSection.courseOfferingId),
          batchId: editSection.batchId,
          facultyId: editSection.facultyId && editSection.facultyId !== 'none' ? Number(editSection.facultyId) : null,
          maxStudents: maxStudentsNum,
          status: editSection.status,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update section');
      }

      toast.success('Section updated successfully');
      setShowEditModal(false);
      setSelectedSection(null);
      fetchSections();
    } catch (error) {
      console.error('Error updating section:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update section');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSection) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/sections?id=${selectedSection.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete section');
      }

      toast.success('Section deleted successfully');
      setShowDeleteDialog(false);
      setSelectedSection(null);
      fetchSections();
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete section');
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchAvailableStudents = async (section: Section) => {
    if (!section.batchId) {
      toast.error('Section batch not found');
      return;
    }

    setLoadingStudents(true);
    try {
      // Fetch all students from the batch
      const response = await fetch(`/api/students?batchId=${section.batchId}&status=active&limit=1000`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch students');
      const data = await response.json();
      
      if (data.success && data.data) {
        // Get enrolled students in this section
        const enrolledResponse = await fetch(`/api/sections/${section.id}/students`, {
          credentials: 'include',
        });
        let enrolledStudentIds: number[] = [];
        if (enrolledResponse.ok) {
          const enrolledData = await enrolledResponse.json();
          enrolledStudentIds = Array.isArray(enrolledData) 
            ? enrolledData.map((s: any) => s.id)
            : [];
        }

        // Filter out already enrolled students
        // Note: API will prevent same course enrollment, so we only filter this section
        const available = data.data.filter((student: any) => 
          !enrolledStudentIds.includes(student.id)
        );
        setAvailableStudents(available);
      }
    } catch (error) {
      console.error('Error fetching available students:', error);
      toast.error('Failed to load available students');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleOpenAddStudent = async (section: Section) => {
    setSelectedSection(section);
    setSelectedStudentId('');
    setStudentSearch('');
    setShowAddStudentModal(true);
    await fetchAvailableStudents(section);
  };

  const handleOpenBulkEnroll = async (section: Section) => {
    setSelectedSection(section);
    setSelectedStudentIds([]);
    setStudentSearch('');
    setShowBulkEnrollModal(true);
    await fetchAvailableStudents(section);
  };

  const handleAddStudent = async () => {
    if (!selectedSection || !selectedStudentId) {
      toast.error('Please select a student');
      return;
    }

    setIsAddingStudent(true);
    try {
      const response = await fetch(`/api/sections/${selectedSection.id}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ studentId: parseInt(selectedStudentId) }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to add student');
      }

      toast.success('Student added to section successfully');
      setShowAddStudentModal(false);
      setSelectedStudentId('');
      setStudentSearch('');
      await handleViewSection(selectedSection);
      fetchSections();
    } catch (error) {
      console.error('Error adding student:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add student');
    } finally {
      setIsAddingStudent(false);
    }
  };

  const handleBulkEnroll = async () => {
    if (!selectedSection || selectedStudentIds.length === 0) {
      toast.error('Please select at least one student');
      return;
    }

    setIsBulkEnrolling(true);
    try {
      const response = await fetch(`/api/sections/${selectedSection.id}/students/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ studentIds: selectedStudentIds }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to enroll students');
      }

      toast.success(`Successfully enrolled ${data.data.enrolled} student(s)`);
      setShowBulkEnrollModal(false);
      setSelectedStudentIds([]);
      setStudentSearch('');
      await handleViewSection(selectedSection);
      fetchSections();
    } catch (error) {
      console.error('Error bulk enrolling students:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to enroll students');
    } finally {
      setIsBulkEnrolling(false);
    }
  };

  const handleRemoveStudent = async (studentId: number) => {
    if (!selectedSection) return;

    try {
      const response = await fetch(`/api/sections/${selectedSection.id}/students`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ studentId }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to remove student');
      }

      toast.success('Student removed from section successfully');
      await handleViewSection(selectedSection);
      fetchSections();
    } catch (error) {
      console.error('Error removing student:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to remove student');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant='success'>Active</Badge>;
      case 'inactive':
        return <Badge variant='secondary'>Inactive</Badge>;
      case 'suspended':
        return <Badge variant='destructive'>Suspended</Badge>;
      case 'deleted':
        return <Badge variant='destructive'>Deleted</Badge>;
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
            Loading sections...
          </p>
        </div>
      </div>
    );
  }

  if (error && sections.length === 0) {
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
            onClick={() => fetchSections()}
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
            Sections
          </h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Manage course sections and student enrollments
          </p>
        </div>
        <button 
          onClick={() => {
            fetchCourseOfferings();
            fetchBatches();
            fetchFaculty();
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
          Create Section
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-text" />
              <Input
              placeholder="Search by section name, course, or faculty..."
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
            <SelectItem value="suspended" className="text-primary-text hover:bg-card/50">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

      {/* Sections Table */}
      <div className="rounded-lg border border-card-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
              <TableHead className="text-xs font-semibold text-primary-text">ID</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Section Name</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Course</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Semester</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Faculty</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Batch</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Students</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Status</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
            {sections.length === 0 ? (
                  <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="flex flex-col items-center space-y-2">
                    <UserCheck className="w-8 h-8 text-muted-text" />
                    <p className="text-xs text-secondary-text">No sections found</p>
                  </div>
                    </TableCell>
                  </TableRow>
                ) : (
              sections.map((section) => (
                <TableRow 
                  key={section.id}
                  className="hover:bg-hover-bg transition-colors"
                >
                  <TableCell className="text-xs text-primary-text">{section.id}</TableCell>
                  <TableCell className="text-xs font-medium text-primary-text">{section.name}</TableCell>
                      <TableCell>
                    <div>
                      <div className="text-xs font-medium text-primary-text">{section.courseOffering.course.code}</div>
                      <div className="text-xs text-secondary-text">{section.courseOffering.course.name}</div>
                    </div>
                      </TableCell>
                  <TableCell className="text-xs text-secondary-text">{section.courseOffering.semester.name}</TableCell>
                  <TableCell className="text-xs text-secondary-text">
                    {section.faculty 
                          ? `${section.faculty.user.first_name} ${section.faculty.user.last_name}`
                          : 'Not assigned'}
                      </TableCell>
                  <TableCell className="text-xs text-primary-text">{section.batch.name}</TableCell>
                  <TableCell className="text-xs text-primary-text">
                    {section.currentStudents} / {section.maxStudents}
                      </TableCell>
                  <TableCell>{getStatusBadge(section.status)}</TableCell>
                      <TableCell>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleViewSection(section)}
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
                          fetchCourseOfferings();
                          fetchBatches();
                          fetchFaculty();
                          handleEditSection(section);
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
                          setSelectedSection(section);
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

      {/* Create Section Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Create Section</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Add a new section for a course offering
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="create_name" className="text-xs text-primary-text">Section Name *</Label>
              <Input
                id="create_name"
                value={newSection.name}
                onChange={(e) => setNewSection({ ...newSection, name: e.target.value })}
                placeholder="Enter section name (e.g., A, B, Morning)"
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create_courseOffering" className="text-xs text-primary-text">Course Offering *</Label>
                <Select
                  value={newSection.courseOfferingId}
                  onValueChange={(value) => setNewSection({ ...newSection, courseOfferingId: value })}
                >
                  <SelectTrigger className="bg-card border-card-border text-primary-text">
                    <SelectValue placeholder="Select course offering" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-card-border">
                    {courseOfferings.map((offering) => (
                      <SelectItem key={offering.id} value={offering.id.toString()} className="text-primary-text hover:bg-card/50">
                        {offering.course.code} - {offering.course.name} ({offering.semester.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create_batch" className="text-xs text-primary-text">Batch *</Label>
                <Select
                  value={newSection.batchId}
                  onValueChange={(value) => setNewSection({ ...newSection, batchId: value })}
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create_faculty" className="text-xs text-primary-text">Faculty (Optional)</Label>
                <Select
                  value={newSection.facultyId}
                  onValueChange={(value) => setNewSection({ ...newSection, facultyId: value })}
                >
                  <SelectTrigger className="bg-card border-card-border text-primary-text">
                    <SelectValue placeholder="Select faculty (optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-card-border">
                    <SelectItem value="none" className="text-primary-text hover:bg-card/50">None</SelectItem>
                    {faculty.map((f) => (
                      <SelectItem key={f.id} value={f.id.toString()} className="text-primary-text hover:bg-card/50">
                        {f.user.first_name} {f.user.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create_maxStudents" className="text-xs text-primary-text">Max Students *</Label>
                <Input
                  id="create_maxStudents"
                  type="number"
                  min="1"
                  value={newSection.maxStudents}
                  onChange={(e) => setNewSection({ ...newSection, maxStudents: e.target.value })}
                  placeholder="Enter max students"
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <button
              onClick={() => {
                setShowCreateModal(false);
                setNewSection({
                  name: '',
                  courseOfferingId: '',
                  batchId: '',
                  facultyId: '',
                  maxStudents: '',
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
              onClick={handleCreateSection}
              disabled={isCreating}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              style={{
                backgroundColor: isCreating ? (isDarkMode ? '#6b7280' : '#9ca3af') : primaryColor,
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
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Section'
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Section Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Section Details</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              View complete information about this section
            </DialogDescription>
          </DialogHeader>
          {isLoadingSection ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-3">
                <div 
                  className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: primaryColor }}
                />
                <p className="text-xs text-secondary-text">Loading...</p>
              </div>
            </div>
          ) : viewingSection ? (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-secondary-text">Section Name</Label>
                  <div className="text-xs font-medium text-primary-text">
                    {viewingSection.name}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-secondary-text">Status</Label>
                  <div>{getStatusBadge(viewingSection.status)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-secondary-text">Course</Label>
                  <div className="text-xs font-medium text-primary-text">
                    {viewingSection.courseOffering?.course?.code} - {viewingSection.courseOffering?.course?.name}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-secondary-text">Semester</Label>
                  <div className="text-xs text-primary-text">
                    {viewingSection.courseOffering?.semester?.name}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-secondary-text">Faculty</Label>
                  <div className="text-xs text-primary-text">
                    {viewingSection.faculty 
                      ? `${viewingSection.faculty.user.first_name} ${viewingSection.faculty.user.last_name}`
                      : 'Not assigned'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-secondary-text">Batch</Label>
                  <div className="text-xs text-primary-text">
                    {viewingSection.batch?.name || 'N/A'}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-secondary-text">Students</Label>
                <div className="text-xs text-primary-text">
                  {viewingSection._count?.studentsections || 0} / {viewingSection.maxStudents || 0}
                </div>
              </div>
              
              {/* Enrolled Students List */}
              {enrolledStudents.length > 0 && (
                <div className="space-y-2 mt-4">
                  <Label className="text-xs font-semibold text-primary-text">Enrolled Students</Label>
                  <div className="rounded-lg border border-card-border max-h-60 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[10px] font-semibold text-primary-text h-8 py-1.5">Roll Number</TableHead>
                          <TableHead className="text-[10px] font-semibold text-primary-text h-8 py-1.5">Name</TableHead>
                          <TableHead className="text-[10px] font-semibold text-primary-text h-8 py-1.5">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {enrolledStudents.map((student: any) => (
                          <TableRow key={student.id}>
                            <TableCell className="text-xs text-primary-text py-1.5">{student.rollNumber}</TableCell>
                            <TableCell className="text-xs text-primary-text py-1.5">{student.user?.name || 'N/A'}</TableCell>
                            <TableCell className="py-1.5">
                              <button
                                onClick={() => handleRemoveStudent(student.id)}
                                className="px-2 py-0.5 rounded text-[10px] font-medium transition-colors"
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
                                Remove
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          ) : null}
          <DialogFooter className="mt-4 flex gap-2">
            <button
              onClick={() => {
                setShowViewModal(false);
                setViewingSection(null);
                setEnrolledStudents([]);
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
            {selectedSection && (
              <>
                <button
                  onClick={() => handleOpenAddStudent(selectedSection)}
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
                  <UserPlus className="w-3.5 h-3.5" />
                  Add Student
                </button>
                <button
                  onClick={() => handleOpenBulkEnroll(selectedSection)}
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
                  <Users className="w-3.5 h-3.5" />
                  Bulk Enroll
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    fetchCourseOfferings();
                    fetchBatches();
                    fetchFaculty();
                    handleEditSection(selectedSection);
                  }}
                  className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 flex items-center gap-1.5 text-white"
                  style={{
                    backgroundColor: primaryColor,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = primaryColorDark;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = primaryColor;
                  }}
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit
                </button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Section Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Edit Section</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Update section information
            </DialogDescription>
          </DialogHeader>
          {isLoadingSection ? (
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
              <div className="space-y-2">
                <Label htmlFor="edit_name" className="text-xs text-primary-text">Section Name *</Label>
                <Input
                  id="edit_name"
                  value={editSection.name}
                  onChange={(e) => setEditSection({ ...editSection, name: e.target.value })}
                  placeholder="Enter section name"
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_courseOffering" className="text-xs text-primary-text">Course Offering *</Label>
                  <Select
                    value={editSection.courseOfferingId}
                    onValueChange={(value) => setEditSection({ ...editSection, courseOfferingId: value })}
                  >
                    <SelectTrigger className="bg-card border-card-border text-primary-text">
                      <SelectValue placeholder="Select course offering" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-card-border">
                      {courseOfferings.map((offering) => (
                        <SelectItem key={offering.id} value={offering.id.toString()} className="text-primary-text hover:bg-card/50">
                          {offering.course.code} - {offering.course.name} ({offering.semester.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_batch" className="text-xs text-primary-text">Batch *</Label>
                  <Select
                    value={editSection.batchId}
                    onValueChange={(value) => setEditSection({ ...editSection, batchId: value })}
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
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_faculty" className="text-xs text-primary-text">Faculty (Optional)</Label>
                  <Select
                    value={editSection.facultyId}
                    onValueChange={(value) => setEditSection({ ...editSection, facultyId: value })}
                  >
                    <SelectTrigger className="bg-card border-card-border text-primary-text">
                      <SelectValue placeholder="Select faculty (optional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-card-border">
                      <SelectItem value="none" className="text-primary-text hover:bg-card/50">None</SelectItem>
                      {faculty.map((f) => (
                        <SelectItem key={f.id} value={f.id.toString()} className="text-primary-text hover:bg-card/50">
                          {f.user.first_name} {f.user.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_maxStudents" className="text-xs text-primary-text">Max Students *</Label>
                  <Input
                    id="edit_maxStudents"
                    type="number"
                    min="1"
                    value={editSection.maxStudents}
                    onChange={(e) => setEditSection({ ...editSection, maxStudents: e.target.value })}
                    placeholder="Enter max students"
                    className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_status" className="text-xs text-primary-text">Status *</Label>
                <Select
                  value={editSection.status}
                  onValueChange={(value: 'active' | 'inactive' | 'suspended' | 'deleted') => setEditSection({ ...editSection, status: value })}
                >
                  <SelectTrigger className="bg-card border-card-border text-primary-text">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-card-border">
                    <SelectItem value="active" className="text-primary-text hover:bg-card/50">Active</SelectItem>
                    <SelectItem value="inactive" className="text-primary-text hover:bg-card/50">Inactive</SelectItem>
                    <SelectItem value="suspended" className="text-primary-text hover:bg-card/50">Suspended</SelectItem>
                    <SelectItem value="deleted" className="text-primary-text hover:bg-card/50">Deleted</SelectItem>
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
                setSelectedSection(null);
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
              onClick={handleUpdateSection}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Section'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Section Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-card border-card-border p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Delete Section</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Are you sure you want to delete this section? This action cannot be undone and will remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <button
              onClick={() => {
                setShowDeleteDialog(false);
                setSelectedSection(null);
              }}
              disabled={isDeleting}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 border border-card-border bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                color: isDeleting ? (isDarkMode ? '#6b7280' : '#9ca3af') : (isDarkMode ? '#ffffff' : '#111827'),
                borderColor: isDarkMode ? '#404040' : '#e5e7eb',
              }}
              onMouseEnter={(e) => {
                if (!isDeleting) {
                  e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isDeleting) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              style={{
                backgroundColor: isDeleting ? (isDarkMode ? '#6b7280' : '#9ca3af') : '#dc2626',
              }}
              onMouseEnter={(e) => {
                if (!isDeleting) {
                  e.currentTarget.style.backgroundColor = '#b91c1c';
                }
              }}
              onMouseLeave={(e) => {
                if (!isDeleting) {
                  e.currentTarget.style.backgroundColor = '#dc2626';
                }
              }}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Section'
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Student Dialog */}
      <Dialog open={showAddStudentModal} onOpenChange={setShowAddStudentModal}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Add Student to Section</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Select a student from the batch to enroll in this section
            </DialogDescription>
          </DialogHeader>
          {loadingStudents ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-3">
                <div 
                  className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: primaryColor }}
                />
                <p className="text-xs text-secondary-text">Loading students...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-xs text-primary-text">Search Students</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-text" />
                  <Input
                    placeholder="Search by roll number or name..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pl-7 h-8 text-xs bg-card border-card-border text-primary-text placeholder:text-secondary-text"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-primary-text">Select Student *</Label>
                <div className="rounded-lg border border-card-border max-h-60 overflow-y-auto">
                  {availableStudents.filter((student: any) => {
                    const search = studentSearch.toLowerCase();
                    return !search || 
                      student.rollNumber.toLowerCase().includes(search) ||
                      `${student.user?.firstName || ''} ${student.user?.lastName || ''}`.toLowerCase().includes(search);
                  }).length === 0 ? (
                    <div className="text-center py-8 text-xs text-secondary-text">
                      No available students found
                    </div>
                  ) : (
                    <div className="divide-y divide-card-border">
                      {availableStudents
                        .filter((student: any) => {
                          const search = studentSearch.toLowerCase();
                          const name = `${student.user?.firstName || student.user?.first_name || ''} ${student.user?.lastName || student.user?.last_name || ''}`.toLowerCase();
                          return !search || 
                            student.rollNumber.toLowerCase().includes(search) ||
                            name.includes(search);
                        })
                        .map((student: any) => (
                          <div
                            key={student.id}
                            onClick={() => setSelectedStudentId(student.id.toString())}
                            className={`p-3 cursor-pointer transition-colors ${
                              selectedStudentId === student.id.toString()
                                ? 'bg-hover-bg'
                                : 'hover:bg-hover-bg'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-xs font-medium text-primary-text">{student.rollNumber}</div>
                                <div className="text-xs text-secondary-text">
                                  {student.user?.firstName || student.user?.first_name} {student.user?.lastName || student.user?.last_name}
                                </div>
                              </div>
                              {selectedStudentId === student.id.toString() && (
                                <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                                  style={{
                                    borderColor: primaryColor,
                                    backgroundColor: iconBgColor,
                                  }}
                                >
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="mt-4">
            <button
              onClick={() => {
                setShowAddStudentModal(false);
                setSelectedStudentId('');
                setStudentSearch('');
              }}
              disabled={isAddingStudent}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 border border-card-border bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                color: isDarkMode ? '#ffffff' : '#111827',
                borderColor: isDarkMode ? '#404040' : '#e5e7eb',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleAddStudent}
              disabled={isAddingStudent || !selectedStudentId}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              style={{
                backgroundColor: isAddingStudent ? (isDarkMode ? '#6b7280' : '#9ca3af') : primaryColor,
              }}
              onMouseEnter={(e) => {
                if (!isAddingStudent && !e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = primaryColorDark;
                }
              }}
              onMouseLeave={(e) => {
                if (!isAddingStudent && !e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = primaryColor;
                }
              }}
            >
              {isAddingStudent ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  Add Student
                </>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Enroll Dialog */}
      <Dialog open={showBulkEnrollModal} onOpenChange={setShowBulkEnrollModal}>
        <DialogContent className="bg-card border-card-border max-w-3xl max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Bulk Enroll Students</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Select multiple students to enroll in this section at once
            </DialogDescription>
          </DialogHeader>
          {loadingStudents ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-3">
                <div 
                  className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: primaryColor }}
                />
                <p className="text-xs text-secondary-text">Loading students...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-primary-text">
                  Available Students ({availableStudents.length})
                </Label>
                <div className="text-xs text-secondary-text">
                  Selected: {selectedStudentIds.length}
                </div>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-text" />
                  <Input
                    placeholder="Search by roll number or name..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pl-7 h-8 text-xs bg-card border-card-border text-primary-text placeholder:text-secondary-text"
                  />
                </div>
              </div>
              <div className="rounded-lg border border-card-border max-h-96 overflow-y-auto">
                {availableStudents.filter((student: any) => {
                  const search = studentSearch.toLowerCase();
                  return !search || 
                    student.rollNumber.toLowerCase().includes(search) ||
                    `${student.user?.firstName || ''} ${student.user?.lastName || ''}`.toLowerCase().includes(search);
                }).length === 0 ? (
                  <div className="text-center py-8 text-xs text-secondary-text">
                    No available students found
                  </div>
                ) : (
                  <div className="divide-y divide-card-border">
                      {availableStudents
                        .filter((student: any) => {
                          const search = studentSearch.toLowerCase();
                          const name = `${student.user?.firstName || student.user?.first_name || ''} ${student.user?.lastName || student.user?.last_name || ''}`.toLowerCase();
                          return !search || 
                            student.rollNumber.toLowerCase().includes(search) ||
                            name.includes(search);
                        })
                        .map((student: any) => {
                          const isSelected = selectedStudentIds.includes(student.id);
                          return (
                            <div
                              key={student.id}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedStudentIds(selectedStudentIds.filter(id => id !== student.id));
                                } else {
                                  setSelectedStudentIds([...selectedStudentIds, student.id]);
                                }
                              }}
                              className={`p-3 cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-hover-bg'
                                  : 'hover:bg-hover-bg'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-xs font-medium text-primary-text">{student.rollNumber}</div>
                                  <div className="text-xs text-secondary-text">
                                    {student.user?.firstName || student.user?.first_name} {student.user?.lastName || student.user?.last_name}
                                  </div>
                                </div>
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                  isSelected ? 'border-primary' : 'border-card-border'
                                }`}
                                  style={isSelected ? {
                                    borderColor: primaryColor,
                                    backgroundColor: iconBgColor,
                                  } : {}}
                                >
                                  {isSelected && (
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                  </div>
                )}
              </div>
              {selectedStudentIds.length > 0 && (
                <div className="text-xs text-secondary-text">
                  {selectedStudentIds.length} student(s) selected
                </div>
              )}
            </div>
          )}
          <DialogFooter className="mt-4">
            <button
              onClick={() => {
                setShowBulkEnrollModal(false);
                setSelectedStudentIds([]);
                setStudentSearch('');
              }}
              disabled={isBulkEnrolling}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 border border-card-border bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                color: isDarkMode ? '#ffffff' : '#111827',
                borderColor: isDarkMode ? '#404040' : '#e5e7eb',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleBulkEnroll}
              disabled={isBulkEnrolling || selectedStudentIds.length === 0}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              style={{
                backgroundColor: isBulkEnrolling ? (isDarkMode ? '#6b7280' : '#9ca3af') : primaryColor,
              }}
              onMouseEnter={(e) => {
                if (!isBulkEnrolling && !e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = primaryColorDark;
                }
              }}
              onMouseLeave={(e) => {
                if (!isBulkEnrolling && !e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = primaryColor;
                }
              }}
            >
              {isBulkEnrolling ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Enrolling...
                </>
              ) : (
                <>
                  <Users className="w-3.5 h-3.5" />
                  Enroll {selectedStudentIds.length > 0 ? `${selectedStudentIds.length} ` : ''}Student(s)
                </>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
