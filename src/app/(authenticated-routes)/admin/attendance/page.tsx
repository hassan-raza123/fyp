'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Download, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import PageTitle from '@/components/ui/PageTitle';
import { PageLoading } from '@/components/ui/page-loading';

interface Semester {
  id: number;
  name: string;
  status?: string;
}

interface Defaulter {
  studentId: number;
  rollNumber: string;
  name: string;
  courseCode: string;
  courseName: string;
  sectionId: number;
  sectionName: string;
  attendancePercent: number;
  attendedSessions: number;
  countedSessions: number;
  threshold: number;
  verdict: string;
}

function verdictBadge(verdict: string) {
  if (verdict === 'at_risk') {
    return <Badge className='bg-warn hover:bg-warn'>At risk</Badge>;
  }
  return <Badge variant='destructive'>Below threshold</Badge>;
}

export default function AdminAttendancePage() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [includeAtRisk, setIncludeAtRisk] = useState(false);
  const [search, setSearch] = useState('');

  const [defaulters, setDefaulters] = useState<Defaulter[]>([]);
  const [uniqueStudents, setUniqueStudents] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Eligibility override dialog
  const [overrideTarget, setOverrideTarget] = useState<Defaulter | null>(null);
  const [overrideRemarks, setOverrideRemarks] = useState('');
  const [savingOverride, setSavingOverride] = useState(false);

  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const response = await fetch('/api/semesters', {
          credentials: 'include',
        });
        const result = await response.json();
        const list: Semester[] = Array.isArray(result)
          ? result
          : result.data || [];
        setSemesters(list);
        // Default to the active semester so the page is useful on first load.
        const active = list.find((semester) => semester.status === 'active');
        if (active) setSelectedSemester(active.id);
        else if (list.length > 0) setSelectedSemester(list[0].id);
      } catch (error) {
        toast.error('Failed to load semesters');
        console.error(error);
      } finally {
        setInitialLoad(false);
      }
    };
    fetchSemesters();
  }, []);

  const loadDefaulters = useCallback(async () => {
    if (!selectedSemester) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/attendance/defaulters?semesterId=${selectedSemester}&includeAtRisk=${includeAtRisk}`,
        { credentials: 'include' }
      );
      const result = await response.json();
      if (!result.success) {
        toast.error(result.error || 'Failed to load defaulters');
        return;
      }
      setDefaulters(result.data.defaulters);
      setUniqueStudents(result.data.uniqueStudents);
    } catch (error) {
      toast.error('Failed to load defaulters');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [selectedSemester, includeAtRisk]);

  useEffect(() => {
    // Deferred so the state updates inside `loadDefaulters` do not run
    // synchronously in the effect body and cascade a second render.
    void Promise.resolve().then(loadDefaulters);
  }, [loadDefaulters]);

  const filtered = defaulters.filter((row) => {
    if (!search.trim()) return true;
    const needle = search.toLowerCase();
    return (
      row.rollNumber.toLowerCase().includes(needle) ||
      row.name.toLowerCase().includes(needle) ||
      row.courseCode.toLowerCase().includes(needle)
    );
  });

  const handleCondone = async () => {
    if (!overrideTarget) return;
    if (!overrideRemarks.trim()) {
      toast.error('A reason is required');
      return;
    }

    setSavingOverride(true);
    try {
      const response = await fetch('/api/attendance/eligibility', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: overrideTarget.studentId,
          sectionId: overrideTarget.sectionId,
          override: 'eligible',
          remarks: overrideRemarks.trim(),
        }),
      });
      const result = await response.json();
      if (!result.success) {
        toast.error(result.error || 'Failed to record the override');
        return;
      }

      toast.success(`${overrideTarget.name} condoned for ${overrideTarget.courseCode}`);
      setOverrideTarget(null);
      setOverrideRemarks('');
      await loadDefaulters();
    } catch (error) {
      toast.error('Failed to record the override');
      console.error(error);
    } finally {
      setSavingOverride(false);
    }
  };

  const exportPdf = () => {
    if (filtered.length === 0) {
      toast.error('Nothing to export');
      return;
    }

    try {
      const doc = new jsPDF();
      const semesterName =
        semesters.find((semester) => semester.id === selectedSemester)?.name ??
        '';

      doc.setFontSize(18);
      doc.text('Attendance Defaulters Report', 14, 20);

      doc.setFontSize(10);
      doc.text(`Semester: ${semesterName}`, 14, 28);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 34);
      doc.text(
        `${filtered.length} record(s) across ${uniqueStudents} student(s)`,
        14,
        40
      );

      autoTable(doc, {
        startY: 46,
        head: [
          [
            'Roll No',
            'Name',
            'Course',
            'Section',
            'Attended',
            'Attendance',
            'Required',
          ],
        ],
        body: filtered.map((row) => [
          row.rollNumber,
          row.name,
          row.courseCode,
          row.sectionName,
          `${row.attendedSessions}/${row.countedSessions}`,
          `${row.attendancePercent}%`,
          `${row.threshold}%`,
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [38, 40, 149] },
      });

      doc.save(`attendance-defaulters-${semesterName || 'report'}.pdf`);
      toast.success('Defaulters report exported');
    } catch (error) {
      toast.error('Failed to export PDF');
      console.error(error);
    }
  };

  if (initialLoad) return <PageLoading />;

  return (
    <div className='p-6'>
      <PageTitle
        heading='Attendance & Exam Eligibility'
        text='Students below the attendance requirement across the department.'
      />

      <Card className='mb-6'>
        <CardContent className='pt-6'>
          <div className='grid gap-4 md:grid-cols-4'>
            <div>
              <Label>Semester</Label>
              <Select
                value={selectedSemester ? String(selectedSemester) : undefined}
                onValueChange={(value) =>
                  setSelectedSemester(parseInt(value, 10))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select semester' />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((semester) => (
                    <SelectItem key={semester.id} value={String(semester.id)}>
                      {semester.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='md:col-span-2'>
              <Label>Search</Label>
              <Input
                value={search}
                placeholder='Roll number, name or course code'
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className='flex items-end'>
              <div className='flex items-center gap-2'>
                <Switch
                  checked={includeAtRisk}
                  onCheckedChange={setIncludeAtRisk}
                  id='at-risk'
                />
                <Label htmlFor='at-risk' className='cursor-pointer'>
                  Include at-risk
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className='mb-4 grid gap-4 md:grid-cols-3'>
        <Card>
          <CardContent className='pt-6'>
            <p className='text-sm text-muted-foreground'>Records</p>
            <p className='text-2xl font-bold'>{filtered.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6'>
            <p className='text-sm text-muted-foreground'>Students affected</p>
            <p className='text-2xl font-bold'>{uniqueStudents}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='flex items-center pt-6'>
            <Button onClick={exportPdf} className='w-full'>
              <Download className='mr-2 h-4 w-4' />
              Export PDF
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className='pt-6'>
          {loading ? (
            <p className='py-8 text-center text-muted-foreground'>Loading…</p>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Attended</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row) => (
                    <TableRow key={`${row.studentId}-${row.courseCode}-${row.sectionName}`}>
                      <TableCell className='font-mono text-sm'>
                        {row.rollNumber}
                      </TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.courseCode}</TableCell>
                      <TableCell>{row.sectionName}</TableCell>
                      <TableCell>
                        {row.attendedSessions}/{row.countedSessions}
                      </TableCell>
                      <TableCell className='font-medium'>
                        {row.attendancePercent}%
                      </TableCell>
                      <TableCell>{row.threshold}%</TableCell>
                      <TableCell>{verdictBadge(row.verdict)}</TableCell>
                      <TableCell className='text-right'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => {
                            setOverrideTarget(row);
                            setOverrideRemarks('');
                          }}
                        >
                          <ShieldCheck className='mr-1 h-4 w-4' />
                          Condone
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className='py-8 text-center text-muted-foreground'
                      >
                        No students below the attendance requirement.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={overrideTarget !== null}
        onOpenChange={(open) => !open && setOverrideTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Condone attendance shortfall</DialogTitle>
            <DialogDescription>
              {overrideTarget && (
                <>
                  {overrideTarget.name} ({overrideTarget.rollNumber}) attended{' '}
                  {overrideTarget.attendancePercent}% of{' '}
                  {overrideTarget.courseCode}, below the{' '}
                  {overrideTarget.threshold}% requirement. Condoning marks them
                  eligible to sit the exam. The reason is recorded in the audit
                  log.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div>
            <Label htmlFor='remarks'>Reason</Label>
            <Textarea
              id='remarks'
              value={overrideRemarks}
              onChange={(event) => setOverrideRemarks(event.target.value)}
              placeholder='e.g. Hospitalised 12–26 Mar, medical certificate on file'
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setOverrideTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleCondone} disabled={savingOverride}>
              Condone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
