'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import {
  TrendingUp,
  Plus,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface Program {
  id: number;
  name: string;
  code: string;
}

interface Semester {
  id: number;
  name: string;
}

interface CourseOffering {
  id: number;
  course: { id: number; code: string; name: string };
  semester: { name: string };
}

interface Plo {
  id: number;
  code: string;
  description: string;
}

interface PLOAttainment {
  ploId: number;
  ploCode: string;
  description: string;
  attainment: number;
  directAttainment: number;
  indirectAttainment: number | null;
}

interface ActionPlan {
  id: number;
  courseOfferingId: number;
  ploId: number;
  semesterId: number;
  attainmentValue: number;
  threshold: number;
  rootCause: string | null;
  actionTaken: string | null;
  expectedOutcome: string | null;
  targetDate: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  plo: { id: number; code: string; description: string };
  semester: { id: number; name: string };
  courseOffering: { id: number; course: { id: number; code: string; name: string } };
  creator: { first_name: string; last_name: string };
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  in_progress: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  completed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  cancelled: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const THRESHOLD = 60;

export default function ActionPlansPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode ? 'rgba(252,153,40,0.15)' : 'rgba(38,40,149,0.15)';

  const [programs, setPrograms] = useState<Program[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>([]);
  const [programPlos, setProgramPlos] = useState<Plo[]>([]);

  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [ploAttainments, setPloAttainments] = useState<PLOAttainment[]>([]);
  const [ploLoading, setPloLoading] = useState(false);

  const [plans, setPlans] = useState<ActionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ActionPlan | null>(null);
  const [saving, setSaving] = useState(false);

  const [createForm, setCreateForm] = useState({
    courseOfferingId: '',
    ploId: '',
    semesterId: '',
    attainmentValue: '',
    threshold: String(THRESHOLD),
    rootCause: '',
    actionTaken: '',
    expectedOutcome: '',
    targetDate: '',
  });

  const [editForm, setEditForm] = useState({
    rootCause: '',
    actionTaken: '',
    expectedOutcome: '',
    targetDate: '',
    status: 'pending' as ActionPlan['status'],
  });

  useEffect(() => { setMounted(true); }, []);

  // Load programs, semesters, course offerings
  useEffect(() => {
    Promise.all([
      fetch('/api/programs', { credentials: 'include' }).then((r) => r.json()),
      fetch('/api/semesters', { credentials: 'include' }).then((r) => r.json()),
      fetch('/api/course-offerings', { credentials: 'include' }).then((r) => r.json()),
    ]).then(([pData, sData, coData]) => {
      setPrograms(pData.data ?? pData ?? []);
      setSemesters(sData.data ?? sData ?? []);
      setCourseOfferings(coData.data ?? coData ?? []);
    }).catch(() => toast.error('Failed to load data'));
  }, []);

  // Load PLOs for selected program
  useEffect(() => {
    if (!selectedProgram) { setProgramPlos([]); return; }
    fetch(`/api/programs/${selectedProgram}/plos`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setProgramPlos(d.data ?? d ?? []))
      .catch(() => setProgramPlos([]));
  }, [selectedProgram]);

  // Load PLO attainments when program+semester selected
  const loadPloAttainments = useCallback(async () => {
    if (!selectedProgram || !selectedSemester) { setPloAttainments([]); return; }
    setPloLoading(true);
    try {
      const res = await fetch(
        `/api/plo-attainments?programId=${selectedProgram}&semesterId=${selectedSemester}`,
        { credentials: 'include' }
      );
      if (res.ok) {
        const data = await res.json();
        setPloAttainments(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error('Failed to load PLO attainments');
    } finally {
      setPloLoading(false);
    }
  }, [selectedProgram, selectedSemester]);

  useEffect(() => { loadPloAttainments(); }, [loadPloAttainments]);

  // Load action plans
  const loadPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedProgram) params.set('programId', selectedProgram);
      if (selectedSemester) params.set('semesterId', selectedSemester);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`/api/action-plans?${params}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setPlans(data.data ?? []);
      }
    } catch {
      toast.error('Failed to load action plans');
    } finally {
      setPlansLoading(false);
    }
  }, [selectedProgram, selectedSemester, statusFilter]);

  useEffect(() => { loadPlans(); }, [loadPlans]);

  const openCreateFromPlo = (plo: PLOAttainment) => {
    setCreateForm({
      courseOfferingId: '',
      ploId: String(plo.ploId),
      semesterId: selectedSemester,
      attainmentValue: plo.attainment.toFixed(1),
      threshold: String(THRESHOLD),
      rootCause: '',
      actionTaken: '',
      expectedOutcome: '',
      targetDate: '',
    });
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!createForm.courseOfferingId || !createForm.ploId || !createForm.semesterId) {
      toast.error('Course offering, PLO, and semester are required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/action-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          courseOfferingId: parseInt(createForm.courseOfferingId),
          ploId: parseInt(createForm.ploId),
          semesterId: parseInt(createForm.semesterId),
          attainmentValue: parseFloat(createForm.attainmentValue || '0'),
          threshold: parseFloat(createForm.threshold || '60'),
          rootCause: createForm.rootCause || null,
          actionTaken: createForm.actionTaken || null,
          expectedOutcome: createForm.expectedOutcome || null,
          targetDate: createForm.targetDate || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Failed to create plan'); return; }
      toast.success('Action plan created');
      setCreateOpen(false);
      await loadPlans();
    } catch {
      toast.error('Failed to create action plan');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (plan: ActionPlan) => {
    setEditTarget(plan);
    setEditForm({
      rootCause: plan.rootCause ?? '',
      actionTaken: plan.actionTaken ?? '',
      expectedOutcome: plan.expectedOutcome ?? '',
      targetDate: plan.targetDate ? plan.targetDate.split('T')[0] : '',
      status: plan.status,
    });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/action-plans/${editTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          rootCause: editForm.rootCause || null,
          actionTaken: editForm.actionTaken || null,
          expectedOutcome: editForm.expectedOutcome || null,
          targetDate: editForm.targetDate || null,
          status: editForm.status,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Failed to update plan'); return; }
      toast.success('Action plan updated');
      setEditOpen(false);
      setEditTarget(null);
      await loadPlans();
    } catch {
      toast.error('Failed to update action plan');
    } finally {
      setSaving(false);
    }
  };

  const belowThreshold = ploAttainments.filter((p) => p.attainment < THRESHOLD);
  const aboveThreshold = ploAttainments.filter((p) => p.attainment >= THRESHOLD);

  // Filter course offerings for selected semester
  const semesterOfferings = selectedSemester
    ? courseOfferings.filter((co) => String(co.semester?.name) || true)
    : courseOfferings;

  if (!mounted) return null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: iconBgColor }}>
            <TrendingUp className="h-5 w-5" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary-text">Action Plans</h1>
            <p className="text-xs text-secondary-text mt-0.5">
              Continuous improvement tracking for PLOs below threshold
            </p>
          </div>
        </div>
        <Button
          size="sm"
          className="h-8 text-xs gap-1.5"
          style={{ backgroundColor: iconBgColor, color: primaryColor }}
          variant="ghost"
          onClick={() => {
            setCreateForm({
              courseOfferingId: '',
              ploId: '',
              semesterId: selectedSemester,
              attainmentValue: '',
              threshold: String(THRESHOLD),
              rootCause: '',
              actionTaken: '',
              expectedOutcome: '',
              targetDate: '',
            });
            setCreateOpen(true);
          }}
        >
          <Plus className="h-3.5 w-3.5" /> Create Plan
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-xs text-secondary-text mb-1 block">Program</Label>
          <Select value={selectedProgram} onValueChange={setSelectedProgram}>
            <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
              <SelectValue placeholder="All programs" />
            </SelectTrigger>
            <SelectContent className="bg-card border-card-border">
              {programs.map((p) => (
                <SelectItem key={p.id} value={String(p.id)} className="text-xs text-primary-text">
                  {p.code} — {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-secondary-text mb-1 block">Semester</Label>
          <Select value={selectedSemester} onValueChange={setSelectedSemester}>
            <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
              <SelectValue placeholder="All semesters" />
            </SelectTrigger>
            <SelectContent className="bg-card border-card-border">
              {semesters.map((s) => (
                <SelectItem key={s.id} value={String(s.id)} className="text-xs text-primary-text">
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-secondary-text mb-1 block">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-card-border">
              <SelectItem value="all" className="text-xs text-primary-text">All Statuses</SelectItem>
              <SelectItem value="pending" className="text-xs text-primary-text">Pending</SelectItem>
              <SelectItem value="in_progress" className="text-xs text-primary-text">In Progress</SelectItem>
              <SelectItem value="completed" className="text-xs text-primary-text">Completed</SelectItem>
              <SelectItem value="cancelled" className="text-xs text-primary-text">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* PLO Attainment Summary */}
      {selectedProgram && selectedSemester && (
        <div className="rounded-lg border border-card-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-primary-text">
              PLO Attainment Summary
              <span className="ml-2 font-normal text-secondary-text">(threshold: {THRESHOLD}%)</span>
            </p>
            <Button size="sm" variant="ghost" className="h-6 text-xs text-secondary-text" onClick={loadPloAttainments}>
              <RefreshCw className="h-3 w-3 mr-1" /> Refresh
            </Button>
          </div>
          {ploLoading ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: primaryColor, borderTopColor: 'transparent' }} />
            </div>
          ) : ploAttainments.length === 0 ? (
            <p className="text-xs text-secondary-text text-center py-2">
              No CLO attainments calculated yet for this program/semester. Calculate CLO attainments first.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {/* Below threshold — red border with Create Plan button */}
              {belowThreshold.map((plo) => (
                <div key={plo.ploId}
                  className="rounded-lg border-2 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-3 space-y-1.5">
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <p className="text-xs font-bold text-red-700 dark:text-red-400">{plo.ploCode}</p>
                      <p className="text-[10px] text-red-600 dark:text-red-500 leading-tight mt-0.5 line-clamp-2">{plo.description}</p>
                    </div>
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex-1 bg-red-100 dark:bg-red-900/30 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-red-500" style={{ width: `${Math.min(plo.attainment, 100)}%` }} />
                    </div>
                    <span className="text-[10px] font-semibold text-red-700 dark:text-red-400 w-10 text-right">
                      {plo.attainment.toFixed(1)}%
                    </span>
                  </div>
                  {plo.indirectAttainment !== null && (
                    <p className="text-[9px] text-red-500">
                      Direct: {plo.directAttainment.toFixed(1)}% · Indirect: {plo.indirectAttainment.toFixed(1)}%
                    </p>
                  )}
                  <Button
                    size="sm"
                    className="h-6 text-[10px] w-full bg-red-500 hover:bg-red-600 text-white"
                    onClick={() => openCreateFromPlo(plo)}
                  >
                    <Plus className="h-2.5 w-2.5 mr-1" /> Create Plan
                  </Button>
                </div>
              ))}
              {/* Above threshold — green */}
              {aboveThreshold.map((plo) => (
                <div key={plo.ploId}
                  className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 p-3 space-y-1.5">
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{plo.ploCode}</p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-500 leading-tight mt-0.5 line-clamp-2">{plo.description}</p>
                    </div>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${Math.min(plo.attainment, 100)}%` }} />
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 w-10 text-right">
                      {plo.attainment.toFixed(1)}%
                    </span>
                  </div>
                  {plo.indirectAttainment !== null && (
                    <p className="text-[9px] text-emerald-600">
                      Direct: {plo.directAttainment.toFixed(1)}% · Indirect: {plo.indirectAttainment.toFixed(1)}%
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Plans Table */}
      <div className="rounded-lg border border-card-border overflow-hidden">
        <div className="bg-muted/30 border-b border-card-border px-4 py-2.5 flex items-center justify-between">
          <p className="text-xs font-semibold text-primary-text">Action Plans ({plans.length})</p>
          <Button size="sm" variant="ghost" className="h-6 text-xs text-secondary-text" onClick={loadPlans}>
            <RefreshCw className="h-3 w-3 mr-1" /> Refresh
          </Button>
        </div>
        {plansLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: primaryColor, borderTopColor: 'transparent' }} />
          </div>
        ) : plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-secondary-text gap-2">
            <TrendingUp className="h-8 w-8 opacity-20" />
            <p className="text-xs">No action plans found.</p>
            {belowThreshold.length > 0 && (
              <p className="text-[11px] text-red-500">
                {belowThreshold.length} PLO(s) below threshold — create plans from the summary above.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 border-b border-card-border">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-secondary-text">PLO</th>
                  <th className="text-left px-4 py-2.5 font-medium text-secondary-text">Course</th>
                  <th className="text-left px-4 py-2.5 font-medium text-secondary-text">Semester</th>
                  <th className="text-left px-4 py-2.5 font-medium text-secondary-text">Attainment</th>
                  <th className="text-left px-4 py-2.5 font-medium text-secondary-text">Threshold</th>
                  <th className="text-left px-4 py-2.5 font-medium text-secondary-text">Status</th>
                  <th className="text-left px-4 py-2.5 font-medium text-secondary-text">Target Date</th>
                  <th className="text-left px-4 py-2.5 font-medium text-secondary-text">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-primary-text">{plan.plo.code}</div>
                      <div className="text-secondary-text text-[10px] mt-0.5 max-w-[160px] truncate">{plan.plo.description}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-primary-text">{plan.courseOffering.course.code}</div>
                      <div className="text-secondary-text text-[10px]">{plan.courseOffering.course.name}</div>
                    </td>
                    <td className="px-4 py-3 text-secondary-text">{plan.semester.name}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        {plan.attainmentValue.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-secondary-text">{plan.threshold}%</td>
                    <td className="px-4 py-3">
                      <Badge className={`text-[10px] h-4 px-1.5 border ${STATUS_BADGE[plan.status]}`}>
                        {STATUS_LABELS[plan.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-secondary-text">
                      {plan.targetDate ? new Date(plan.targetDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-[10px]"
                        onClick={() => openEdit(plan)}
                      >
                        <Edit2 className="h-2.5 w-2.5 mr-1" /> Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE DIALOG */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl bg-card border-card-border text-primary-text p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-primary-text">Create Action Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label className="text-xs text-secondary-text">PLO *</Label>
                <Select value={createForm.ploId} onValueChange={(v) => setCreateForm((f) => ({ ...f, ploId: v }))}>
                  <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
                    <SelectValue placeholder="Select PLO" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-card-border">
                    {programPlos.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)} className="text-xs text-primary-text">
                        {p.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-secondary-text">Course Offering *</Label>
                <Select value={createForm.courseOfferingId} onValueChange={(v) => setCreateForm((f) => ({ ...f, courseOfferingId: v }))}>
                  <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
                    <SelectValue placeholder="Select course offering" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-card-border">
                    {semesterOfferings.map((co) => (
                      <SelectItem key={co.id} value={String(co.id)} className="text-xs text-primary-text">
                        {co.course.code} ({co.semester.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-1.5">
                <Label className="text-xs text-secondary-text">Semester *</Label>
                <Select value={createForm.semesterId} onValueChange={(v) => setCreateForm((f) => ({ ...f, semesterId: v }))}>
                  <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-card-border">
                    {semesters.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)} className="text-xs text-primary-text">{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-secondary-text">Attainment Value (%)</Label>
                <Input
                  type="number" min={0} max={100} step={0.1}
                  value={createForm.attainmentValue}
                  onChange={(e) => setCreateForm((f) => ({ ...f, attainmentValue: e.target.value }))}
                  className="h-8 text-xs bg-card border-card-border text-primary-text"
                  placeholder="e.g. 45.5"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-secondary-text">Threshold (%)</Label>
                <Input
                  type="number" min={0} max={100} step={0.5}
                  value={createForm.threshold}
                  onChange={(e) => setCreateForm((f) => ({ ...f, threshold: e.target.value }))}
                  className="h-8 text-xs bg-card border-card-border text-primary-text"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-secondary-text">Target Completion Date</Label>
              <Input
                type="date"
                value={createForm.targetDate}
                onChange={(e) => setCreateForm((f) => ({ ...f, targetDate: e.target.value }))}
                className="h-8 text-xs bg-card border-card-border text-primary-text"
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-secondary-text">Root Cause Analysis</Label>
              <Textarea
                value={createForm.rootCause}
                onChange={(e) => setCreateForm((f) => ({ ...f, rootCause: e.target.value }))}
                placeholder="Why did this PLO fall below threshold? What are the contributing factors?"
                rows={3}
                className="text-xs bg-card border-card-border text-primary-text resize-none"
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-secondary-text">Action to be Taken</Label>
              <Textarea
                value={createForm.actionTaken}
                onChange={(e) => setCreateForm((f) => ({ ...f, actionTaken: e.target.value }))}
                placeholder="What corrective actions will be taken? (e.g. revise teaching strategy, add practice sessions...)"
                rows={3}
                className="text-xs bg-card border-card-border text-primary-text resize-none"
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-secondary-text">Expected Outcome</Label>
              <Textarea
                value={createForm.expectedOutcome}
                onChange={(e) => setCreateForm((f) => ({ ...f, expectedOutcome: e.target.value }))}
                placeholder="What improvement is expected after taking these actions?"
                rows={2}
                className="text-xs bg-card border-card-border text-primary-text resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => setCreateOpen(false)} className="h-8 text-xs border-card-border text-primary-text">
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreate} disabled={saving} className="h-8 text-xs text-white"
                style={{ backgroundColor: primaryColor }}>
                {saving ? 'Creating...' : 'Create Plan'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl bg-card border-card-border text-primary-text p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-primary-text">Edit Action Plan</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <div className="space-y-4 mt-2">
              {/* Read-only summary */}
              <div className="rounded-lg bg-muted/40 p-3 grid grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-secondary-text">PLO</p>
                  <p className="font-semibold text-primary-text mt-0.5">{editTarget.plo.code}</p>
                </div>
                <div>
                  <p className="text-secondary-text">Course</p>
                  <p className="font-semibold text-primary-text mt-0.5">{editTarget.courseOffering.course.code}</p>
                </div>
                <div>
                  <p className="text-secondary-text">Attainment</p>
                  <p className="font-semibold text-red-600 dark:text-red-400 mt-0.5">
                    {editTarget.attainmentValue.toFixed(1)}% (threshold: {editTarget.threshold}%)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label className="text-xs text-secondary-text">Status</Label>
                  <Select value={editForm.status} onValueChange={(v) => setEditForm((f) => ({ ...f, status: v as ActionPlan['status'] }))}>
                    <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-card-border">
                      <SelectItem value="pending" className="text-xs text-primary-text">Pending</SelectItem>
                      <SelectItem value="in_progress" className="text-xs text-primary-text">In Progress</SelectItem>
                      <SelectItem value="completed" className="text-xs text-primary-text">Completed</SelectItem>
                      <SelectItem value="cancelled" className="text-xs text-primary-text">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs text-secondary-text">Target Completion Date</Label>
                  <Input
                    type="date"
                    value={editForm.targetDate}
                    onChange={(e) => setEditForm((f) => ({ ...f, targetDate: e.target.value }))}
                    className="h-8 text-xs bg-card border-card-border text-primary-text"
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-secondary-text">Root Cause Analysis</Label>
                <Textarea
                  value={editForm.rootCause}
                  onChange={(e) => setEditForm((f) => ({ ...f, rootCause: e.target.value }))}
                  rows={3}
                  className="text-xs bg-card border-card-border text-primary-text resize-none"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-secondary-text">Action to be Taken</Label>
                <Textarea
                  value={editForm.actionTaken}
                  onChange={(e) => setEditForm((f) => ({ ...f, actionTaken: e.target.value }))}
                  rows={3}
                  className="text-xs bg-card border-card-border text-primary-text resize-none"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-secondary-text">Expected Outcome</Label>
                <Textarea
                  value={editForm.expectedOutcome}
                  onChange={(e) => setEditForm((f) => ({ ...f, expectedOutcome: e.target.value }))}
                  rows={2}
                  className="text-xs bg-card border-card-border text-primary-text resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => setEditOpen(false)} className="h-8 text-xs border-card-border text-primary-text">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleEdit} disabled={saving} className="h-8 text-xs text-white"
                  style={{ backgroundColor: primaryColor }}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
