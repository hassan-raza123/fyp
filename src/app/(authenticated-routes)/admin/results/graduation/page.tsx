'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import {
  GraduationCap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  RefreshCw,
  Eye,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Program {
  id: number;
  name: string;
  code: string;
}

interface Batch {
  id: string;
  name: string;
  code: string;
}

interface StudentRow {
  studentId: number;
  rollNumber: string;
  name: string;
  program: { id: number; name: string; code: string };
  batch: { name: string; code: string } | null;
  cgpa: number | null;
  totalPlos: number;
  attainedPlos: number;
  assessedPlos: number;
  completionPercent: number;
  isEligible: boolean;
}

interface PLOStatus {
  ploId: number;
  ploCode: string;
  description: string;
  bloomLevel: string | null;
  bestScore: number | null;
  attained: boolean;
  threshold: number;
  attempts: { courseCode: string; semesterName: string; percentage: number }[];
}

interface GraduationDetail {
  student: {
    id: number;
    rollNumber: string;
    name: string;
    email: string;
    program: { id: number; name: string; code: string; duration: number };
    batch: { name: string; code: string } | null;
    cumulativeGPA: number | null;
    completedCourses: number;
  };
  summary: {
    totalPlos: number;
    attainedPlos: number;
    notAssessedPlos: number;
    completionPercent: number;
    isEligible: boolean;
    threshold: number;
  };
  ploStatus: PLOStatus[];
}

