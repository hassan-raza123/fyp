'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CalendarDays,
  Save,
  Lock,
  CheckCircle,
  AlertTriangle,
  Users,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import PageTitle from '@/components/ui/PageTitle';
import { PageLoading } from '@/components/ui/page-loading';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

interface Section {
  id: number;
  name: string;
  courseOffering: {
    id?: number;
    course: { code: string; name: string };
    semester: { name: string };
  };
}

interface RosterEntry {
  studentId: number;
  rollNumber: string;
  name: string;
  status: AttendanceStatus | null;
  remarks: string | null;
}

interface SessionInfo {
  id: number;
  sectionName: string;
  courseCode: string;
  date: string;
  slot: number;
  topic: string | null;
  status: 'open' | 'finalized';
}

interface SessionListItem {
  id: number;
  date: string;
  slot: number;
  topic: string | null;
  status: 'open' | 'finalized';
  recordCount: number;
}

interface SummaryStudent {
  studentId: number;
  rollNumber: string;
  name: string;
  tally: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    countedSessions: number;
    attendedSessions: number;
    attendancePercent: number;
    hasData: boolean;
  };
  threshold: number;
  verdict: string;
}

interface Summary {
  totalSessions: number;
  finalizedSessions: number;
  openSessions: number;
  threshold: number;
  students: SummaryStudent[];
  defaulterCount: number;
  averageAttendance: number;
}

const STATUS_OPTIONS: Array<{
  value: AttendanceStatus;
  label: string;
  short: string;
}> = [
  { value: 'present', label: 'Present', short: 'P' },
  { value: 'absent', label: 'Absent', short: 'A' },
  { value: 'late', label: 'Late', short: 'L' },
  { value: 'excused', label: 'Excused', short: 'E' },
];

/** Colour a status button by meaning rather than position in the list. */
function statusClasses(status: AttendanceStatus, active: boolean): string {
  if (!active) return 'bg-transparent text-muted-foreground hover:bg-muted';
  switch (status) {
    case 'present':
      return 'bg-emerald-600 text-white hover:bg-emerald-700';
    case 'absent':
      return 'bg-red-600 text-white hover:bg-red-700';
    case 'late':
      return 'bg-amber-500 text-white hover:bg-amber-600';
    case 'excused':
      return 'bg-sky-600 text-white hover:bg-sky-700';
  }
}

function verdictBadge(verdict: string, percent: number) {
  switch (verdict) {
    case 'eligible':
      return <Badge className='bg-emerald-600 hover:bg-emerald-600'>Eligible</Badge>;
    case 'at_risk':
      return <Badge className='bg-amber-500 hover:bg-amber-500'>At risk</Badge>;
    case 'ineligible':
      return <Badge variant='destructive'>Short ({percent}%)</Badge>;
    case 'condoned':
      return <Badge className='bg-sky-600 hover:bg-sky-600'>Condoned</Badge>;
    case 'barred':
      return <Badge variant='destructive'>Barred</Badge>;
    default:
      return <Badge variant='secondary'>No data</Badge>;
  }
}

