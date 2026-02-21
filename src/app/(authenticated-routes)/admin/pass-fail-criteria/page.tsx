'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { ShieldCheck, Plus, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface CourseOffering {
  id: number;
  course: { id: number; code: string; name: string };
  semester: { id: number; name: string };
}

interface Criterion {
  id: number;
  courseOfferingId: number;
  minPassPercent: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  courseofferings: CourseOffering;
}

export default function PassFailCriteriaPage() {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';

  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Criterion | null>(null);
  const [saving, setSaving] = useState(false);

  const [createForm, setCreateForm] = useState({
    courseOfferingId: '',
    minPassPercent: '50',
  });
  const [editForm, setEditForm] = useState({
    minPassPercent: '50',
    status: 'active' as 'active' | 'inactive',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [criteriaRes, offeringsRes] = await Promise.all([
        fetch('/api/pass-fail-criteria', { credentials: 'include' }),
        fetch('/api/course-offerings', { credentials: 'include' }),
      ]);
      const criteriaData = await criteriaRes.json();
      const offeringsData = await offeringsRes.json();
      if (criteriaData.success) setCriteria(criteriaData.data);
      if (offeringsData.success || Array.isArray(offeringsData)) {
        setCourseOfferings(offeringsData.data ?? offeringsData);
      }
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async () => {
    if (!createForm.courseOfferingId) {
      toast.error('Please select a course offering');
      return;
    }
    const pct = parseFloat(createForm.minPassPercent);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      toast.error('Pass percentage must be between 0 and 100');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/pass-fail-criteria', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseOfferingId: createForm.courseOfferingId,
          minPassPercent: pct,
        }),
      });
      const data = await res.json();
      if (res.status === 409) {
        toast.error('Criteria already exists for this offering — click Edit to update');
        return;
      }
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to create criteria');
        return;
      }
      toast.success('Pass/Fail criteria set successfully');
      setCreateOpen(false);
      setCreateForm({ courseOfferingId: '', minPassPercent: '50' });
      loadData();
    } catch {
      toast.error('Failed to create criteria');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    const pct = parseFloat(editForm.minPassPercent);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      toast.error('Pass percentage must be between 0 and 100');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/pass-fail-criteria/${editTarget.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minPassPercent: pct, status: editForm.status }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to update criteria');
        return;
      }
      toast.success('Criteria updated successfully');
      setEditOpen(false);
      setEditTarget(null);
      loadData();
    } catch {
      toast.error('Failed to update criteria');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (criterion: Criterion) => {
    setEditTarget(criterion);
    setEditForm({ minPassPercent: String(criterion.minPassPercent), status: criterion.status });
    setEditOpen(true);
  };

  // Filter out offerings that already have criteria set
  const existingOfferingIds = new Set(criteria.map((c) => c.courseOfferingId));
  const availableOfferings = courseOfferings.filter((o) => !existingOfferingIds.has(o.id));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: iconBgColor }}
          >
            <ShieldCheck className="h-6 w-6" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Pass/Fail Criteria</h1>
            <p className="text-xs text-secondary-text">
              Set minimum pass percentage thresholds per course offering
            </p>
          </div>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          style={{ backgroundColor: primaryColor }}
          className="text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Set Criteria
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="h-6 w-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: primaryColor, borderTopColor: 'transparent' }} />
          </div>
        ) : criteria.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-secondary-text gap-2">
            <ShieldCheck className="h-8 w-8 opacity-30" />
            <p className="text-sm">No pass/fail criteria set yet.</p>
            <p className="text-xs">Click &quot;Set Criteria&quot; to define thresholds for course offerings.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-secondary-text">Course</th>
                <th className="text-left px-4 py-3 font-medium text-secondary-text">Semester</th>
                <th className="text-left px-4 py-3 font-medium text-secondary-text">Min Pass %</th>
                <th className="text-left px-4 py-3 font-medium text-secondary-text">Status</th>
                <th className="text-left px-4 py-3 font-medium text-secondary-text">Set On</th>
                <th className="text-left px-4 py-3 font-medium text-secondary-text">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {criteria.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.courseofferings.course.code}</div>
                    <div className="text-xs text-secondary-text">{c.courseofferings.course.name}</div>
                  </td>
                  <td className="px-4 py-3 text-secondary-text">{c.courseofferings.semester.name}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-lg" style={{ color: primaryColor }}>
                      {c.minPassPercent}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={
                        c.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }
                    >
                      {c.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-secondary-text text-xs">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(c)}
                      className="h-7 px-2 text-xs"
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set Pass/Fail Criteria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Course Offering</Label>
              <Select
                value={createForm.courseOfferingId}
                onValueChange={(v) => setCreateForm((f) => ({ ...f, courseOfferingId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select course offering..." />
                </SelectTrigger>
                <SelectContent>
                  {availableOfferings.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.course.code} — {o.semester.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableOfferings.length === 0 && (
                <p className="text-xs text-secondary-text">All course offerings already have criteria set.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Minimum Pass Percentage (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={createForm.minPassPercent}
                onChange={(e) => setCreateForm((f) => ({ ...f, minPassPercent: e.target.value }))}
                placeholder="50"
              />
              <p className="text-xs text-secondary-text">
                Students scoring below this percentage will be considered as not attaining the CLO/PLO.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button
                onClick={handleCreate}
                disabled={saving}
                style={{ backgroundColor: primaryColor }}
                className="text-white hover:opacity-90"
              >
                {saving ? 'Saving...' : 'Set Criteria'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Pass/Fail Criteria</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <div className="space-y-4 pt-2">
              <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                <div className="font-medium">
                  {editTarget.courseofferings.course.code} — {editTarget.courseofferings.course.name}
                </div>
                <div className="text-secondary-text text-xs">
                  Semester: {editTarget.courseofferings.semester.name}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Minimum Pass Percentage (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={editForm.minPassPercent}
                  onChange={(e) => setEditForm((f) => ({ ...f, minPassPercent: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(v) => setEditForm((f) => ({ ...f, status: v as 'active' | 'inactive' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleEdit}
                  disabled={saving}
                  style={{ backgroundColor: primaryColor }}
                  className="text-white hover:opacity-90"
                >
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
