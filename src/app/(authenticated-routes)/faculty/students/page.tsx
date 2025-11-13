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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Eye, Trash2, Download, Upload, Send, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        return 'bg-green-500';
      case 'inactive':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className='container mx-auto py-10'>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-3xl font-bold'>Students</h1>
          <p className='text-muted-foreground'>
            Manage student accounts and information
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={() => {
              // Export student data to CSV
              const csv = [
                ['Roll Number', 'Name', 'Email', 'Batch', 'Enrolled Sections', 'Status'],
                ...students.map((student) => [
                  student.rollNumber,
                  `${student.user.firstName} ${student.user.lastName}`,
                  student.user.email,
                  student.batch?.name || 'N/A',
                  student.currentStudents.toString(),
                  student.status,
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
          >
            <Download className='w-4 h-4 mr-2' />
            Export
          </Button>
          <Button
            variant='outline'
            onClick={() => setShowBulkGradeDialog(true)}
          >
            <Upload className='w-4 h-4 mr-2' />
            Bulk Grade Entry
          </Button>
          <Button
            variant='outline'
            onClick={() => {
              if (selectedStudentsForNotification.length === 0) {
                toast.error('Please select students first');
                return;
              }
              setShowNotificationDialog(true);
            }}
            disabled={selectedStudentsForNotification.length === 0}
          >
            <Send className='w-4 h-4 mr-2' />
            Send Notification ({selectedStudentsForNotification.length})
          </Button>
        </div>
      </div>

      <div className='flex items-center gap-4 mb-6'>
        <form
          onSubmit={handleSearch}
          className='flex-1 flex items-center gap-4'
        >
          <div className='relative flex-1'>
            <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Search students...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-8'
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Filter by status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Status</SelectItem>
              <SelectItem value='active'>Active</SelectItem>
              <SelectItem value='inactive'>Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={batchFilter}
            onValueChange={(value) => {
              setBatchFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Filter by batch' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Batches</SelectItem>
              {batches.map((batch) => (
                <SelectItem key={batch.id} value={batch.id}>
                  {batch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type='submit'>Search</Button>
        </form>
      </div>

          <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[50px]'>
                <input
                  type='checkbox'
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
              <TableHead>Roll Number</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Enrolled Sections</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className='text-center'>
                  Loading...
                </TableCell>
              </TableRow>
            ) : students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className='text-center'>
                  No students found
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <input
                      type='checkbox'
                      checked={selectedStudentsForNotification.includes(student.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudentsForNotification([
                            ...selectedStudentsForNotification,
                            student.id,
                          ]);
                        } else {
                          setSelectedStudentsForNotification(
                            selectedStudentsForNotification.filter(
                              (id) => id !== student.id
                            )
                          );
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>{student.rollNumber}</TableCell>
                  <TableCell>
                    {student.user.firstName} {student.user.lastName}
                  </TableCell>
                  <TableCell>{student.user.email}</TableCell>
                  <TableCell>{student.batch?.name || 'No Batch'}</TableCell>
                  <TableCell>{student.currentStudents}</TableCell>
                  <TableCell>
                    <Badge
                      className={getStatusColor(student.status)}
                      variant='secondary'
                    >
                      {student.status.charAt(0).toUpperCase() +
                        student.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex justify-end gap-2'>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => handleEdit(student)}
                      >
                        <Eye className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => {
                          setSelectedStudent(student);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className='h-4 w-4' />
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
        <div className='flex items-center justify-end gap-2 mt-4'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className='text-sm text-muted-foreground'>
            Page {page} of {totalPages}
          </span>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Student</DialogTitle>
            <DialogDescription>
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
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={handleDelete}
              disabled={deleting || (selectedStudent?.currentStudents ?? 0) > 0}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Grade Entry Dialog */}
      <Dialog open={showBulkGradeDialog} onOpenChange={setShowBulkGradeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Grade Entry</DialogTitle>
            <DialogDescription>
              Upload a CSV file with student marks. Download template for format.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>CSV File</Label>
              <div className="mt-2 flex items-center gap-4">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setBulkGradeFile(file);
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Generate template CSV
                    const template = [
                      ['studentId', 'assessmentId', 'itemId1', 'marks1', 'itemId2', 'marks2', 'itemId3', 'marks3'],
                      ['1', '1', '1', '10', '2', '15', '3', '20'],
                      ['2', '1', '1', '8', '2', '12', '3', '18'],
                    ]
                      .map((row) => row.join(','))
                      .join('\n');
                    const blob = new Blob([template], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'bulk-grade-entry-template.csv';
                    a.click();
                    toast.success('Template downloaded');
                  }}
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                CSV format: studentId, assessmentId, itemId1, marks1, itemId2, marks2, ...
              </p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Instructions:</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>First row should contain headers: studentId, assessmentId, itemId1, marks1, etc.</li>
                <li>Each row represents one student's marks for one assessment</li>
                <li>Include all assessment items with their IDs and marks</li>
                <li>Marks should not exceed the maximum marks for each item</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBulkGradeDialog(false);
                setBulkGradeFile(null);
              }}
            >
              Cancel
            </Button>
            <Button
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
            >
              {uploading ? 'Uploading...' : 'Upload & Process'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Notification Dialog */}
      <Dialog
        open={showNotificationDialog}
        onOpenChange={setShowNotificationDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Notification to Students</DialogTitle>
            <DialogDescription>
              Send a notification message to selected students
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Subject</Label>
              <Input
                value={notificationSubject}
                onChange={(e) => setNotificationSubject(e.target.value)}
                placeholder="Notification subject"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                placeholder="Enter notification message..."
                className="mt-1"
                rows={5}
              />
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Recipients: {selectedStudentsForNotification.length} student(s)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNotificationDialog(false);
                setNotificationMessage('');
                setNotificationSubject('');
                setSelectedStudentsForNotification([]);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!notificationSubject || !notificationMessage) {
                  toast.error('Please fill in both subject and message');
                  return;
                }

                setSending(true);
                try {
                  // In a real implementation, this would send emails/notifications
                  // For now, we'll just show a success message
                  // You can integrate with email service or notification system here

                  const selectedStudentsData = students.filter((s) =>
                    selectedStudentsForNotification.includes(s.id)
                  );

                  // Simulate sending (replace with actual notification API call)
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
            >
              {sending ? 'Sending...' : 'Send Notification'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