export default function GraduationTrackerPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode ? 'rgba(252,153,40,0.15)' : 'rgba(38,40,149,0.15)';

  const [programs, setPrograms] = useState<Program[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [search, setSearch] = useState('');

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<GraduationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    Promise.all([
      fetch('/api/programs', { credentials: 'include' }).then((r) => r.json()),
      fetch('/api/batches', { credentials: 'include' }).then((r) => r.json()),
    ]).then(([pData, bData]) => {
      setPrograms(pData.data ?? pData ?? []);
      setBatches(bData.data ?? bData ?? []);
    }).catch(() => toast.error('Failed to load filters'));
  }, []);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedProgram) params.set('programId', selectedProgram);
      if (selectedBatch) params.set('batchId', selectedBatch);
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/graduation?${params}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.data ?? []);
      }
    } catch {
      toast.error('Failed to load graduation data');
    } finally {
      setLoading(false);
    }
  }, [selectedProgram, selectedBatch, search]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  const openDetail = async (studentId: number) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await fetch(`/api/students/${studentId}/graduation-status`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setDetail(data.data);
      } else {
        toast.error('Failed to load student detail');
      }
    } catch {
      toast.error('Failed to load student detail');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleExport = () => {
    const headers = ['Roll Number', 'Name', 'Program', 'Batch', 'CGPA', 'Total PLOs', 'Attained PLOs', 'Completion %', 'Eligible'];
    const rows = students.map((s) => [
      s.rollNumber, s.name, s.program.code, s.batch?.code ?? '', s.cgpa?.toFixed(2) ?? '',
      s.totalPlos, s.attainedPlos, s.completionPercent + '%', s.isEligible ? 'Yes' : 'No',
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'graduation-status.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const eligible = students.filter((s) => s.isEligible).length;
  const notEligible = students.filter((s) => !s.isEligible && s.assessedPlos > 0).length;
  const notAssessed = students.filter((s) => s.assessedPlos === 0).length;

  if (!mounted) return null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: iconBgColor }}>
            <GraduationCap className="h-5 w-5" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary-text">Graduation Tracker</h1>
            <p className="text-xs text-secondary-text mt-0.5">
              Track PLO completion and graduation eligibility for each student
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="h-8 text-xs text-secondary-text" onClick={loadStudents}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs gap-1.5"
            style={{ backgroundColor: iconBgColor, color: primaryColor }}
            onClick={handleExport}
            disabled={students.length === 0}
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      {students.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 p-4 flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{eligible}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-500">Eligible for Graduation</p>
            </div>
          </div>
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-4 flex items-center gap-3">
            <XCircle className="h-8 w-8 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">{notEligible}</p>
              <p className="text-xs text-red-600 dark:text-red-500">Not Yet Eligible</p>
            </div>
          </div>
          <div className="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20 p-4 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-yellow-500 flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{notAssessed}</p>
              <p className="text-xs text-yellow-600 dark:text-yellow-500">Not Yet Assessed</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-xs text-secondary-text mb-1 block">Program</Label>
          <Select value={selectedProgram} onValueChange={setSelectedProgram}>
            <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
              <SelectValue placeholder="All programs" />
            </SelectTrigger>
            <SelectContent className="bg-card border-card-border">
              <SelectItem value="" className="text-xs text-primary-text">All Programs</SelectItem>
              {programs.map((p) => (
                <SelectItem key={p.id} value={String(p.id)} className="text-xs text-primary-text">
                  {p.code} — {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-secondary-text mb-1 block">Batch</Label>
          <Select value={selectedBatch} onValueChange={setSelectedBatch}>
            <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
              <SelectValue placeholder="All batches" />
            </SelectTrigger>
            <SelectContent className="bg-card border-card-border">
              <SelectItem value="" className="text-xs text-primary-text">All Batches</SelectItem>
              {batches.map((b) => (
                <SelectItem key={b.id} value={b.id} className="text-xs text-primary-text">
                  {b.code} — {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-secondary-text mb-1 block">Search</Label>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-secondary-text" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Roll number or name..."
              className="h-8 text-xs pl-7 bg-card border-card-border text-primary-text"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-card-border overflow-hidden">
        <div className="bg-muted/30 border-b border-card-border px-4 py-2.5">
          <p className="text-xs font-semibold text-primary-text">
            Students ({students.length})
          </p>
        </div>
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: primaryColor, borderTopColor: 'transparent' }} />
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-secondary-text gap-2">
            <GraduationCap className="h-8 w-8 opacity-20" />
            <p className="text-xs">No students found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 border-b border-card-border">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-secondary-text">Student</th>
                  <th className="text-left px-4 py-2.5 font-medium text-secondary-text">Program</th>
                  <th className="text-left px-4 py-2.5 font-medium text-secondary-text">Batch</th>
                  <th className="text-left px-4 py-2.5 font-medium text-secondary-text">CGPA</th>
                  <th className="text-left px-4 py-2.5 font-medium text-secondary-text">PLO Completion</th>
                  <th className="text-left px-4 py-2.5 font-medium text-secondary-text">Status</th>
                  <th className="text-left px-4 py-2.5 font-medium text-secondary-text">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.map((student) => (
                  <tr key={student.studentId} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-primary-text">{student.rollNumber}</div>
                      <div className="text-secondary-text text-[10px] mt-0.5">{student.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-primary-text">{student.program.code}</div>
                      <div className="text-secondary-text text-[10px]">{student.program.name}</div>
                    </td>
                    <td className="px-4 py-3 text-secondary-text">
                      {student.batch?.code ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {student.cgpa !== null ? (
                        <span className={`font-semibold ${student.cgpa >= 2.0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {student.cgpa.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-secondary-text">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-1.5 w-24">
                          <div
                            className="h-1.5 rounded-full transition-all"
                            style={{
                              width: `${student.completionPercent}%`,
                              backgroundColor: student.completionPercent === 100
                                ? '#10b981'
                                : student.completionPercent >= 60
                                ? primaryColor
                                : '#ef4444',
                            }}
                          />
                        </div>
                        <span className="text-[10px] font-medium text-primary-text w-20">
                          {student.attainedPlos}/{student.totalPlos} PLOs ({student.completionPercent}%)
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {student.assessedPlos === 0 ? (
                        <Badge className="text-[10px] h-4 px-1.5 bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                          Not Assessed
                        </Badge>
                      ) : student.isEligible ? (
                        <Badge className="text-[10px] h-4 px-1.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                          Eligible
                        </Badge>
                      ) : (
                        <Badge className="text-[10px] h-4 px-1.5 bg-red-500/10 text-red-600 border-red-500/20">
                          Not Eligible
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-[10px]"
                        onClick={() => openDetail(student.studentId)}
                      >
                        <Eye className="h-2.5 w-2.5 mr-1" /> View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL DIALOG */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl bg-card border-card-border text-primary-text p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-primary-text">
              Graduation Detail
            </DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: primaryColor, borderTopColor: 'transparent' }} />
            </div>
          ) : detail ? (
            <div className="space-y-5 mt-2">
              {/* Student info */}
              <div className="rounded-lg bg-muted/30 p-4 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-secondary-text">Student</p>
                  <p className="font-bold text-primary-text text-sm mt-0.5">{detail.student.name}</p>
                  <p className="text-secondary-text mt-0.5">{detail.student.rollNumber} · {detail.student.email}</p>
                </div>
                <div>
                  <p className="text-secondary-text">Program</p>
                  <p className="font-semibold text-primary-text mt-0.5">{detail.student.program.code} — {detail.student.program.name}</p>
                  <p className="text-secondary-text mt-0.5">
                    Batch: {detail.student.batch?.code ?? '—'} · CGPA: {detail.student.cumulativeGPA?.toFixed(2) ?? '—'} · Courses: {detail.student.completedCourses}
                  </p>
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Total PLOs', value: detail.summary.totalPlos, color: 'text-primary-text' },
                  { label: 'Attained', value: detail.summary.attainedPlos, color: 'text-emerald-600 dark:text-emerald-400' },
                  { label: 'Not Assessed', value: detail.summary.notAssessedPlos, color: 'text-yellow-600 dark:text-yellow-400' },
                  { label: 'Completion', value: `${detail.summary.completionPercent}%`, color: detail.summary.isEligible ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400' },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-card-border bg-card p-3 text-center">
                    <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                    <p className="text-[10px] text-secondary-text mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>

              {/* Eligibility banner */}
              <div className={`rounded-lg p-3 flex items-center gap-3 ${detail.summary.isEligible ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800'}`}>
                {detail.summary.isEligible ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                )}
                <p className={`text-xs font-semibold ${detail.summary.isEligible ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                  {detail.summary.isEligible
                    ? 'This student has met all PLOs and is eligible for graduation.'
                    : `This student has not met all PLOs. ${detail.summary.totalPlos - detail.summary.attainedPlos} PLO(s) still need to be attained (threshold: ${detail.summary.threshold}%).`}
                </p>
              </div>

              {/* PLO by PLO breakdown */}
              <div>
                <p className="text-xs font-semibold text-primary-text mb-2">PLO Attainment Breakdown</p>
                <div className="space-y-2">
                  {detail.ploStatus.map((plo) => (
                    <div
                      key={plo.ploId}
                      className={`rounded-lg border p-3 ${plo.attained ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/10' : plo.bestScore === null ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/10' : 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/10'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${plo.attained ? 'text-emerald-700 dark:text-emerald-400' : plo.bestScore === null ? 'text-yellow-700 dark:text-yellow-400' : 'text-red-700 dark:text-red-400'}`}>
                              {plo.ploCode}
                            </span>
                            {plo.bloomLevel && (
                              <Badge variant="outline" className="text-[9px] h-3.5 px-1 text-secondary-text border-card-border">
                                {plo.bloomLevel}
                              </Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-secondary-text mt-0.5 leading-relaxed">{plo.description}</p>
                          {plo.attempts.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {plo.attempts.map((a, i) => (
                                <span key={i} className="text-[9px] bg-muted rounded px-1.5 py-0.5 text-secondary-text">
                                  {a.courseCode} ({a.semesterName}): {a.percentage.toFixed(1)}%
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          {plo.bestScore !== null ? (
                            <>
                              <p className={`text-sm font-bold ${plo.attained ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                                {plo.bestScore.toFixed(1)}%
                              </p>
                              <p className="text-[9px] text-secondary-text">Threshold: {plo.threshold}%</p>
                            </>
                          ) : (
                            <span className="text-[10px] text-yellow-600 dark:text-yellow-400 font-medium">Not Assessed</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
