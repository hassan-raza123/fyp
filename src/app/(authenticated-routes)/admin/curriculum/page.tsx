'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import {
  BookMarked,
  Plus,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  GraduationCap,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
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
  duration: number;
}

interface Course {
  id: number;
  code: string;
  name: string;
  creditHours: number;
  type: string;
  status: string;
}

interface CurriculumEntry {
  id: number;
  programId: number;
  courseId: number;
  semesterSlot: number;
  courseCategory: string;
  isRequired: boolean;
  course: Course;
}

const CATEGORY_COLORS: Record<string, string> = {
  core: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  elective: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  lab: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  project: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  thesis: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const CATEGORY_LABELS: Record<string, string> = {
  core: 'Core',
  elective: 'Elective',
  lab: 'Lab',
  project: 'Project',
  thesis: 'Thesis',
};

export default function CurriculumPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode ? 'rgba(252,153,40,0.15)' : 'rgba(38,40,149,0.15)';

  const [programs, setPrograms] = useState<Program[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [curriculum, setCurriculum] = useState<CurriculumEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedSlots, setExpandedSlots] = useState<Set<number>>(new Set([1]));

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CurriculumEntry | null>(null);
  const [saving, setSaving] = useState(false);

  const [addForm, setAddForm] = useState({
    courseId: '',
    semesterSlot: '1',
    courseCategory: 'core',
    isRequired: true,
  });
  const [editForm, setEditForm] = useState({
    semesterSlot: '1',
    courseCategory: 'core',
    isRequired: true,
  });

  useEffect(() => {
    setMounted(true);
    Promise.all([
      fetch('/api/programs', { credentials: 'include' }).then((r) => r.json()),
      fetch('/api/courses?limit=500', { credentials: 'include' }).then((r) => r.json()),
    ]).then(([pData, cData]) => {
      setPrograms(pData.data ?? pData ?? []);
      setAllCourses(cData.data ?? cData ?? []);
    }).catch(() => toast.error('Failed to load data'));
  }, []);

  const loadCurriculum = useCallback(async () => {
    if (!selectedProgram) { setCurriculum([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/program-curriculum?programId=${selectedProgram}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setCurriculum(data.data ?? []);
      }
    } catch {
      toast.error('Failed to load curriculum');
    } finally {
      setLoading(false);
    }
  }, [selectedProgram]);

  useEffect(() => { loadCurriculum(); }, [loadCurriculum]);

  const program = programs.find((p) => String(p.id) === selectedProgram);
  const totalSemesters = program ? program.duration * 2 : 8; // 2 sems/year

  // Group curriculum by semester slot
  const bySlot = new Map<number, CurriculumEntry[]>();
  for (let s = 1; s <= totalSemesters; s++) bySlot.set(s, []);
  for (const entry of curriculum) {
    const arr = bySlot.get(entry.semesterSlot) ?? [];
    arr.push(entry);
    bySlot.set(entry.semesterSlot, arr);
  }

  // Courses not yet in curriculum
  const usedCourseIds = new Set(curriculum.map((c) => c.courseId));
  const availableCourses = allCourses.filter(
    (c) => !usedCourseIds.has(c.id) && c.status === 'active'
  );

  const totalCreditHours = curriculum.reduce((sum, e) => sum + e.course.creditHours, 0);

  const toggleSlot = (slot: number) => {
    setExpandedSlots((prev) => {
      const next = new Set(prev);
      next.has(slot) ? next.delete(slot) : next.add(slot);
      return next;
    });
  };

  const handleAdd = async () => {
    if (!addForm.courseId || !selectedProgram) {
      toast.error('Select a course');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/program-curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          programId: parseInt(selectedProgram),
          courseId: parseInt(addForm.courseId),
          semesterSlot: parseInt(addForm.semesterSlot),
          courseCategory: addForm.courseCategory,
          isRequired: addForm.isRequired,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Failed to add course'); return; }
      toast.success('Course added to curriculum');
      setAddOpen(false);
      await loadCurriculum();
    } catch {
      toast.error('Failed to add course');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (entry: CurriculumEntry) => {
    setEditTarget(entry);
    setEditForm({
      semesterSlot: String(entry.semesterSlot),
      courseCategory: entry.courseCategory,
      isRequired: entry.isRequired,
    });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/program-curriculum/${editTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          semesterSlot: parseInt(editForm.semesterSlot),
          courseCategory: editForm.courseCategory,
          isRequired: editForm.isRequired,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Failed to update'); return; }
      toast.success('Updated');
      setEditOpen(false);
      await loadCurriculum();
    } catch {
      toast.error('Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (entry: CurriculumEntry) => {
    if (!confirm(`Remove ${entry.course.code} from curriculum?`)) return;
    try {
      const res = await fetch(`/api/program-curriculum/${entry.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) { toast.error('Failed to remove'); return; }
      toast.success('Removed from curriculum');
      await loadCurriculum();
    } catch {
      toast.error('Failed to remove');
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: iconBgColor }}
          >
            <BookMarked className="h-5 w-5" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary-text">Program Curriculum</h1>
            <p className="text-xs text-secondary-text mt-0.5">
              Define which courses belong to each program and their semester slots
            </p>
          </div>
        </div>
        {selectedProgram && (
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5"
            style={{ backgroundColor: iconBgColor, color: primaryColor }}
            variant="ghost"
            onClick={() => {
              setAddForm({ courseId: '', semesterSlot: '1', courseCategory: 'core', isRequired: true });
              setAddOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" /> Add Course
          </Button>
        )}
      </div>

      {/* Program selector */}
      <div className="flex items-end gap-4">
        <div className="w-72">
          <Label className="text-xs text-secondary-text mb-1 block">Select Program</Label>
          <Select value={selectedProgram} onValueChange={setSelectedProgram}>
            <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
              <SelectValue placeholder="Choose a program..." />
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
        {program && (
          <div className="flex items-center gap-4 text-xs text-secondary-text">
            <span>Duration: <strong className="text-primary-text">{program.duration} years</strong></span>
            <span>Total Semesters: <strong className="text-primary-text">{totalSemesters}</strong></span>
            <span>Total Credit Hours: <strong className="text-primary-text">{totalCreditHours}</strong></span>
            <span>Courses: <strong className="text-primary-text">{curriculum.length}</strong></span>
          </div>
        )}
      </div>

      {/* Curriculum by semester */}
      {!selectedProgram ? (
        <div className="flex flex-col items-center justify-center py-16 text-secondary-text gap-3">
          <GraduationCap className="h-12 w-12 opacity-20" />
          <p className="text-sm">Select a program to view and manage its curriculum</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-10">
          <div
            className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: primaryColor, borderTopColor: 'transparent' }}
          />
        </div>
      ) : (
        <div className="space-y-2">
          {Array.from({ length: totalSemesters }, (_, i) => i + 1).map((slot) => {
            const entries = bySlot.get(slot) ?? [];
            const expanded = expandedSlots.has(slot);
            const slotCreditHours = entries.reduce((s, e) => s + e.course.creditHours, 0);

            return (
              <div
                key={slot}
                className="rounded-lg border border-card-border overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                  onClick={() => toggleSlot(slot)}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded"
                      style={{ backgroundColor: iconBgColor, color: primaryColor }}
                    >
                      Sem {slot}
                    </span>
                    <span className="text-xs font-semibold text-primary-text">
                      Semester {slot}
                      {slot <= 2 ? ' — Year 1' : slot <= 4 ? ' — Year 2' : slot <= 6 ? ' — Year 3' : ' — Year 4'}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] h-4 px-1.5 text-secondary-text border-card-border"
                    >
                      {entries.length} courses · {slotCreditHours} cr hrs
                    </Badge>
                  </div>
                  {expanded ? (
                    <ChevronUp className="h-4 w-4 text-secondary-text" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-secondary-text" />
                  )}
                </button>

                {expanded && (
                  <div className="bg-card">
                    {entries.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 gap-2 text-secondary-text">
                        <p className="text-xs">No courses assigned to this semester yet.</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          style={{ color: primaryColor }}
                          onClick={() => {
                            setAddForm({
                              courseId: '',
                              semesterSlot: String(slot),
                              courseCategory: 'core',
                              isRequired: true,
                            });
                            setAddOpen(true);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add Course to Semester {slot}
                        </Button>
                      </div>
                    ) : (
                      <table className="w-full text-xs">
                        <thead className="bg-muted/20 border-b border-card-border">
                          <tr>
                            <th className="text-left px-4 py-2 font-medium text-secondary-text">Course</th>
                            <th className="text-left px-4 py-2 font-medium text-secondary-text">Type</th>
                            <th className="text-left px-4 py-2 font-medium text-secondary-text">Category</th>
                            <th className="text-left px-4 py-2 font-medium text-secondary-text">Cr Hrs</th>
                            <th className="text-left px-4 py-2 font-medium text-secondary-text">Required</th>
                            <th className="text-left px-4 py-2 font-medium text-secondary-text">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {entries.map((entry) => (
                            <tr key={entry.id} className="hover:bg-muted/10 transition-colors">
                              <td className="px-4 py-2.5">
                                <div className="font-semibold text-primary-text">{entry.course.code}</div>
                                <div className="text-secondary-text text-[10px] mt-0.5">{entry.course.name}</div>
                              </td>
                              <td className="px-4 py-2.5 text-secondary-text capitalize">
                                {entry.course.type.toLowerCase()}
                              </td>
                              <td className="px-4 py-2.5">
                                <Badge
                                  className={`text-[10px] h-4 px-1.5 border ${CATEGORY_COLORS[entry.courseCategory] ?? ''}`}
                                >
                                  {CATEGORY_LABELS[entry.courseCategory] ?? entry.courseCategory}
                                </Badge>
                              </td>
                              <td className="px-4 py-2.5 text-primary-text font-medium">
                                {entry.course.creditHours}
                              </td>
                              <td className="px-4 py-2.5">
                                {entry.isRequired ? (
                                  <Badge className="text-[10px] h-4 px-1.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                    Required
                                  </Badge>
                                ) : (
                                  <Badge className="text-[10px] h-4 px-1.5 bg-gray-500/10 text-gray-500 border-gray-500/20">
                                    Optional
                                  </Badge>
                                )}
                              </td>
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-secondary-text hover:text-primary-text"
                                    onClick={() => openEdit(entry)}
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
                                    onClick={() => handleRemove(entry)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ADD DIALOG */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md bg-card border-card-border text-primary-text p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-primary-text">Add Course to Curriculum</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid gap-1.5">
              <Label className="text-xs text-secondary-text">Course *</Label>
              <Select value={addForm.courseId} onValueChange={(v) => setAddForm((f) => ({ ...f, courseId: v }))}>
                <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
                  <SelectValue placeholder="Select course..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border max-h-60">
                  {availableCourses.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)} className="text-xs text-primary-text">
                      {c.code} — {c.name} ({c.creditHours} cr)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs text-secondary-text">Semester Slot *</Label>
                <Select value={addForm.semesterSlot} onValueChange={(v) => setAddForm((f) => ({ ...f, semesterSlot: v }))}>
                  <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-card-border">
                    {Array.from({ length: totalSemesters }, (_, i) => i + 1).map((s) => (
                      <SelectItem key={s} value={String(s)} className="text-xs text-primary-text">
                        Semester {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-secondary-text">Category</Label>
                <Select value={addForm.courseCategory} onValueChange={(v) => setAddForm((f) => ({ ...f, courseCategory: v }))}>
                  <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-card-border">
                    {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val} className="text-xs text-primary-text">{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs text-secondary-text">Requirement</Label>
              <Select value={String(addForm.isRequired)} onValueChange={(v) => setAddForm((f) => ({ ...f, isRequired: v === 'true' }))}>
                <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  <SelectItem value="true" className="text-xs text-primary-text">Required</SelectItem>
                  <SelectItem value="false" className="text-xs text-primary-text">Optional / Elective</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => setAddOpen(false)} className="h-8 text-xs border-card-border text-primary-text">
                Cancel
              </Button>
              <Button size="sm" onClick={handleAdd} disabled={saving} className="h-8 text-xs text-white" style={{ backgroundColor: primaryColor }}>
                {saving ? 'Adding...' : 'Add to Curriculum'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md bg-card border-card-border text-primary-text p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-primary-text">
              Edit — {editTarget?.course.code}
            </DialogTitle>
          </DialogHeader>
          {editTarget && (
            <div className="space-y-4 mt-2">
              <div className="rounded-lg bg-muted/30 p-3 text-xs text-secondary-text">
                <p className="font-medium text-primary-text">{editTarget.course.name}</p>
                <p className="mt-0.5">{editTarget.course.creditHours} credit hours · {editTarget.course.type.toLowerCase()}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="text-xs text-secondary-text">Semester Slot</Label>
                  <Select value={editForm.semesterSlot} onValueChange={(v) => setEditForm((f) => ({ ...f, semesterSlot: v }))}>
                    <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-card-border">
                      {Array.from({ length: totalSemesters }, (_, i) => i + 1).map((s) => (
                        <SelectItem key={s} value={String(s)} className="text-xs text-primary-text">Semester {s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs text-secondary-text">Category</Label>
                  <Select value={editForm.courseCategory} onValueChange={(v) => setEditForm((f) => ({ ...f, courseCategory: v }))}>
                    <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-card-border">
                      {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                        <SelectItem key={val} value={val} className="text-xs text-primary-text">{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-secondary-text">Requirement</Label>
                <Select value={String(editForm.isRequired)} onValueChange={(v) => setEditForm((f) => ({ ...f, isRequired: v === 'true' }))}>
                  <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-card-border">
                    <SelectItem value="true" className="text-xs text-primary-text">Required</SelectItem>
                    <SelectItem value="false" className="text-xs text-primary-text">Optional / Elective</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => setEditOpen(false)} className="h-8 text-xs border-card-border text-primary-text">Cancel</Button>
                <Button size="sm" onClick={handleEdit} disabled={saving} className="h-8 text-xs text-white" style={{ backgroundColor: primaryColor }}>
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
