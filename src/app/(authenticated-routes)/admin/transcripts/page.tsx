'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Search,
  Download,
  Trash2,
  Eye,
  FileText,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { transcript_type, transcript_status } from '@prisma/client';

interface Transcript {
  id: number;
  student: {
    id: number;
    rollNumber: string;
    user: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
    };
    program: {
      id: number;
      name: string;
      code: string;
    };
    department: {
      id: number;
      name: string;
      code: string;
    };
  };
  semester: {
    id: number;
    name: string;
  } | null;
  transcriptType: transcript_type;
  totalCGPA: number | null;
  totalCreditHours: number | null;
  isOfficial: boolean;
  status: transcript_status;
  generatedAt: string;
  filePath: string | null;
  generator: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

interface Student {
  id: number;
  rollNumber: string;
  user: {
    first_name: string;
    last_name: string;
  };
  program: {
    name: string;
    code: string;
  };
}

interface Semester {
  id: number;
  name: string;
}

export default function TranscriptsPage() {
  const router = useRouter();
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    studentId: '',
    semesterId: '',
    transcriptType: '' as transcript_type | '',
    isOfficial: false,
  });

  useEffect(() => {
    fetchTranscripts();
    fetchStudents();
    fetchSemesters();
    
    // Check for studentId in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const studentId = urlParams.get('studentId');
    if (studentId) {
      setFormData((prev) => ({ ...prev, studentId }));
      setIsCreateDialogOpen(true);
    }
  }, []);

  useEffect(() => {
    fetchTranscripts();
  }, [statusFilter]);

  const fetchTranscripts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/transcripts?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch transcripts');
      const data = await response.json();
      if (data.success) {
        let transcriptsData = data.data;
        
        // Filter by search
        if (search) {
          const searchLower = search.toLowerCase();
          transcriptsData = transcriptsData.filter(
            (t: Transcript) =>
              t.student.rollNumber.toLowerCase().includes(searchLower) ||
              t.student.user.first_name.toLowerCase().includes(searchLower) ||
              t.student.user.last_name.toLowerCase().includes(searchLower) ||
              t.student.program.name.toLowerCase().includes(searchLower)
          );
        }
        
        setTranscripts(transcriptsData);
      }
    } catch (error) {
      console.error('Error fetching transcripts:', error);
      toast.error('Failed to load transcripts');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students?status=active');
      if (!response.ok) throw new Error('Failed to fetch students');
      const data = await response.json();
      if (data.success) {
        setStudents(data.data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchSemesters = async () => {
    try {
      const response = await fetch('/api/semesters');
      if (!response.ok) throw new Error('Failed to fetch semesters');
      const data = await response.json();
      if (data.success) {
        setSemesters(data.data);
      }
    } catch (error) {
      console.error('Error fetching semesters:', error);
    }
  };

  const handleCreate = async () => {
    if (!formData.studentId || !formData.transcriptType) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setIsGenerating(true);
      const response = await fetch('/api/transcripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: parseInt(formData.studentId),
          semesterId: formData.semesterId ? parseInt(formData.semesterId) : undefined,
          transcriptType: formData.transcriptType,
          isOfficial: formData.isOfficial,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate transcript');
      }

      toast.success('Transcript generated successfully');
      setIsCreateDialogOpen(false);
      setFormData({
        studentId: '',
        semesterId: '',
        transcriptType: '',
        isOfficial: false,
      });
      fetchTranscripts();
    } catch (error) {
      console.error('Error generating transcript:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to generate transcript'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteClick = (transcript: Transcript) => {
    setSelectedTranscript(transcript);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedTranscript) return;

    try {
      const response = await fetch(`/api/transcripts/${selectedTranscript.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete transcript');
      }

      toast.success('Transcript deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedTranscript(null);
      fetchTranscripts();
    } catch (error) {
      console.error('Error deleting transcript:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete transcript'
      );
    }
  };

  const getStatusBadge = (status: transcript_status) => {
    switch (status) {
      case 'generated':
        return <Badge variant="default">Generated</Badge>;
      case 'issued':
        return <Badge variant="default">Issued</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTranscriptTypeLabel = (type: transcript_type) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Transcripts
          </h1>
          <p className="text-muted-foreground">
            Generate and manage student academic transcripts
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Generate Transcript
        </Button>
      </div>

      <Card className="p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transcripts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="generated">Generated</SelectItem>
              <SelectItem value="issued">Issued</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Roll Number</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>CGPA</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Generated At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : transcripts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  No transcripts found
                </TableCell>
              </TableRow>
            ) : (
              transcripts.map((transcript) => (
                <TableRow key={transcript.id}>
                  <TableCell className="font-medium">
                    {transcript.student.user.first_name}{' '}
                    {transcript.student.user.last_name}
                  </TableCell>
                  <TableCell>{transcript.student.rollNumber}</TableCell>
                  <TableCell>
                    {transcript.student.program.code} -{' '}
                    {transcript.student.program.name}
                  </TableCell>
                  <TableCell>
                    {getTranscriptTypeLabel(transcript.transcriptType)}
                    {transcript.isOfficial && (
                      <Badge variant="outline" className="ml-2">
                        Official
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{transcript.semester?.name || 'Complete'}</TableCell>
                  <TableCell>
                    {transcript.totalCGPA
                      ? transcript.totalCGPA.toFixed(2)
                      : '-'}
                  </TableCell>
                  <TableCell>{getStatusBadge(transcript.status)}</TableCell>
                  <TableCell>
                    {format(new Date(transcript.generatedAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {transcript.filePath && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(transcript.filePath || '', '_blank')
                          }
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/admin/transcripts/${transcript.id}`)
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(transcript)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create Transcript Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate Transcript</DialogTitle>
            <DialogDescription>
              Create a new academic transcript for a student
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="studentId">Student *</Label>
              <Select
                value={formData.studentId}
                onValueChange={(value) =>
                  setFormData({ ...formData, studentId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id.toString()}>
                      {student.rollNumber} - {student.user.first_name}{' '}
                      {student.user.last_name} ({student.program.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="transcriptType">Transcript Type *</Label>
                <Select
                  value={formData.transcriptType}
                  onValueChange={(value: transcript_type) =>
                    setFormData({ ...formData, transcriptType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="official">Official</SelectItem>
                    <SelectItem value="unofficial">Unofficial</SelectItem>
                    <SelectItem value="semester">Semester</SelectItem>
                    <SelectItem value="complete">Complete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="semesterId">Semester</Label>
                <Select
                  value={formData.semesterId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, semesterId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {semesters.map((semester) => (
                      <SelectItem key={semester.id} value={semester.id.toString()}>
                        {semester.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isOfficial"
                checked={formData.isOfficial}
                onChange={(e) =>
                  setFormData({ ...formData, isOfficial: e.target.checked })
                }
                className="h-4 w-4"
              />
              <Label htmlFor="isOfficial">Mark as Official</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Transcript'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Transcript Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Transcript</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transcript? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

