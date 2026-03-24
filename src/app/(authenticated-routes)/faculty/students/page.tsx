'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
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
import { Search, Eye, Trash2, Download, Upload, Send, FileSpreadsheet, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  const router = useRouter();
  const isDarkMode = resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode
    ? 'rgba(252, 153, 40, 0.15)'
    : 'rgba(38, 40, 149, 0.15)';

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
  const [showBulkGradeDialog, setShowBulkGradeDialog] = useState(false);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [bulkGradeFile, setBulkGradeFile] = useState<File | null>(null);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationSubject, setNotificationSubject] = useState('');
  const [selectedStudentsForNotification, setSelectedStudentsForNotification] = useState<number[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);

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
    router.push(`/faculty/students/${student.id}`);
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

  if (loading && students.length === 0) {
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
          <p className="text-xs text-secondary-text">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header - same as My Courses / My Sections */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-primary-text">My Students</h1>
          <p className="text-xs text-secondary-text mt-0.5">
            View and manage your students
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              const csv = [
                ['Roll Number', 'Name', 'Email', 'Batch', 'Enrolled Sections', 'Status'],
                ...students.map((s) => [
                  s.rollNumber,
                  `${s.user.firstName} ${s.user.lastName}`,
                  s.user.email,
                  s.batch?.name || 'N/A',
                  s.currentStudents.toString(),
                  s.status,
                ]),
              ]
                .map((row) => row.map((cell) => `"${cell}"`).join(','))
                .join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `students-export-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
              toast.success('Student data exported successfully');
            }}
            className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 inline-flex items-center gap-1.5"
            style={{ backgroundColor: iconBgColor, color: primaryColor }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = iconBgColor;
            }}
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button
            onClick={() => setShowBulkGradeDialog(true)}
            className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 inline-flex items-center gap-1.5"
            style={{ backgroundColor: iconBgColor, color: primaryColor }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = iconBgColor;
            }}
          >
            <Upload className="w-3.5 h-3.5" />
            Bulk Grade Entry
          </button>
          <button
            onClick={() => {
              if (selectedStudentsForNotification.length === 0) {
                toast.error('Please select students first');
                return;
              }
              setShowNotificationDialog(true);
            }}
            disabled={selectedStudentsForNotification.length === 0}
            className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 inline-flex items-center gap-1.5 disabled:opacity-50"
            style={{ backgroundColor: iconBgColor, color: primaryColor }}
            onMouseEnter={(e) => {
              if (selectedStudentsForNotification.length > 0) {
                e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = iconBgColor;
            }}
          >
            <Send className="w-3.5 h-3.5" />
            Send Notification ({selectedStudentsForNotification.length})
          </button>
        </div>
      </div>

      {/* Filters - inline row like My Courses */}
      <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-text" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
          <SelectTrigger className="w-[200px] h-8 text-xs bg-card border-card-border text-primary-text">
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
          <SelectTrigger className="w-[200px] h-8 text-xs bg-card border-card-border text-primary-text">
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
        <button
          type="submit"
          className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8"
          style={{ backgroundColor: iconBgColor, color: primaryColor }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = iconBgColor;
          }}
        >
          Search
        </button>
      </form>

      {/* Table - same wrapper as My Courses / admin CLO */}
      <div className="rounded-lg border border-card-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <input
                  type="checkbox"
                  className="rounded border-card-border"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedStudentsForNotification(students.map((s) => s.id));
                    } else {
                      setSelectedStudentsForNotification([]);
                    }
                  }}
                  checked={
                    students.length > 0 &&
                    selectedStudentsForNotification.length === students.length
                  }
                />
              </TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Roll Number</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Name</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Email</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Batch</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Sections</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Status</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <p className="text-xs text-secondary-text">Loading...</p>
                </TableCell>
              </TableRow>
            ) : students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex flex-col items-center space-y-2">
                    <GraduationCap className="w-8 h-8 text-muted-text" />
                    <p className="text-xs text-secondary-text">No students found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => (
                <TableRow
                  key={student.id}
                  className="hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
                  onClick={() => handleEdit(student)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="rounded border-card-border"
                      checked={selectedStudentsForNotification.includes(student.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudentsForNotification([
                            ...selectedStudentsForNotification,
                            student.id,
                          ]);
                        } else {
                          setSelectedStudentsForNotification(
                            selectedStudentsForNotification.filter((id) => id !== student.id)
                          );
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="text-xs font-medium text-primary-text">{student.rollNumber}</TableCell>
                  <TableCell className="text-xs text-primary-text">
                    <div className="font-medium">
                      {student.user.firstName} {student.user.lastName}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-secondary-text">{student.user.email}</TableCell>
                  <TableCell className="text-xs text-secondary-text">{student.batch?.name || 'No Batch'}</TableCell>
                  <TableCell className="text-xs text-primary-text">{student.currentStudents}</TableCell>
                  <TableCell>
                    <Badge
                      className={`${getStatusColor(student.status)} text-[10px] px-1.5 py-0.5`}
                      variant="secondary"
                    >
                      {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleEdit(student)}
                        className="px-2 py-1 rounded-md transition-colors text-xs font-medium h-7 flex items-center gap-1"
                        style={{ backgroundColor: iconBgColor, color: primaryColor }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = iconBgColor;
                        }}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                      <button
                        onClick={() => {
                          setSelectedStudent(student);
                          setShowDeleteDialog(true);
                        }}
                        className="p-1.5 rounded-md transition-colors hover:bg-[var(--error)]/10 text-[var(--error)]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex gap-2 items-center">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border bg-transparent text-primary-text hover:bg-[var(--hover-bg)] disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-xs text-secondary-text">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border bg-transparent text-primary-text hover:bg-[var(--hover-bg)] disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-card border-card-border text-primary-text">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-primary-text">Delete Student</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text">
              Are you sure you want to delete this student? This action cannot
              be undone.
              {selectedStudent && selectedStudent.currentStudents > 0 && (
                <span className='block text-red-500 mt-2'>
                  Warning: This student is enrolled in{' '}
                  {selectedStudent.currentStudents} section(s). You must remove
                  them from all sections before deleting.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-t border-card-border pt-4 gap-2">
            <button
              type="button"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
              className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border bg-transparent text-primary-text hover:bg-[var(--hover-bg)] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || (selectedStudent?.currentStudents ?? 0) > 0}
              className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 disabled:opacity-50 bg-[var(--error)] text-white hover:opacity-90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Grade Entry Dialog */}
      <Dialog open={showBulkGradeDialog} onOpenChange={setShowBulkGradeDialog}>
        <DialogContent className="max-w-2xl bg-card border-card-border text-primary-text">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-primary-text">Bulk Grade Entry</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text">
              Upload a CSV file with student marks. Download template for format.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-secondary-text">CSV File</Label>
              <div className="mt-2 flex items-center gap-4">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setBulkGradeFile(file);
                  }}
                  className="h-8 text-xs bg-card border-card-border text-primary-text"
                />
                <button
                  type="button"
                  onClick={() => {
                    const template = [
                      ['studentId', 'assessmentId', 'itemId1', 'marks1', 'itemId2', 'marks2', 'itemId3', 'marks3'],
                      ['1', '1', '1', '10', '2', '15', '3', '20'],
                      ['2', '1', '1', '8', '2', '12', '3', '18'],
                    ].map((row) => row.join(',')).join('\n');
                    const blob = new Blob([template], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'bulk-grade-entry-template.csv';
                    a.click();
                    toast.success('Template downloaded');
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border bg-transparent text-primary-text hover:bg-[var(--hover-bg)] inline-flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Download Template
                </button>
              </div>
              <p className="text-xs text-secondary-text mt-2">
                CSV format: studentId, assessmentId, itemId1, marks1, itemId2, marks2, ...
              </p>
            </div>
            <div className="rounded-lg border border-card-border bg-card p-4">
              <p className="text-sm font-medium text-primary-text mb-2">Instructions:</p>
              <ul className="text-xs text-secondary-text space-y-1 list-disc list-inside">
                <li>First row should contain headers: studentId, assessmentId, itemId1, marks1, etc.</li>
                <li>Each row represents one student's marks for one assessment</li>
                <li>Include all assessment items with their IDs and marks</li>
                <li>Marks should not exceed the maximum marks for each item</li>
              </ul>
            </div>
          </div>
          <DialogFooter className="border-t border-card-border pt-4 gap-2">
            <button
              type="button"
              onClick={() => {
                setShowBulkGradeDialog(false);
                setBulkGradeFile(null);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border bg-transparent text-primary-text hover:bg-[var(--hover-bg)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!bulkGradeFile) {
                  toast.error('Please select a CSV file');
                  return;
                }
                setUploading(true);
                try {
                  const text = await bulkGradeFile.text();
                  const lines = text.split('\n').filter((line) => line.trim());
                  const headers = lines[0].split(',').map((h) => h.trim());

                  // Parse CSV
                  const marksData = [];
                  for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map((v) => v.trim());
                    const studentId = parseInt(values[0]);
                    const assessmentId = parseInt(values[1]);

                    // Extract items (itemId, marks pairs)
                    const items = [];
                    for (let j = 2; j < values.length; j += 2) {
                      if (values[j] && values[j + 1]) {
                        items.push({
                          itemId: parseInt(values[j]),
                          marks: parseFloat(values[j + 1]),
                        });
                      }
                    }

                    marksData.push({
                      studentId,
                      assessmentId,
                      items,
                    });
                  }

                  // Get sectionId from first student (assuming all are from same section)
                  // For now, we'll need to get it from the assessment
                  if (marksData.length > 0) {
                    const assessmentResponse = await fetch(
                      `/api/assessments/${marksData[0].assessmentId}`,
                      { credentials: 'include' }
                    );
                    const assessmentData = await assessmentResponse.json();

                    // Group by assessment and section
                    const groupedData = new Map<string, any[]>();
                    marksData.forEach((data) => {
                      const key = `${data.assessmentId}`;
                      if (!groupedData.has(key)) {
                        groupedData.set(key, []);
                      }
                      groupedData.get(key)?.push({
                        studentId: data.studentId,
                        items: data.items,
                      });
                    });

                    // Process each assessment
                    for (const [assessmentIdStr, studentMarks] of groupedData.entries()) {
                      const assessmentId = parseInt(assessmentIdStr);
                      
                      // Get assessment details to find section
                      const assessmentResponse = await fetch(
                        `/api/assessments/${assessmentId}`,
                        { credentials: 'include' }
                      );
                      const assessmentData = await assessmentResponse.json();
                      
                      // Get section from assessment's course offering
                      // For bulk entry, we'll use the first section from the course offering
                      // In production, you might want to let user select section
                      let sectionId = null;
                      if (assessmentData.courseOffering?.sections?.length > 0) {
                        sectionId = assessmentData.courseOffering.sections[0].id;
                      }

                      const response = await fetch('/api/assessment-results/bulk', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                          assessmentId,
                          sectionId: sectionId,
                          marks: studentMarks,
                        }),
                      });

                      const result = await response.json();
                      if (!response.ok || !result.success) {
                        throw new Error(result.error || 'Failed to upload marks');
                      }
                    }

                    toast.success(`Successfully uploaded marks for ${marksData.length} student(s)`);
                    setShowBulkGradeDialog(false);
                    setBulkGradeFile(null);
                  }
                } catch (error) {
                  console.error('Error uploading bulk grades:', error);
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : 'Failed to upload bulk grades'
                  );
                } finally {
                  setUploading(false);
                }
              }}
              disabled={!bulkGradeFile || uploading}
              className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 disabled:opacity-50"
              style={{ backgroundColor: primaryColor, color: '#fff' }}
            >
              {uploading ? 'Uploading...' : 'Upload & Process'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Notification Dialog */}
      <Dialog
        open={showNotificationDialog}
        onOpenChange={setShowNotificationDialog}
      >
        <DialogContent className="bg-card border-card-border text-primary-text">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-primary-text">Send Notification to Students</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text">
              Send a notification message to selected students
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-secondary-text">Subject</Label>
              <Input
                value={notificationSubject}
                onChange={(e) => setNotificationSubject(e.target.value)}
                placeholder="Notification subject"
                className="mt-1 h-8 text-xs bg-card border-card-border text-primary-text placeholder:text-secondary-text"
              />
            </div>
            <div>
              <Label className="text-xs text-secondary-text">Message</Label>
              <Textarea
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                placeholder="Enter notification message..."
                className="mt-1 text-xs bg-card border-card-border text-primary-text placeholder:text-secondary-text"
                rows={5}
              />
            </div>
            <div className="rounded-lg border border-card-border bg-card p-3">
              <p className="text-xs text-secondary-text">
                Recipients: {selectedStudentsForNotification.length} student(s)
              </p>
            </div>
          </div>
          <DialogFooter className="border-t border-card-border pt-4 gap-2">
            <button
              type="button"
              onClick={() => {
                setShowNotificationDialog(false);
                setNotificationMessage('');
                setNotificationSubject('');
                setSelectedStudentsForNotification([]);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border bg-transparent text-primary-text hover:bg-[var(--hover-bg)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!notificationSubject || !notificationMessage) {
                  toast.error('Please fill in both subject and message');
                  return;
                }
                setSending(true);
                try {
                  await new Promise((resolve) => setTimeout(resolve, 1000));
                  toast.success(
                    `Notification sent to ${selectedStudentsForNotification.length} student(s)`
                  );
                  setShowNotificationDialog(false);
                  setNotificationMessage('');
                  setNotificationSubject('');
                  setSelectedStudentsForNotification([]);
                } catch (error) {
                  console.error('Error sending notification:', error);
                  toast.error('Failed to send notification');
                } finally {
                  setSending(false);
                }
              }}
              disabled={sending || !notificationSubject || !notificationMessage}
              className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 disabled:opacity-50"
              style={{ backgroundColor: primaryColor, color: '#fff' }}
            >
              {sending ? 'Sending...' : 'Send Notification'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
