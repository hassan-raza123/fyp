'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
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
import { Plus, Search, Edit, Trash2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { session_status } from '@prisma/client';

interface Session {
  id: number;
  sectionId: number;
  date: string;
  startTime: string | null;
  endTime: string | null;
  topic: string;
  remarks: string | null;
  status: session_status;
  section: {
    id: number;
    name: string;
    courseOffering: {
      course: {
        code: string;
        name: string;
      };
      semester: {
        name: string;
      };
    };
  };
}

interface Section {
  id: number;
  name: string;
  courseOffering: {
    course: {
      code: string;
      name: string;
    };
    semester: {
      name: string;
    };
  };
}

export default function SessionsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [formData, setFormData] = useState({
    sectionId: '',
    date: '',
    startTime: '',
    endTime: '',
    topic: '',
    remarks: '',
    status: 'scheduled' as session_status,
  });
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchSections();
    fetchSessions();
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [sectionFilter, statusFilter]);

  const fetchSections = async () => {
    try {
      const response = await fetch('/api/sections?status=active');
      if (!response.ok) throw new Error('Failed to fetch sections');
      const data = await response.json();
      if (data.success) {
        setSections(data.data);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
      toast.error('Failed to load sections');
    }
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      let url = '/api/sessions';
      const params = new URLSearchParams();

      if (sectionFilter !== 'all') {
        params.append('sectionId', sectionFilter);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch sessions');
      const data = await response.json();
      if (data.success) {
        let sessionsData = data.data;

        // Filter by status if needed
        if (statusFilter !== 'all') {
          sessionsData = sessionsData.filter(
            (s: Session) => s.status === statusFilter
          );
        }

        // Filter by search
        if (search) {
          const searchLower = search.toLowerCase();
          sessionsData = sessionsData.filter(
            (s: Session) =>
              s.topic.toLowerCase().includes(searchLower) ||
              s.section.name.toLowerCase().includes(searchLower) ||
              s.section.courseOffering.course.code
                .toLowerCase()
                .includes(searchLower) ||
              s.section.courseOffering.course.name
                .toLowerCase()
                .includes(searchLower)
          );
        }

        setSessions(sessionsData);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.sectionId || !formData.date || !formData.topic) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: parseInt(formData.sectionId),
          date: formData.date,
          startTime: formData.startTime || undefined,
          endTime: formData.endTime || undefined,
          topic: formData.topic,
          remarks: formData.remarks || undefined,
          status: formData.status,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create session');
      }

      toast.success('Session created successfully');
      setIsCreateDialogOpen(false);
      setFormData({
        sectionId: '',
        date: '',
        startTime: '',
        endTime: '',
        topic: '',
        remarks: '',
        status: 'scheduled',
      });
      fetchSessions();
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create session'
      );
    }
  };

  const handleEditClick = (session: Session) => {
    setSelectedSession(session);
    setFormData({
      sectionId: session.sectionId.toString(),
      date: new Date(session.date).toISOString().split('T')[0],
      startTime: session.startTime
        ? new Date(session.startTime).toTimeString().slice(0, 5)
        : '',
      endTime: session.endTime
        ? new Date(session.endTime).toTimeString().slice(0, 5)
        : '',
      topic: session.topic,
      remarks: session.remarks || '',
      status: session.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedSession || !formData.date || !formData.topic) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const response = await fetch(`/api/sessions/${selectedSession.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          topic: formData.topic,
          remarks: formData.remarks || undefined,
          status: formData.status,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update session');
      }

      toast.success('Session updated successfully');
      setIsEditDialogOpen(false);
      setSelectedSession(null);
      fetchSessions();
    } catch (error) {
      console.error('Error updating session:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update session'
      );
    }
  };

  const handleDeleteClick = (session: Session) => {
    setSelectedSession(session);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedSession) return;

    try {
      const response = await fetch(`/api/sessions/${selectedSession.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete session');
      }

      toast.success('Session deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedSession(null);
      fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete session'
      );
    }
  };

  const getStatusBadge = (status: session_status) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="default">Scheduled</Badge>;
      case 'in_progress':
        return <Badge variant="default">In Progress</Badge>;
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (!mounted) {
    return null;
  }

  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-primary-text">
            <Calendar className="h-8 w-8" style={{ color: primaryColor }} />
            Class Sessions
          </h1>
          <p className="text-secondary-text">
            Manage class sessions for all sections
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Session
        </Button>
      </div>

      <Card className="p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-text" />
              <Input
                placeholder="Search sessions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <Select value={sectionFilter} onValueChange={setSectionFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by section" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {sections.map((section) => (
                <SelectItem key={section.id} value={section.id.toString()}>
                  {section.courseOffering.course.code} - {section.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Topic</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No sessions found
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>
                    {format(new Date(session.date), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    {session.startTime && session.endTime
                      ? `${format(
                          new Date(session.startTime),
                          'HH:mm'
                        )} - ${format(new Date(session.endTime), 'HH:mm')}`
                      : '-'}
                  </TableCell>
                  <TableCell>{session.section.name}</TableCell>
                  <TableCell>
                    {session.section.courseOffering.course.code} -{' '}
                    {session.section.courseOffering.course.name}
                  </TableCell>
                  <TableCell>{session.topic}</TableCell>
                  <TableCell>{getStatusBadge(session.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(session)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(session)}
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

      {/* Create Session Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Session</DialogTitle>
            <DialogDescription>
              Create a new class session for a section
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="sectionId">Section *</Label>
              <Select
                value={formData.sectionId}
                onValueChange={(value) =>
                  setFormData({ ...formData, sectionId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((section) => (
                    <SelectItem key={section.id} value={section.id.toString()}>
                      {section.courseOffering.course.code} - {section.name} (
                      {section.courseOffering.semester.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: session_status) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="topic">Topic *</Label>
              <Input
                id="topic"
                value={formData.topic}
                onChange={(e) =>
                  setFormData({ ...formData, topic: e.target.value })
                }
                placeholder="Enter session topic"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Input
                id="remarks"
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
                placeholder="Optional remarks"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Session</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Session Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Session</DialogTitle>
            <DialogDescription>Update session information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Section</Label>
              <Input
                value={
                  selectedSession
                    ? `${selectedSession.section.courseOffering.course.code} - ${selectedSession.section.name}`
                    : ''
                }
                disabled
                style={{ backgroundColor: 'var(--hover-bg)' }}
                disabled
              />
              <p className="text-xs text-muted-text">
                Section cannot be changed
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-date">Date *</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: session_status) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-startTime">Start Time *</Label>
                <Input
                  id="edit-startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-endTime">End Time *</Label>
                <Input
                  id="edit-endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-topic">Topic *</Label>
              <Input
                id="edit-topic"
                value={formData.topic}
                onChange={(e) =>
                  setFormData({ ...formData, topic: e.target.value })
                }
                placeholder="Enter session topic"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-remarks">Remarks</Label>
              <Input
                id="edit-remarks"
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
                placeholder="Optional remarks"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Session Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this session? This action cannot
              be undone.
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