/** Today's date as YYYY-MM-DD, which is what the date input expects. */
function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function FacultyAttendancePage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [date, setDate] = useState<string>(todayISO());
  const [slot, setSlot] = useState<string>('1');
  const [topic, setTopic] = useState<string>('');

  const [session, setSession] = useState<SessionInfo | null>(null);
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [sessionList, setSessionList] = useState<SessionListItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // ─── Data loading ──────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await fetch('/api/sections', {
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch sections');
        const result = await response.json();
        setSections(Array.isArray(result) ? result : result.data || []);
      } catch (error) {
        toast.error('Failed to load sections');
        console.error(error);
      } finally {
        setInitialLoad(false);
      }
    };
    fetchSections();
  }, []);

  const loadSessionList = useCallback(async (sectionId: number) => {
    try {
      const response = await fetch(
        `/api/attendance/sessions?sectionId=${sectionId}`,
        { credentials: 'include' }
      );
      const result = await response.json();
      if (result.success) setSessionList(result.data);
    } catch (error) {
      console.error('Failed to load session list', error);
    }
  }, []);

  const loadSummary = useCallback(async (sectionId: number) => {
    try {
      const response = await fetch(
        `/api/attendance/summary?sectionId=${sectionId}`,
        { credentials: 'include' }
      );
      const result = await response.json();
      if (result.success) setSummary(result.data);
    } catch (error) {
      console.error('Failed to load summary', error);
    }
  }, []);

  useEffect(() => {
    if (!selectedSection) return;
    // Deferred so the state updates inside the loaders do not run
    // synchronously in the effect body and cascade an extra render.
    void Promise.resolve().then(() => {
      loadSessionList(selectedSection);
      loadSummary(selectedSection);
    });
  }, [selectedSection, loadSessionList, loadSummary]);

  /**
   * Switching section clears the open session here rather than in an effect —
   * an effect reacting to the change would setState synchronously and cascade
   * an extra render for what is really part of the click itself.
   */
  const handleSectionChange = (value: string) => {
    setSelectedSection(parseInt(value, 10));
    setSession(null);
    setRoster([]);
    setSessionList([]);
    setSummary(null);
  };

  const openSession = useCallback(async (sessionId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/attendance/sessions/${sessionId}`, {
        credentials: 'include',
      });
      const result = await response.json();
      if (!result.success) {
        toast.error(result.error || 'Failed to open session');
        return;
      }
      setSession(result.data.session);
      setRoster(result.data.roster);
      setTopic(result.data.session.topic ?? '');
      setDate(String(result.data.session.date).slice(0, 10));
      setSlot(String(result.data.session.slot));
    } catch (error) {
      toast.error('Failed to open session');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Actions ───────────────────────────────────────────────────────────────

  const handleCreateOrOpen = async () => {
    if (!selectedSection) {
      toast.error('Select a section first');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/attendance/sessions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: selectedSection,
          date,
          slot: parseInt(slot, 10),
          topic: topic || null,
        }),
      });
      const result = await response.json();

      // An existing session is not an error — it is the common case when a
      // lecturer returns to a class they already started marking.
      if (!result.success) {
        if (result.code === 'SESSION_EXISTS') {
          await openSession(result.sessionId);
          toast.info('Opened the existing session for this date');
          return;
        }
        toast.error(result.error || 'Failed to create session');
        return;
      }

      await openSession(result.data.id);
      await loadSessionList(selectedSection);
      toast.success('Session created');
    } catch (error) {
      toast.error('Failed to create session');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const setStatus = (studentId: number, status: AttendanceStatus) => {
    setRoster((prev) =>
      prev.map((entry) =>
        entry.studentId === studentId ? { ...entry, status } : entry
      )
    );
  };

  const markAll = (status: AttendanceStatus) => {
    setRoster((prev) => prev.map((entry) => ({ ...entry, status })));
  };

  const handleSave = async (thenFinalize = false) => {
    if (!session) return;

    const unmarked = roster.filter((entry) => entry.status === null);
    if (thenFinalize && unmarked.length > 0) {
      toast.error(
        `${unmarked.length} student(s) still unmarked. Finalizing now would count them absent.`
      );
      return;
    }

    const records = roster
      .filter((entry) => entry.status !== null)
      .map((entry) => ({
        studentId: entry.studentId,
        status: entry.status,
        remarks: entry.remarks,
      }));

    if (records.length === 0) {
      toast.error('Nothing to save');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        `/api/attendance/sessions/${session.id}/records`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ records }),
        }
      );
      const result = await response.json();
      if (!result.success) {
        toast.error(result.error || 'Failed to save attendance');
        return;
      }

      if (!thenFinalize) {
        toast.success(`Attendance saved for ${result.data.saved} student(s)`);
      }

      if (thenFinalize) {
        const finalizeResponse = await fetch(
          `/api/attendance/sessions/${session.id}`,
          {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'finalized', topic }),
          }
        );
        const finalizeResult = await finalizeResponse.json();
        if (!finalizeResult.success) {
          toast.error(finalizeResult.error || 'Failed to finalize session');
          return;
        }
        setSession({ ...session, status: 'finalized' });
        toast.success('Session finalized — it now counts towards attendance');
      }

      if (selectedSection) {
        await loadSessionList(selectedSection);
        await loadSummary(selectedSection);
      }
    } catch (error) {
      toast.error('Failed to save attendance');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (sessionId: number) => {
    if (
      !confirm(
        'Delete this session and all its attendance records? This cannot be undone.'
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/attendance/sessions/${sessionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const result = await response.json();
      if (!result.success) {
        toast.error(result.error || 'Failed to delete session');
        return;
      }
      toast.success('Session deleted');
      if (session?.id === sessionId) {
        setSession(null);
        setRoster([]);
      }
      if (selectedSection) {
        await loadSessionList(selectedSection);
        await loadSummary(selectedSection);
      }
    } catch (error) {
      toast.error('Failed to delete session');
      console.error(error);
    }
  };

  if (initialLoad) return <PageLoading />;

  const markedCount = roster.filter((entry) => entry.status !== null).length;
  const presentCount = roster.filter(
    (entry) => entry.status === 'present' || entry.status === 'late'
  ).length;

  return (
    <div className='p-6'>
      <PageTitle
        heading='Attendance'
        text='Take attendance for your sections and track exam eligibility.'
      />

      <Card className='mb-6'>
        <CardContent className='pt-6'>
          <div className='grid gap-4 md:grid-cols-4'>
            <div className='md:col-span-2'>
              <Label>Section</Label>
              <Select
                value={selectedSection ? String(selectedSection) : undefined}
                onValueChange={handleSectionChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select a section' />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((section) => (
                    <SelectItem key={section.id} value={String(section.id)}>
                      {section.courseOffering.course.code} — {section.name} (
                      {section.courseOffering.semester.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date</Label>
              <Input
                type='date'
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
            <div>
              <Label>Slot</Label>
              <Select value={slot} onValueChange={setSlot}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='1'>1 — Lecture</SelectItem>
                  <SelectItem value='2'>2 — Lab / second class</SelectItem>
                  <SelectItem value='3'>3 — Third class</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='mt-4 flex flex-col gap-4 md:flex-row md:items-end'>
            <div className='flex-1'>
              <Label>Topic covered (optional)</Label>
              <Input
                value={topic}
                placeholder='e.g. Normalization — 3NF and BCNF'
                onChange={(event) => setTopic(event.target.value)}
              />
            </div>
            <Button
              onClick={handleCreateOrOpen}
              disabled={!selectedSection || loading}
            >
              <CalendarDays className='mr-2 h-4 w-4' />
              Open / create session
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue='mark'>
        <TabsList>
          <TabsTrigger value='mark'>Mark attendance</TabsTrigger>
          <TabsTrigger value='sessions'>Sessions</TabsTrigger>
          <TabsTrigger value='summary'>Summary</TabsTrigger>
        </TabsList>

        {/* ─── Marking ───────────────────────────────────────────────────── */}
        <TabsContent value='mark'>
          {!session ? (
            <Card>
              <CardContent className='py-12 text-center text-muted-foreground'>
                Select a section and date, then open a session to start marking.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className='flex flex-wrap items-center justify-between gap-3'>
                  <div>
                    <CardTitle>
                      {session.courseCode} — {session.sectionName}
                    </CardTitle>
                    <p className='mt-1 text-sm text-muted-foreground'>
                      {String(session.date).slice(0, 10)} · Slot {session.slot} ·{' '}
                      {markedCount}/{roster.length} marked · {presentCount}{' '}
                      present
                    </p>
                  </div>
                  {session.status === 'finalized' ? (
                    <Badge className='bg-emerald-600 hover:bg-emerald-600'>
                      <Lock className='mr-1 h-3 w-3' /> Finalized
                    </Badge>
                  ) : (
                    <Badge variant='secondary'>Open</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className='mb-4 flex flex-wrap gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => markAll('present')}
                    disabled={session.status === 'finalized'}
                  >
                    <Users className='mr-2 h-4 w-4' />
                    Mark all present
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => markAll('absent')}
                    disabled={session.status === 'finalized'}
                  >
                    Mark all absent
                  </Button>
                </div>

                {session.status === 'finalized' && (
                  <div className='mb-4 flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm'>
                    <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0 text-amber-600' />
                    <span>
                      This session is finalized and counts towards attendance.
                      Contact your department admin to make a correction.
                    </span>
                  </div>
                )}

                <div className='overflow-x-auto'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className='w-32'>Roll No</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className='w-80'>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roster.map((entry) => (
                        <TableRow key={entry.studentId}>
                          <TableCell className='font-mono text-sm'>
                            {entry.rollNumber}
                          </TableCell>
                          <TableCell>{entry.name}</TableCell>
                          <TableCell>
                            <div className='flex gap-1'>
                              {STATUS_OPTIONS.map((option) => (
                                <button
                                  key={option.value}
                                  type='button'
                                  title={option.label}
                                  disabled={session.status === 'finalized'}
                                  onClick={() =>
                                    setStatus(entry.studentId, option.value)
                                  }
                                  className={`h-8 w-10 rounded border text-sm font-medium transition-colors disabled:opacity-50 ${statusClasses(
                                    option.value,
                                    entry.status === option.value
                                  )}`}
                                >
                                  {option.short}
                                </button>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {roster.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className='py-8 text-center text-muted-foreground'
                          >
                            No students enrolled in this section.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {session.status !== 'finalized' && roster.length > 0 && (
                  <div className='mt-4 flex flex-wrap gap-2'>
                    <Button onClick={() => handleSave(false)} disabled={saving}>
                      <Save className='mr-2 h-4 w-4' />
                      Save
                    </Button>
                    <Button
                      variant='secondary'
                      onClick={() => handleSave(true)}
                      disabled={saving}
                    >
                      <CheckCircle className='mr-2 h-4 w-4' />
                      Save &amp; finalize
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── Session list ──────────────────────────────────────────────── */}
        <TabsContent value='sessions'>
          <Card>
            <CardContent className='pt-6'>
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Slot</TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead>Marked</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessionList.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{String(item.date).slice(0, 10)}</TableCell>
                        <TableCell>{item.slot}</TableCell>
                        <TableCell className='max-w-xs truncate'>
                          {item.topic || (
                            <span className='text-muted-foreground'>—</span>
                          )}
                        </TableCell>
                        <TableCell>{item.recordCount}</TableCell>
                        <TableCell>
                          {item.status === 'finalized' ? (
                            <Badge className='bg-emerald-600 hover:bg-emerald-600'>
                              Finalized
                            </Badge>
                          ) : (
                            <Badge variant='secondary'>Open</Badge>
                          )}
                        </TableCell>
                        <TableCell className='text-right'>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => openSession(item.id)}
                          >
                            Open
                          </Button>
                          {item.status !== 'finalized' && (
                            <Button aria-label="Delete"
                              variant='ghost'
                              size='sm'
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className='h-4 w-4 text-destructive' />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {sessionList.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className='py-8 text-center text-muted-foreground'
                        >
                          No sessions recorded for this section yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Summary ───────────────────────────────────────────────────── */}
        <TabsContent value='summary'>
          {!summary ? (
            <Card>
              <CardContent className='py-12 text-center text-muted-foreground'>
                Select a section to see its attendance summary.
              </CardContent>
            </Card>
          ) : (
            <>
              <div className='mb-4 grid gap-4 md:grid-cols-4'>
                <Card>
                  <CardContent className='pt-6'>
                    <p className='text-sm text-muted-foreground'>
                      Finalized sessions
                    </p>
                    <p className='text-2xl font-bold'>
                      {summary.finalizedSessions}
                    </p>
                    {summary.openSessions > 0 && (
                      <p className='mt-1 text-xs text-amber-600'>
                        {summary.openSessions} open — not yet counted
                      </p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className='pt-6'>
                    <p className='text-sm text-muted-foreground'>
                      Average attendance
                    </p>
                    <p className='text-2xl font-bold'>
                      {summary.averageAttendance}%
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className='pt-6'>
                    <p className='text-sm text-muted-foreground'>Threshold</p>
                    <p className='text-2xl font-bold'>{summary.threshold}%</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className='pt-6'>
                    <p className='text-sm text-muted-foreground'>
                      Below threshold
                    </p>
                    <p className='text-2xl font-bold text-destructive'>
                      {summary.defaulterCount}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className='pt-6'>
                  <div className='overflow-x-auto'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Roll No</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Present</TableHead>
                          <TableHead>Late</TableHead>
                          <TableHead>Absent</TableHead>
                          <TableHead>Excused</TableHead>
                          <TableHead>Attendance</TableHead>
                          <TableHead>Eligibility</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {summary.students.map((student) => (
                          <TableRow key={student.studentId}>
                            <TableCell className='font-mono text-sm'>
                              {student.rollNumber}
                            </TableCell>
                            <TableCell>{student.name}</TableCell>
                            <TableCell>{student.tally.present}</TableCell>
                            <TableCell>{student.tally.late}</TableCell>
                            <TableCell>{student.tally.absent}</TableCell>
                            <TableCell>{student.tally.excused}</TableCell>
                            <TableCell className='font-medium'>
                              {student.tally.hasData
                                ? `${student.tally.attendancePercent}%`
                                : '—'}
                            </TableCell>
                            <TableCell>
                              {verdictBadge(
                                student.verdict,
                                student.tally.attendancePercent
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
