'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loading } from '@/components/ui/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CalendarDays, Clock, Edit, Trash } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface Session {
  id: number;
  sectionId: number;
  date: string;
  startTime: string | null;
  endTime: string | null;
  topic: string;
  remarks: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

interface SessionsManagerProps {
  sectionId: number;
}

export function SessionsManager({ sectionId }: SessionsManagerProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newSessionData, setNewSessionData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    topic: '',
    remarks: '',
    status: 'scheduled',
  });
  const [editingSession, setEditingSession] = useState<
    (Session & { startTime?: string; endTime?: string }) | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<number | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/sessions?sectionId=${sectionId}`);
      if (!response.ok) throw new Error('Failed to fetch sessions');
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setSessions(result.data);
      } else {
        console.error('Invalid sessions data format:', result);
        setError('Invalid sessions data format received from server');
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sectionId) {
      fetchSessions();
    }
  }, [sectionId]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionData.startTime || !newSessionData.endTime) {
      toast.error('Start time and end time are required!');
      return;
    }
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newSessionData, sectionId }),
      });
      const result = await response.json();
      if (!response.ok || !result.success)
        throw new Error(result.error || 'Failed to create session');
      toast.success('Session created successfully');
      setNewSessionData({
        date: '',
        startTime: '',
        endTime: '',
        topic: '',
        remarks: '',
        status: 'scheduled',
      });
      setIsCreating(false);
      fetchSessions(); // Refresh the list
    } catch (err: any) {
      console.error('Error creating session:', err);
      toast.error(err.message || 'Failed to create session');
    }
  };

  const handleUpdateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;
    if (!editingSession.startTime || !editingSession.endTime) {
      toast.error('Start time and end time are required!');
      return;
    }
    try {
      const response = await fetch(`/api/sessions/${editingSession.id}`, {
        method: 'PUT', // Assuming PUT/PATCH endpoint for update
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingSession),
      });
      const result = await response.json();
      if (!response.ok || !result.success)
        throw new Error(result.error || 'Failed to update session');
      toast.success('Session updated successfully');
      setEditingSession(null);
      fetchSessions(); // Refresh the list
    } catch (err: any) {
      console.error('Error updating session:', err);
      toast.error(err.message || 'Failed to update session');
    }
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    try {
      const response = await fetch(`/api/sessions/${sessionToDelete}`, {
        method: 'DELETE', // Assuming DELETE endpoint for deletion
      });
      const result = await response.json();
      if (!response.ok || !result.success)
        throw new Error(result.error || 'Failed to delete session');
      toast.success('Session deleted successfully');
      setIsDeleting(false);
      setSessionToDelete(null);
      fetchSessions(); // Refresh the list
    } catch (err: any) {
      console.error('Error deleting session:', err);
      toast.error(err.message || 'Failed to delete session');
    }
  };

  // Helper to extract 'HH:mm' from ISO string
  const extractTime = (isoString: string | null | undefined) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    // Get hours and minutes in local time
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Helper to extract 'YYYY-MM-DD' from ISO string
  const extractDate = (isoString: string | null | undefined) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toISOString().slice(0, 10);
  };

  // Helper to format time as 'hh:mm AM/PM'
  const formatTime = (isoString: string | null | undefined) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };

  if (loading) {
    return <Loading message='Loading sessions...' />;
  }

  if (error) {
    return (
      <Alert variant='destructive' className='mb-4'>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h2 className='text-xl font-semibold'>Class Sessions</h2>
        <Button onClick={() => setIsCreating(true)}>Add New Session</Button>
      </div>

      {sessions.length === 0 ? (
        <div className='text-center text-gray-500 py-4'>
          No sessions found for this section.
        </div>
      ) : (
        <div className='grid gap-4'>
          {sessions.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <CardTitle className='text-lg flex justify-between items-center'>
                  {session.topic}
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() =>
                        setEditingSession({
                          ...session,
                          date: extractDate(session.date),
                          startTime: extractTime(session.startTime),
                          endTime: extractTime(session.endTime),
                        })
                      }
                    >
                      <Edit className='h-4 w-4 mr-1' /> Edit
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      color='destructive'
                      onClick={() => {
                        setSessionToDelete(session.id);
                        setIsDeleting(true);
                      }}
                    >
                      <Trash className='h-4 w-4 mr-1' /> Delete
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-2'>
                <p className='text-sm text-gray-500 flex items-center gap-1'>
                  <CalendarDays className='h-4 w-4' />
                  {format(new Date(session.date), 'PPP')}
                  {session.startTime && session.endTime && (
                    <span className='ml-2'>
                      {formatTime(session.startTime)} -{' '}
                      {formatTime(session.endTime)}
                    </span>
                  )}
                </p>
                <p className='text-sm text-gray-500 flex items-center gap-1'>
                  <Clock className='h-4 w-4' />
                  Status: {session.status}
                </p>
                {session.remarks && (
                  <p className='text-sm text-gray-700'>
                    Remarks: {session.remarks}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Session Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Session</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSession} className='space-y-4'>
            <div>
              <Label htmlFor='sessionDate'>Date</Label>
              <Input
                id='sessionDate'
                type='date'
                value={newSessionData.date}
                onChange={(e) =>
                  setNewSessionData({ ...newSessionData, date: e.target.value })
                }
                required
              />
            </div>
            <div className='flex gap-4'>
              <div className='flex-1'>
                <Label htmlFor='sessionStartTime'>Start Time</Label>
                <Input
                  id='sessionStartTime'
                  type='time'
                  value={newSessionData.startTime}
                  onChange={(e) =>
                    setNewSessionData({
                      ...newSessionData,
                      startTime: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className='flex-1'>
                <Label htmlFor='sessionEndTime'>End Time</Label>
                <Input
                  id='sessionEndTime'
                  type='time'
                  value={newSessionData.endTime}
                  onChange={(e) =>
                    setNewSessionData({
                      ...newSessionData,
                      endTime: e.target.value,
                    })
                  }
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor='sessionTopic'>Topic</Label>
              <Input
                id='sessionTopic'
                value={newSessionData.topic}
                onChange={(e) =>
                  setNewSessionData({
                    ...newSessionData,
                    topic: e.target.value,
                  })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor='sessionRemarks'>Remarks (Optional)</Label>
              <Textarea
                id='sessionRemarks'
                value={newSessionData.remarks}
                onChange={(e) =>
                  setNewSessionData({
                    ...newSessionData,
                    remarks: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor='sessionStatus'>Status</Label>
              <Select
                value={newSessionData.status}
                onValueChange={(value) =>
                  setNewSessionData({
                    ...newSessionData,
                    status: value as
                      | 'scheduled'
                      | 'in_progress'
                      | 'completed'
                      | 'cancelled',
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='scheduled'>Scheduled</SelectItem>
                  <SelectItem value='in_progress'>In Progress</SelectItem>
                  <SelectItem value='completed'>Completed</SelectItem>
                  <SelectItem value='cancelled'>Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type='submit'>Create Session</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Session Dialog */}
      <Dialog
        open={!!editingSession}
        onOpenChange={() => setEditingSession(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Session</DialogTitle>
          </DialogHeader>
          {editingSession && (
            <form onSubmit={handleUpdateSession} className='space-y-4'>
              <div>
                <Label htmlFor='editSessionDate'>Date</Label>
                <Input
                  id='editSessionDate'
                  type='date'
                  value={editingSession.date}
                  onChange={(e) =>
                    setEditingSession({
                      ...editingSession,
                      date: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className='flex gap-4'>
                <div className='flex-1'>
                  <Label htmlFor='editSessionStartTime'>Start Time</Label>
                  <Input
                    id='editSessionStartTime'
                    type='time'
                    value={editingSession.startTime || ''}
                    onChange={(e) =>
                      setEditingSession({
                        ...editingSession,
                        startTime: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className='flex-1'>
                  <Label htmlFor='editSessionEndTime'>End Time</Label>
                  <Input
                    id='editSessionEndTime'
                    type='time'
                    value={editingSession.endTime || ''}
                    onChange={(e) =>
                      setEditingSession({
                        ...editingSession,
                        endTime: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor='editSessionTopic'>Topic</Label>
                <Input
                  id='editSessionTopic'
                  value={editingSession.topic}
                  onChange={(e) =>
                    setEditingSession({
                      ...editingSession,
                      topic: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor='editSessionRemarks'>Remarks (Optional)</Label>
                <Textarea
                  id='editSessionRemarks'
                  value={editingSession.remarks || ''}
                  onChange={(e) =>
                    setEditingSession({
                      ...editingSession,
                      remarks: e.target.value || null,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor='editSessionStatus'>Status</Label>
                <Select
                  value={editingSession.status}
                  onValueChange={(value) =>
                    setEditingSession({
                      ...editingSession,
                      status: value as
                        | 'scheduled'
                        | 'in_progress'
                        | 'completed'
                        | 'cancelled',
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='scheduled'>Scheduled</SelectItem>
                    <SelectItem value='in_progress'>In Progress</SelectItem>
                    <SelectItem value='completed'>Completed</SelectItem>
                    <SelectItem value='cancelled'>Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type='submit'>Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Session Dialog */}
      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
          </DialogHeader>
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              Are you sure you want to delete this session? This action cannot
              be undone.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsDeleting(false)}>
              Cancel
            </Button>
            <Button variant='destructive' onClick={handleDeleteSession}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
