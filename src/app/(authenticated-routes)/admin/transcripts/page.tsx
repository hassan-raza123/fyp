'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
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
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  
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
    setMounted(true);
  }, []);

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

  if (!mounted) {
    return null;
  }

  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-primary-text">Transcripts</h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Generate and manage student academic transcripts
          </p>
        </div>
        <button
          onClick={() => setIsCreateDialogOpen(true)}
          className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 flex items-center gap-1.5"
          style={{ backgroundColor: iconBgColor, color: primaryColor }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = iconBgColor;
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          Generate Transcript
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-text" />
            <Input
              placeholder="Search transcripts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-7 h-8 text-xs bg-card border-card-border text-primary-text placeholder:text-secondary-text"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs bg-card border-card-border text-primary-text">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-card border-card-border">
            <SelectItem value="all" className="text-primary-text hover:bg-card/50">All Status</SelectItem>
            <SelectItem value="generated" className="text-primary-text hover:bg-card/50">Generated</SelectItem>
            <SelectItem value="issued" className="text-primary-text hover:bg-card/50">Issued</SelectItem>
            <SelectItem value="cancelled" className="text-primary-text hover:bg-card/50">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-card-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold text-primary-text">Student</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Roll Number</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Program</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Type</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Semester</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">CGPA</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Status</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Generated At</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <p className="text-xs text-secondary-text">Loading...</p>
                </TableCell>
              </TableRow>
            ) : transcripts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <p className="text-xs text-secondary-text">No transcripts found</p>
                </TableCell>
              </TableRow>
            ) : (
              transcripts.map((transcript) => (
                <TableRow key={transcript.id} className="hover:bg-hover-bg transition-colors">
                  <TableCell className="text-xs font-medium text-primary-text">
                    {transcript.student.user.first_name}{' '}
                    {transcript.student.user.last_name}
                  </TableCell>
                  <TableCell className="text-xs text-secondary-text">{transcript.student.rollNumber}</TableCell>
                  <TableCell className="text-xs text-secondary-text">
                    {transcript.student.program.code} -{' '}
                    {transcript.student.program.name}
                  </TableCell>
                  <TableCell className="text-xs text-secondary-text">
                    {getTranscriptTypeLabel(transcript.transcriptType)}
                    {transcript.isOfficial && (
                      <Badge variant="outline" className="ml-2 text-[10px]">
                        Official
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-secondary-text">{transcript.semester?.name || 'Complete'}</TableCell>
                  <TableCell className="text-xs text-secondary-text">
                    {transcript.totalCGPA
                      ? transcript.totalCGPA.toFixed(2)
                      : '-'}
                  </TableCell>
                  <TableCell>{getStatusBadge(transcript.status)}</TableCell>
                  <TableCell className="text-xs text-secondary-text">
                    {format(new Date(transcript.generatedAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      {transcript.filePath && (
                        <button
                          onClick={() => window.open(transcript.filePath || '', '_blank')}
                          className="px-2 py-1 rounded-md transition-colors text-xs font-medium h-7"
                          style={{ backgroundColor: iconBgColor, color: primaryColor }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = iconBgColor; }}
                        >
                          <Download className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        onClick={() => router.push(`/admin/transcripts/${transcript.id}`)}
                        className="px-2 py-1 rounded-md transition-colors text-xs font-medium h-7"
                        style={{ backgroundColor: iconBgColor, color: primaryColor }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = iconBgColor; }}
                      >
                        <Eye className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(transcript)}
                        className="px-2 py-1 rounded-md transition-colors text-xs font-medium h-7"
                        style={{ backgroundColor: 'var(--error-opacity-10)', color: 'var(--error)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--error-opacity-20)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--error-opacity-10)'; }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
              <Label htmlFor="studentId" className="text-xs text-primary-text">Student *</Label>
              <Select
                value={formData.studentId}
                onValueChange={(value) =>
                  setFormData({ ...formData, studentId: value })
                }
              >
                <SelectTrigger className="bg-card border-card-border text-primary-text">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id.toString()} className="text-primary-text hover:bg-card/50">
                      {student.rollNumber} - {student.user.first_name}{' '}
                      {student.user.last_name} ({student.program.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="transcriptType" className="text-xs text-primary-text">Transcript Type *</Label>
                <Select
                  value={formData.transcriptType}
                  onValueChange={(value: transcript_type) =>
                    setFormData({ ...formData, transcriptType: value })
                  }
                >
                  <SelectTrigger className="bg-card border-card-border text-primary-text">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-card-border">
                    <SelectItem value="official" className="text-primary-text hover:bg-card/50">Official</SelectItem>
                    <SelectItem value="unofficial" className="text-primary-text hover:bg-card/50">Unofficial</SelectItem>
                    <SelectItem value="semester" className="text-primary-text hover:bg-card/50">Semester</SelectItem>
                    <SelectItem value="complete" className="text-primary-text hover:bg-card/50">Complete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="semesterId" className="text-xs text-primary-text">Semester</Label>
                <Select
                  value={formData.semesterId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, semesterId: value })
                  }
                >
                  <SelectTrigger className="bg-card border-card-border text-primary-text">
                    <SelectValue placeholder="Select semester (optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-card-border">
                    <SelectItem value="" className="text-primary-text hover:bg-card/50">None</SelectItem>
                    {semesters.map((semester) => (
                      <SelectItem key={semester.id} value={semester.id.toString()} className="text-primary-text hover:bg-card/50">
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
              <Label htmlFor="isOfficial" className="text-xs text-primary-text">Mark as Official</Label>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isGenerating}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 border border-card-border bg-transparent"
              style={{ color: isDarkMode ? '#ffffff' : '#111827', borderColor: isDarkMode ? '#404040' : '#e5e7eb' }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={isGenerating}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 flex items-center gap-1.5"
              style={{ backgroundColor: iconBgColor, color: primaryColor }}
              onMouseEnter={(e) => { if (!isGenerating) e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = iconBgColor; }}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Transcript'
              )}
            </button>
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
            <button
              onClick={() => setIsDeleteDialogOpen(false)}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 border border-card-border bg-transparent"
              style={{ color: isDarkMode ? '#ffffff' : '#111827', borderColor: isDarkMode ? '#404040' : '#e5e7eb' }}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8"
              style={{ backgroundColor: 'var(--error-opacity-10)', color: 'var(--error)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--error-opacity-20)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--error-opacity-10)'; }}
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

