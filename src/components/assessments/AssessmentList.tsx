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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { Eye, Trash2, Search, FileText, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Assessment {
  id: number;
  title: string;
  description: string;
  type: string;
  totalMarks: number;
  dueDate: string;
  weightage: number;
  instructions?: string;
  status?: string;
  courseOffering?: {
    id: number;
    course: {
      code: string;
      name: string;
    };
    semester: {
      name: string;
    };
  };
}

export function AssessmentList() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = mounted && resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const primaryColorDark = isDarkMode ? 'var(--orange-dark)' : 'var(--blue-dark)';
  const iconBgColor = isDarkMode
    ? 'rgba(252, 153, 40, 0.15)'
    : 'rgba(38, 40, 149, 0.15)';

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [filteredAssessments, setFilteredAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [courseOfferingFilter, setCourseOfferingFilter] = useState<string>('all');
  const [courseOfferings, setCourseOfferings] = useState<any[]>([]);
  const [isStudentRoute, setIsStudentRoute] = useState(false);
  const [isFacultyRoute, setIsFacultyRoute] = useState(false);

  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState<Assessment | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchAssessments = async () => {
    try {
      const apiUrl = isStudentRoute ? '/api/student/assessments' : '/api/assessments';
      const response = await fetch(apiUrl, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch assessments');
      const data = await response.json();
      const assessmentsList = data.success
        ? data.data
        : Array.isArray(data)
        ? data
        : [];
      setAssessments(assessmentsList);
      setFilteredAssessments(assessmentsList);
    } catch (error) {
      toast.error('Failed to load assessments');
      console.error('Error fetching assessments:', error);
      setAssessments([]);
      setFilteredAssessments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const studentRoute = window.location.pathname.startsWith('/student');
    const facultyRoute = window.location.pathname.startsWith('/faculty');
    setIsStudentRoute(studentRoute);
    setIsFacultyRoute(facultyRoute);
    fetchAssessments();
    if (!studentRoute) fetchCourseOfferings();
  }, []);

  const fetchCourseOfferings = async () => {
    try {
      const response = await fetch('/api/faculty/course-offerings', {
        credentials: 'include',
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) setCourseOfferings(result.data);
      }
    } catch (error) {
      console.error('Error fetching course offerings:', error);
    }
  };

  useEffect(() => {
    let filtered = [...assessments];
    if (searchTerm) {
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.courseOffering?.course.code
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          a.courseOffering?.course.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }
    if (typeFilter !== 'all') {
      filtered = filtered.filter((a) => a.type === typeFilter);
    }
    if (courseOfferingFilter !== 'all') {
      filtered = filtered.filter(
        (a) => a.courseOffering?.id === parseInt(courseOfferingFilter)
      );
    }
    setFilteredAssessments(filtered);
  }, [searchTerm, typeFilter, courseOfferingFilter, assessments]);

  const handleDeleteClick = (assessment: Assessment) => {
    setAssessmentToDelete(assessment);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!assessmentToDelete) return;
    try {
      setDeletingId(assessmentToDelete.id);
      const response = await fetch(`/api/assessments/${assessmentToDelete.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete assessment');
      toast.success('Assessment deleted successfully');
      setIsDeleteDialogOpen(false);
      setAssessmentToDelete(null);
      fetchAssessments();
    } catch (error) {
      toast.error('Failed to delete assessment');
      console.error('Error deleting assessment:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'published':
        return 'bg-[var(--success-green)] text-white';
      case 'completed':
        return 'bg-[var(--gray-500)] text-white';
      default:
        return 'bg-[var(--gray-500)] text-white';
    }
  };

  const formatType = (type: string) =>
    type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const uniqueTypes = Array.from(new Set(assessments.map((a) => a.type))).sort();

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] bg-page">
        <div className="flex flex-col items-center space-y-3">
          <div
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
            style={{
              borderTopColor: primaryColor,
              borderBottomColor: primaryColor,
              borderRightColor: 'transparent',
              borderLeftColor: 'transparent',
            }}
          />
          <p className="text-xs text-secondary-text">Loading assessments...</p>
        </div>
      </div>
    );
  }

  const assessmentsBasePath = isFacultyRoute ? '/faculty/assessments' : '/admin/assessments';

  return (
    <div className="space-y-4">
      {/* Filters - inline row like My Courses */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-text" />
            <Input
              placeholder="Search assessments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 h-8 text-xs bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
            />
          </div>
        </div>
        {!isStudentRoute && (
          <Select
            value={courseOfferingFilter}
            onValueChange={setCourseOfferingFilter}
          >
            <SelectTrigger className="w-[200px] h-8 text-xs bg-card border-card-border text-primary-text">
              <SelectValue placeholder="Filter by course" />
            </SelectTrigger>
            <SelectContent className="bg-card border-card-border">
              <SelectItem
                value="all"
                className="text-primary-text hover:bg-card/50 text-xs"
              >
                All Courses
              </SelectItem>
              {courseOfferings.map((offering) => (
                <SelectItem
                  key={offering.id}
                  value={offering.id.toString()}
                  className="text-primary-text hover:bg-card/50 text-xs"
                >
                  {offering.course.code} - {offering.semester.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px] h-8 text-xs bg-card border-card-border text-primary-text">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent className="bg-card border-card-border">
            <SelectItem
              value="all"
              className="text-primary-text hover:bg-card/50 text-xs"
            >
              All Types
            </SelectItem>
            {uniqueTypes.map((type) => (
              <SelectItem
                key={type}
                value={type}
                className="text-primary-text hover:bg-card/50 text-xs"
              >
                {formatType(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Assessments Table */}
      <div className="rounded-lg border border-card-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold text-primary-text">
                ID
              </TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">
                Course
              </TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">
                Title
              </TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">
                Type
              </TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">
                Total Marks
              </TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">
                Weightage
              </TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">
                Due Date
              </TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAssessments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex flex-col items-center space-y-2">
                    <Plus className="w-8 h-8 text-muted-text" />
                    <p className="text-xs text-secondary-text">
                      No assessments found
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredAssessments.map((assessment) => (
                <TableRow
                  key={assessment.id}
                  className="hover:bg-hover-bg transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedAssessment(assessment);
                    setIsViewDialogOpen(true);
                  }}
                >
                  <TableCell className="text-xs text-primary-text">
                    {assessment.id}
                  </TableCell>
                  <TableCell className="text-xs text-primary-text">
                    {assessment.courseOffering ? (
                      <div>
                        <div className="font-medium">
                          {assessment.courseOffering.course.code}
                        </div>
                        <div className="text-secondary-text">
                          {assessment.courseOffering.semester.name}
                        </div>
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-primary-text max-w-[180px] truncate">
                    {assessment.title}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className="text-[10px] px-1.5 py-0.5"
                      variant="secondary"
                    >
                      {formatType(assessment.type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-primary-text">
                    {assessment.totalMarks}
                  </TableCell>
                  <TableCell className="text-xs text-primary-text">
                    {assessment.weightage}%
                  </TableCell>
                  <TableCell className="text-xs text-secondary-text">
                    {format(new Date(assessment.dueDate), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedAssessment(assessment);
                          setIsViewDialogOpen(true);
                        }}
                        className="px-2 py-1 rounded-md transition-colors text-xs font-medium h-7 flex items-center gap-1"
                        style={{
                          backgroundColor: iconBgColor,
                          color: primaryColor,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkMode
                            ? 'rgba(252, 153, 40, 0.2)'
                            : 'rgba(38, 40, 149, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = iconBgColor;
                        }}
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                      {!isStudentRoute && (
                        <>
                          <button
                            onClick={() =>
                              router.push(
                                `${assessmentsBasePath}/${assessment.id}/items`
                              )
                            }
                            className="px-2 py-1 rounded-md transition-colors text-xs font-medium h-7 flex items-center gap-1"
                            style={{
                              backgroundColor: iconBgColor,
                              color: primaryColor,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = isDarkMode
                                ? 'rgba(252, 153, 40, 0.2)'
                                : 'rgba(38, 40, 149, 0.2)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                iconBgColor;
                            }}
                            title="Items"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(assessment)}
                            disabled={deletingId === assessment.id}
                            className="p-1.5 rounded-md transition-colors hover:bg-[var(--error)]/10 text-[var(--error)] disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* View Assessment Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-card border-card-border max-w-lg max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">
              Assessment Details
            </DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              View assessment information
            </DialogDescription>
          </DialogHeader>
          {selectedAssessment && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-muted-text mb-1">Title</p>
                  <p className="text-sm font-medium text-primary-text">
                    {selectedAssessment.title}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-text mb-1">Type</p>
                  <p className="text-sm text-primary-text">
                    {formatType(selectedAssessment.type)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-text mb-1">Course</p>
                  <p className="text-sm text-primary-text">
                    {selectedAssessment.courseOffering
                      ? `${selectedAssessment.courseOffering.course.code} - ${selectedAssessment.courseOffering.course.name}`
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-text mb-1">Semester</p>
                  <p className="text-sm text-primary-text">
                    {selectedAssessment.courseOffering?.semester.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-text mb-1">
                    Total Marks
                  </p>
                  <p className="text-sm text-primary-text">
                    {selectedAssessment.totalMarks}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-text mb-1">Weightage</p>
                  <p className="text-sm text-primary-text">
                    {selectedAssessment.weightage}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-text mb-1">Due Date</p>
                  <p className="text-sm text-primary-text">
                    {format(new Date(selectedAssessment.dueDate), 'PPP')}
                  </p>
                </div>
                {selectedAssessment.status && (
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Status</p>
                    <Badge
                      className={`${getStatusColor(selectedAssessment.status)} text-[10px] px-1.5 py-0.5`}
                      variant="secondary"
                    >
                      {selectedAssessment.status.charAt(0).toUpperCase() +
                        selectedAssessment.status.slice(1)}
                    </Badge>
                  </div>
                )}
              </div>
              {selectedAssessment.description && (
                <div>
                  <p className="text-[10px] text-muted-text mb-1">
                    Description
                  </p>
                  <p className="text-sm text-primary-text">
                    {selectedAssessment.description}
                  </p>
                </div>
              )}
              {selectedAssessment.instructions && (
                <div>
                  <p className="text-[10px] text-muted-text mb-1">
                    Instructions
                  </p>
                  <p className="text-sm text-primary-text">
                    {selectedAssessment.instructions}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="mt-4">
            <button
              onClick={() => setIsViewDialogOpen(false)}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 border border-card-border bg-transparent"
              style={{
                color: isDarkMode ? '#ffffff' : '#111827',
                borderColor: isDarkMode ? '#404040' : '#e5e7eb',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDarkMode
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Assessment Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-card border-card-border p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">
              Delete Assessment
            </DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Are you sure you want to delete &quot;{assessmentToDelete?.title}&quot;? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <button
              onClick={() => setIsDeleteDialogOpen(false)}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 border border-card-border bg-transparent"
              style={{
                color: isDarkMode ? '#ffffff' : '#111827',
                borderColor: isDarkMode ? '#404040' : '#e5e7eb',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDarkMode
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={!!deletingId}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8"
              style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#b91c1c';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#dc2626';
              }}
            >
              {deletingId ? 'Deleting...' : 'Delete'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
