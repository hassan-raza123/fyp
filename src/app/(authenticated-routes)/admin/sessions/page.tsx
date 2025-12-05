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
import { Plus, Search, Edit, Trash2, Calendar, AlertCircle, Eye, Loader2, Clock } from 'lucide-react';
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
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [viewingSession, setViewingSession] = useState<any>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form states
  const [newSession, setNewSession] = useState({
    sectionId: '',
    date: '',
    startTime: '',
    endTime: '',
    topic: '',
    remarks: '',
    status: 'scheduled' as session_status,
  });
  const [editSession, setEditSession] = useState({
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
      setError(null);
      let url = '/api/sessions';
      const params = new URLSearchParams();

      if (sectionFilter !== 'all') {
        params.append('sectionId', sectionFilter);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        credentials: 'include',
      });
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
      setError(error instanceof Error ? error.message : 'Failed to fetch sessions');
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleViewSession = async (session: Session) => {
    setSelectedSession(session);
    setIsLoadingSession(true);
    setShowViewModal(true);
    try {
      const response = await fetch(`/api/sessions/${session.id}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch session');
      const data = await response.json();
      setViewingSession(data.data);
    } catch (error) {
      console.error('Error fetching session:', error);
      toast.error('Failed to load session details');
      setShowViewModal(false);
    } finally {
      setIsLoadingSession(false);
    }
  };

  const handleEditSession = async (session: Session) => {
    setSelectedSession(session);
    setIsLoadingSession(true);
    setShowEditModal(true);
    try {
      const response = await fetch(`/api/sessions/${session.id}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch session');
      const data = await response.json();
      const sess = data.data;
      setEditSession({
        date: new Date(sess.date).toISOString().split('T')[0],
        startTime: sess.startTime
          ? new Date(sess.startTime).toTimeString().slice(0, 5)
          : '',
        endTime: sess.endTime
          ? new Date(sess.endTime).toTimeString().slice(0, 5)
          : '',
        topic: sess.topic || '',
        remarks: sess.remarks || '',
        status: (sess.status || 'scheduled') as session_status,
      });
    } catch (error) {
      console.error('Error fetching session:', error);
      toast.error('Failed to load session details');
      setShowEditModal(false);
    } finally {
      setIsLoadingSession(false);
    }
  };

  const handleCreateSession = async () => {
    if (!newSession.sectionId || !newSession.date || !newSession.topic) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          sectionId: parseInt(newSession.sectionId),
          date: newSession.date,
          startTime: newSession.startTime || undefined,
          endTime: newSession.endTime || undefined,
          topic: newSession.topic,
          remarks: newSession.remarks || undefined,
          status: newSession.status,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create session');
      }

      toast.success('Session created successfully');
      setShowCreateModal(false);
      setNewSession({
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
      toast.error(error instanceof Error ? error.message : 'Failed to create session');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateSession = async () => {
    if (!selectedSession || !editSession.date || !editSession.topic) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/sessions/${selectedSession.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          date: editSession.date,
          startTime: editSession.startTime || undefined,
          endTime: editSession.endTime || undefined,
          topic: editSession.topic,
          remarks: editSession.remarks || undefined,
          status: editSession.status,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update session');
      }

      toast.success('Session updated successfully');
      setShowEditModal(false);
      setSelectedSession(null);
      fetchSessions();
    } catch (error) {
      console.error('Error updating session:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update session');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSession) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/sessions/${selectedSession.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete session');
      }

      toast.success('Session deleted successfully');
      setShowDeleteDialog(false);
      setSelectedSession(null);
      fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete session');
    } finally {
      setIsDeleting(false);
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
            Loading sessions...
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
            onClick={() => fetchSessions()}
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
            Class Sessions
          </h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Manage class sessions for all sections
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
          Create Session
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-text" />
            <Input
              placeholder="Search sessions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-7 h-8 text-xs bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
            />
          </div>
        </div>
        <Select value={sectionFilter} onValueChange={setSectionFilter}>
          <SelectTrigger className="w-[180px] h-8 text-xs bg-card border-card-border text-primary-text">
            <SelectValue placeholder="Filter by section" />
          </SelectTrigger>
          <SelectContent className="bg-card border-card-border">
            <SelectItem value="all" className="text-primary-text hover:bg-card/50">All Sections</SelectItem>
            {sections.map((section) => (
              <SelectItem key={section.id} value={section.id.toString()} className="text-primary-text hover:bg-card/50">
                {section.courseOffering.course.code} - {section.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs bg-card border-card-border text-primary-text">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-card border-card-border">
            <SelectItem value="all" className="text-primary-text hover:bg-card/50">All Status</SelectItem>
            <SelectItem value="scheduled" className="text-primary-text hover:bg-card/50">Scheduled</SelectItem>
            <SelectItem value="in_progress" className="text-primary-text hover:bg-card/50">In Progress</SelectItem>
            <SelectItem value="completed" className="text-primary-text hover:bg-card/50">Completed</SelectItem>
            <SelectItem value="cancelled" className="text-primary-text hover:bg-card/50">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sessions Table */}
      <div className="rounded-lg border border-card-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold text-primary-text">Date</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Time</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Section</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Course</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Topic</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Status</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center space-y-2">
                    <Clock className="w-8 h-8 text-muted-text" />
                    <p className="text-xs text-secondary-text">No sessions found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((session) => (
                <TableRow 
                  key={session.id}
                  className="hover:bg-hover-bg transition-colors"
                >
                  <TableCell className="text-xs text-primary-text">
                    {format(new Date(session.date), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-xs text-primary-text">
                    {session.startTime && session.endTime
                      ? `${format(new Date(session.startTime), 'HH:mm')} - ${format(new Date(session.endTime), 'HH:mm')}`
                      : '-'}
                  </TableCell>
                  <TableCell className="text-xs text-primary-text">{session.section.name}</TableCell>
                  <TableCell className="text-xs text-secondary-text">
                    {session.section.courseOffering.course.code} - {session.section.courseOffering.course.name}
                  </TableCell>
                  <TableCell className="text-xs text-primary-text">{session.topic}</TableCell>
                  <TableCell>{getStatusBadge(session.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleViewSession(session)}
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
                        onClick={() => handleEditSession(session)}
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
                          setSelectedSession(session);
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

      {/* Create Session Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Create New Session</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Create a new class session for a section
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create_sectionId" className="text-xs text-primary-text">Section *</Label>
              <Select
                value={newSession.sectionId}
                onValueChange={(value) => setNewSession({ ...newSession, sectionId: value })}
              >
                <SelectTrigger className="bg-card border-card-border text-primary-text">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  {sections.map((section) => (
                    <SelectItem key={section.id} value={section.id.toString()} className="text-primary-text hover:bg-card/50">
                      {section.courseOffering.course.code} - {section.name} ({section.courseOffering.semester.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create_date" className="text-xs text-primary-text">Date *</Label>
                <Input
                  id="create_date"
                  type="date"
                  value={newSession.date}
                  onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create_status" className="text-xs text-primary-text">Status *</Label>
                <Select
                  value={newSession.status}
                  onValueChange={(value: session_status) => setNewSession({ ...newSession, status: value })}
                >
                  <SelectTrigger className="bg-card border-card-border text-primary-text">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-card-border">
                    <SelectItem value="scheduled" className="text-primary-text hover:bg-card/50">Scheduled</SelectItem>
                    <SelectItem value="in_progress" className="text-primary-text hover:bg-card/50">In Progress</SelectItem>
                    <SelectItem value="completed" className="text-primary-text hover:bg-card/50">Completed</SelectItem>
                    <SelectItem value="cancelled" className="text-primary-text hover:bg-card/50">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create_startTime" className="text-xs text-primary-text">Start Time</Label>
                <Input
                  id="create_startTime"
                  type="time"
                  value={newSession.startTime}
                  onChange={(e) => setNewSession({ ...newSession, startTime: e.target.value })}
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create_endTime" className="text-xs text-primary-text">End Time</Label>
                <Input
                  id="create_endTime"
                  type="time"
                  value={newSession.endTime}
                  onChange={(e) => setNewSession({ ...newSession, endTime: e.target.value })}
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create_topic" className="text-xs text-primary-text">Topic *</Label>
              <Input
                id="create_topic"
                value={newSession.topic}
                onChange={(e) => setNewSession({ ...newSession, topic: e.target.value })}
                placeholder="Enter session topic"
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create_remarks" className="text-xs text-primary-text">Remarks</Label>
              <Input
                id="create_remarks"
                value={newSession.remarks}
                onChange={(e) => setNewSession({ ...newSession, remarks: e.target.value })}
                placeholder="Optional remarks"
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
                setNewSession({
                  sectionId: '',
                  date: '',
                  startTime: '',
                  endTime: '',
                  topic: '',
                  remarks: '',
                  status: 'scheduled',
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
              onClick={handleCreateSession}
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Session'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Session Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Session Details</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              View complete information about this session
            </DialogDescription>
          </DialogHeader>
          {isLoadingSession ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-3">
                <div 
                  className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: primaryColor }}
                />
                <p className="text-xs text-secondary-text">Loading...</p>
              </div>
            </div>
          ) : viewingSession ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-secondary-text mb-3">Session Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Date</p>
                    <p className="text-xs text-primary-text">
                      {viewingSession.date ? format(new Date(viewingSession.date), 'MMM d, yyyy') : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Time</p>
                    <p className="text-xs text-primary-text">
                      {viewingSession.startTime && viewingSession.endTime
                        ? `${format(new Date(viewingSession.startTime), 'HH:mm')} - ${format(new Date(viewingSession.endTime), 'HH:mm')}`
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Status</p>
                    <div className="mt-1">{getStatusBadge(viewingSession.status)}</div>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Topic</p>
                    <p className="text-xs text-primary-text">{viewingSession.topic || 'N/A'}</p>
                  </div>
                  {viewingSession.remarks && (
                    <div className="col-span-2">
                      <p className="text-[10px] text-muted-text mb-1">Remarks</p>
                      <p className="text-xs text-primary-text">{viewingSession.remarks}</p>
                    </div>
                  )}
                </div>
              </div>
              {viewingSession.section && (
                <div>
                  <h3 className="text-xs font-semibold text-secondary-text mb-3">Section Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-muted-text mb-1">Section Name</p>
                      <p className="text-xs text-primary-text">{viewingSession.section.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-text mb-1">Course</p>
                      <p className="text-xs text-primary-text">
                        {viewingSession.section.courseOffering?.course
                          ? `${viewingSession.section.courseOffering.course.code} - ${viewingSession.section.courseOffering.course.name}`
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-text mb-1">Semester</p>
                      <p className="text-xs text-primary-text">
                        {viewingSession.section.courseOffering?.semester?.name || 'N/A'}
                      </p>
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
                setViewingSession(null);
              }}
            >
              Close
            </Button>
            {viewingSession && (
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
                  const session = sessions.find(s => s.id === viewingSession.id);
                  if (session) {
                    setShowViewModal(false);
                    handleEditSession(session);
                  }
                }}
              >
                <Edit className="h-3.5 w-3.5 mr-1.5" />
                Edit Session
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Session Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Edit Session</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Update session information
            </DialogDescription>
          </DialogHeader>
          {isLoadingSession ? (
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
                <Label className="text-xs text-primary-text">Section</Label>
                <Input
                  value={
                    selectedSession
                      ? `${selectedSession.section.courseOffering.course.code} - ${selectedSession.section.name}`
                      : ''
                  }
                  disabled
                  className="bg-card border-card-border text-secondary-text"
                />
                <p className="text-[10px] text-muted-text">Section cannot be changed</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_date" className="text-xs text-primary-text">Date *</Label>
                  <Input
                    id="edit_date"
                    type="date"
                    value={editSession.date}
                    onChange={(e) => setEditSession({ ...editSession, date: e.target.value })}
                    className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_status" className="text-xs text-primary-text">Status *</Label>
                  <Select
                    value={editSession.status}
                    onValueChange={(value: session_status) => setEditSession({ ...editSession, status: value })}
                  >
                    <SelectTrigger className="bg-card border-card-border text-primary-text">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-card-border">
                      <SelectItem value="scheduled" className="text-primary-text hover:bg-card/50">Scheduled</SelectItem>
                      <SelectItem value="in_progress" className="text-primary-text hover:bg-card/50">In Progress</SelectItem>
                      <SelectItem value="completed" className="text-primary-text hover:bg-card/50">Completed</SelectItem>
                      <SelectItem value="cancelled" className="text-primary-text hover:bg-card/50">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_startTime" className="text-xs text-primary-text">Start Time</Label>
                  <Input
                    id="edit_startTime"
                    type="time"
                    value={editSession.startTime}
                    onChange={(e) => setEditSession({ ...editSession, startTime: e.target.value })}
                    className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_endTime" className="text-xs text-primary-text">End Time</Label>
                  <Input
                    id="edit_endTime"
                    type="time"
                    value={editSession.endTime}
                    onChange={(e) => setEditSession({ ...editSession, endTime: e.target.value })}
                    className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_topic" className="text-xs text-primary-text">Topic *</Label>
                <Input
                  id="edit_topic"
                  value={editSession.topic}
                  onChange={(e) => setEditSession({ ...editSession, topic: e.target.value })}
                  placeholder="Enter session topic"
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_remarks" className="text-xs text-primary-text">Remarks</Label>
                <Input
                  id="edit_remarks"
                  value={editSession.remarks}
                  onChange={(e) => setEditSession({ ...editSession, remarks: e.target.value })}
                  placeholder="Optional remarks"
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
                setSelectedSession(null);
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
              onClick={handleUpdateSession}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Session'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Session Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-card border-card-border p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Delete Session</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Are you sure you want to delete this session? This action cannot be undone.
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
                setSelectedSession(null);
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
