'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import PageTitle from '@/components/ui/PageTitle';
import { PageLoading } from '@/components/ui/page-loading';

interface CourseAttendance {
  sectionId: number;
  sectionName: string;
  courseCode: string;
  courseName: string;
  semesterName: string;
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
  overrideRemarks: string | null;
}

interface HistoryEntry {
  date: string;
  slot: number;
  topic: string | null;
  status: string;
  remarks: string | null;
}

function verdictBadge(verdict: string) {
  switch (verdict) {
    case 'eligible':
      return <Badge className='bg-emerald-600 hover:bg-emerald-600'>Eligible</Badge>;
    case 'at_risk':
      return <Badge className='bg-amber-500 hover:bg-amber-500'>At risk</Badge>;
    case 'ineligible':
      return <Badge variant='destructive'>Below threshold</Badge>;
    case 'condoned':
      return <Badge className='bg-sky-600 hover:bg-sky-600'>Condoned</Badge>;
    case 'barred':
      return <Badge variant='destructive'>Barred</Badge>;
    default:
      return <Badge variant='secondary'>No data</Badge>;
  }
}

function statusBadge(status: string) {
  switch (status) {
    case 'present':
      return <Badge className='bg-emerald-600 hover:bg-emerald-600'>Present</Badge>;
    case 'late':
      return <Badge className='bg-amber-500 hover:bg-amber-500'>Late</Badge>;
    case 'excused':
      return <Badge className='bg-sky-600 hover:bg-sky-600'>Excused</Badge>;
    default:
      return <Badge variant='destructive'>Absent</Badge>;
  }
}

export default function StudentAttendancePage() {
  const [courses, setCourses] = useState<CourseAttendance[]>([]);
  const [overall, setOverall] = useState(0);
  const [loading, setLoading] = useState(true);

  const [openSection, setOpenSection] = useState<CourseAttendance | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const response = await fetch('/api/student/attendance', {
          credentials: 'include',
        });
        const result = await response.json();
        if (!result.success) {
          toast.error(result.error || 'Failed to load attendance');
          return;
        }
        setCourses(result.data.courses);
        setOverall(result.data.overallAttendance);
      } catch (error) {
        toast.error('Failed to load attendance');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  const viewHistory = async (course: CourseAttendance) => {
    setOpenSection(course);
    setHistoryLoading(true);
    try {
      const response = await fetch(
        `/api/student/attendance?sectionId=${course.sectionId}`,
        { credentials: 'include' }
      );
      const result = await response.json();
      if (result.success) setHistory(result.data.history ?? []);
    } catch (error) {
      toast.error('Failed to load class history');
      console.error(error);
    } finally {
      setHistoryLoading(false);
    }
  };

  if (loading) return <PageLoading />;

  const shortCourses = courses.filter(
    (course) => course.verdict === 'ineligible' || course.verdict === 'at_risk'
  );

  // ─── Session history for one course ────────────────────────────────────────
  if (openSection) {
    return (
      <div className='p-6'>
        <Button
          variant='ghost'
          className='mb-4'
          onClick={() => setOpenSection(null)}
        >
          <ChevronLeft className='mr-1 h-4 w-4' />
          Back to all courses
        </Button>

        <PageTitle
          heading={`${openSection.courseCode} — Attendance`}
          text={`${openSection.courseName} · Section ${openSection.sectionName}`}
        />

        <Card>
          <CardContent className='pt-6'>
            {historyLoading ? (
              <p className='py-8 text-center text-muted-foreground'>Loading…</p>
            ) : (
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Slot</TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((entry, index) => (
                      <TableRow key={`${entry.date}-${entry.slot}-${index}`}>
                        <TableCell>{String(entry.date).slice(0, 10)}</TableCell>
                        <TableCell>{entry.slot}</TableCell>
                        <TableCell>
                          {entry.topic || (
                            <span className='text-muted-foreground'>—</span>
                          )}
                        </TableCell>
                        <TableCell>{statusBadge(entry.status)}</TableCell>
                      </TableRow>
                    ))}
                    {history.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className='py-8 text-center text-muted-foreground'
                        >
                          No finalized classes recorded for this course yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Overview ──────────────────────────────────────────────────────────────
  return (
    <div className='p-6'>
      <PageTitle
        heading='My Attendance'
        text='Your attendance per course and whether it meets the exam eligibility requirement.'
      />

      {shortCourses.length > 0 && (
        <div className='mb-6 flex items-start gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-4'>
          <AlertTriangle className='mt-0.5 h-5 w-5 shrink-0 text-amber-600' />
          <div className='text-sm'>
            <p className='font-medium'>
              {shortCourses.length} course
              {shortCourses.length > 1 ? 's need' : ' needs'} attention
            </p>
            <p className='mt-1 text-muted-foreground'>
              You are at or below the attendance requirement in{' '}
              {shortCourses.map((course) => course.courseCode).join(', ')}.
              Contact your course teacher or department office if this is due to
              approved leave.
            </p>
          </div>
        </div>
      )}

      <div className='mb-6 grid gap-4 md:grid-cols-3'>
        <Card>
          <CardContent className='pt-6'>
            <p className='text-sm text-muted-foreground'>Overall attendance</p>
            <p className='text-3xl font-bold'>{overall}%</p>
            <Progress value={overall} className='mt-3' />
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6'>
            <p className='text-sm text-muted-foreground'>Courses enrolled</p>
            <p className='text-3xl font-bold'>{courses.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6'>
            <p className='text-sm text-muted-foreground'>Below threshold</p>
            <p className='text-3xl font-bold text-destructive'>
              {courses.filter((course) => course.verdict === 'ineligible').length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course-wise attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Attended</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='text-right'>Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.sectionId}>
                    <TableCell>
                      <div className='font-medium'>{course.courseCode}</div>
                      <div className='text-sm text-muted-foreground'>
                        {course.courseName}
                      </div>
                    </TableCell>
                    <TableCell>{course.sectionName}</TableCell>
                    <TableCell>
                      {course.tally.attendedSessions}/
                      {course.tally.countedSessions}
                      {course.tally.excused > 0 && (
                        <span className='ml-1 text-xs text-muted-foreground'>
                          (+{course.tally.excused} excused)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className='font-medium'>
                      {course.tally.hasData
                        ? `${course.tally.attendancePercent}%`
                        : '—'}
                    </TableCell>
                    <TableCell>{course.threshold}%</TableCell>
                    <TableCell>
                      {verdictBadge(course.verdict)}
                      {course.overrideRemarks && (
                        <div className='mt-1 text-xs text-muted-foreground'>
                          {course.overrideRemarks}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className='text-right'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => viewHistory(course)}
                      >
                        View classes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {courses.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className='py-8 text-center text-muted-foreground'
                    >
                      You are not enrolled in any sections yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
