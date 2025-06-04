'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loading } from '@/components/ui/loading';
import { toast } from 'sonner';

interface Student {
  id: number;
  user: {
    first_name: string;
    last_name: string;
  };
  sectionId: number;
  studentSectionId: number;
}

interface AttendanceMarkingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: number;
  sectionId: number;
  onAttendanceMarked: () => void;
}

const statusOptions = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
];

export function AttendanceMarkingDialog({
  open,
  onOpenChange,
  sessionId,
  sectionId,
  onAttendanceMarked,
}: AttendanceMarkingDialogProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/sections/${sectionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data && data.data.studentsections) {
          setStudents(
            data.data.studentsections.map((ss: any) => ({
              id: ss.student.id,
              user: ss.student.user,
              sectionId: sectionId,
              studentSectionId: ss.id,
            }))
          );
        } else {
          setStudents([]);
        }
      })
      .finally(() => setLoading(false));
  }, [open, sectionId]);

  const handleStatusChange = (studentSectionId: number, status: string) => {
    setAttendance((prev) => ({ ...prev, [studentSectionId]: status }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const records = students.map((s) => ({
        studentSectionId: s.studentSectionId,
        status: attendance[s.studentSectionId] || 'absent',
      }));
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, records }),
      });
      const result = await res.json();
      if (!res.ok || !result.success)
        throw new Error(result.error || 'Failed to mark attendance');
      toast.success('Attendance marked successfully');
      onOpenChange(false);
      onAttendanceMarked();
    } catch (err: any) {
      toast.error(err.message || 'Failed to mark attendance');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark Attendance</DialogTitle>
        </DialogHeader>
        {loading ? (
          <Loading message='Loading students...' />
        ) : (
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='max-h-96 overflow-y-auto'>
              {students.map((student) => (
                <div
                  key={student.studentSectionId}
                  className='flex items-center gap-4 mb-2'
                >
                  <span className='flex-1'>
                    {student.user.first_name} {student.user.last_name}
                  </span>
                  <Select
                    value={attendance[student.studentSectionId] || 'present'}
                    onValueChange={(value) =>
                      handleStatusChange(student.studentSectionId, value)
                    }
                  >
                    <SelectTrigger className='w-32'>
                      <SelectValue placeholder='Status' />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button type='submit' disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Attendance'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
