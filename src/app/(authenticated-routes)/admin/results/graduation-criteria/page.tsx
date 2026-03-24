'use client';

import { useEffect, useState, Suspense } from 'react';
import { useTheme } from 'next-themes';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Edit, GraduationCap, Info } from 'lucide-react';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface GraduationCriteria {
  id: number;
  programId: number;
  minCGPA: number;
  minPloAttainmentPercent: number;
  requireAllCourses: boolean;
  directWeight: number;
  indirectWeight: number;
}

interface ProgramWithCriteria {
  programId: number;
  programName: string;
  programCode: string;
  criteria: GraduationCriteria | null;
}

function GraduationCriteriaContent() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const primaryColorDark = isDarkMode ? 'var(--orange-dark)' : 'var(--blue-dark)';
  const iconBgColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';

  const [data, setData] = useState<ProgramWithCriteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<ProgramWithCriteria | null>(null);
  const [saving, setSaving] = useState(false);

  const defaultForm = {
    minCGPA: '2.0',
    minPloAttainmentPercent: '50',
    requireAllCourses: 'true',
    directWeight: '0.7',
    indirectWeight: '0.3',
  };
  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/graduation-criteria', { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        toast.error(json.error || 'Failed to fetch graduation criteria');
      }
    } catch {
      toast.error('Failed to fetch graduation criteria');
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (row: ProgramWithCriteria) => {
    setSelectedRow(row);
    if (row.criteria) {
      setFormData({
        minCGPA: row.criteria.minCGPA.toString(),
        minPloAttainmentPercent: row.criteria.minPloAttainmentPercent.toString(),
        requireAllCourses: row.criteria.requireAllCourses.toString(),
        directWeight: row.criteria.directWeight.toString(),
        indirectWeight: row.criteria.indirectWeight.toString(),
      });
    } else {
      setFormData(defaultForm);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedRow) return;

    const dw = parseFloat(formData.directWeight);
    const iw = parseFloat(formData.indirectWeight);
    if (Math.abs(dw + iw - 1.0) > 0.001) {
      toast.error('Direct Weight + Indirect Weight must equal 1.0');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        programId: selectedRow.programId,
        minCGPA: parseFloat(formData.minCGPA),
        minPloAttainmentPercent: parseFloat(formData.minPloAttainmentPercent),
        requireAllCourses: formData.requireAllCourses === 'true',
        directWeight: dw,
        indirectWeight: iw,
      };

      let res: Response;
      if (selectedRow.criteria) {
        res = await fetch(`/api/graduation-criteria/${selectedRow.criteria.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/graduation-criteria', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();
      if (json.success) {
        toast.success(selectedRow.criteria ? 'Criteria updated' : 'Criteria created');
        setIsDialogOpen(false);
        fetchData();
      } else {
        toast.error(json.error || 'Failed to save criteria');
      }
    } catch {
      toast.error('Failed to save criteria');
    } finally {
      setSaving(false);
    }
  };

  const handleWeightChange = (field: 'directWeight' | 'indirectWeight', value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) {
      setFormData((prev) => ({ ...prev, [field]: value }));
      return;
    }
    const complement = Math.round((1.0 - num) * 100) / 100;
    if (field === 'directWeight') {
      setFormData((prev) => ({
        ...prev,
        directWeight: value,
        indirectWeight: complement >= 0 ? complement.toString() : '0',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        indirectWeight: value,
        directWeight: complement >= 0 ? complement.toString() : '0',
      }));
    }
  };

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-page">
        <div className="flex flex-col items-center space-y-3">
          <div
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: primaryColor, borderTopColor: 'transparent' }}
          />
          <p className="text-xs text-secondary-text">Loading graduation criteria...</p>
        </div>
      </div>
    );
  }

  const configured = data.filter((r) => r.criteria !== null).length;
  const total = data.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-primary-text">Graduation Criteria</h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Configure minimum thresholds and PLO attainment weights per program
          </p>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ backgroundColor: iconBgColor, color: primaryColor }}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          {configured} / {total} Configured
        </div>
      </div>

      {/* Info Banner */}
      <div
        className="flex items-start gap-2 p-3 rounded-lg border text-xs"
        style={{
          backgroundColor: isDarkMode ? 'rgba(252, 153, 40, 0.08)' : 'rgba(38, 40, 149, 0.06)',
          borderColor: isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.15)',
          color: primaryColor,
        }}
      >
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span>
          These settings control PLO attainment calculation weights (HEC standard: 70% direct + 30% indirect)
          and graduation eligibility thresholds. Programs without criteria configured use system defaults.
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-card-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold text-primary-text">Program</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Min CGPA</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Min PLO Attainment</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Require All Courses</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Direct Weight</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Indirect Weight</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Status</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <p className="text-xs text-secondary-text">No programs found</p>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.programId} className="hover:bg-hover-bg transition-colors">
                  <TableCell className="text-xs text-primary-text">
                    <div className="font-medium">{row.programName}</div>
                    <div className="text-secondary-text">{row.programCode}</div>
                  </TableCell>
                  <TableCell className="text-xs text-primary-text">
                    {row.criteria ? row.criteria.minCGPA.toFixed(1) : <span className="text-muted-text">2.0 (default)</span>}
                  </TableCell>
                  <TableCell className="text-xs text-primary-text">
                    {row.criteria ? `${row.criteria.minPloAttainmentPercent}%` : <span className="text-muted-text">50% (default)</span>}
                  </TableCell>
                  <TableCell className="text-xs text-primary-text">
                    {row.criteria ? (
                      <Badge
                        className={`text-[10px] px-1.5 py-0.5 ${row.criteria.requireAllCourses ? 'bg-[var(--success-green)] text-white' : 'bg-[var(--gray-500)] text-white'}`}
                        variant="secondary"
                      >
                        {row.criteria.requireAllCourses ? 'Yes' : 'No'}
                      </Badge>
                    ) : (
                      <span className="text-muted-text">Yes (default)</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-primary-text">
                    {row.criteria ? `${(row.criteria.directWeight * 100).toFixed(0)}%` : <span className="text-muted-text">70% (default)</span>}
                  </TableCell>
                  <TableCell className="text-xs text-primary-text">
                    {row.criteria ? `${(row.criteria.indirectWeight * 100).toFixed(0)}%` : <span className="text-muted-text">30% (default)</span>}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`text-[10px] px-1.5 py-0.5 ${row.criteria ? 'bg-[var(--success-green)] text-white' : 'bg-amber-500 text-white'}`}
                      variant="secondary"
                    >
                      {row.criteria ? 'Configured' : 'Not Configured'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => openDialog(row)}
                      className="px-2 py-1 rounded-md transition-colors text-xs font-medium h-7 flex items-center gap-1"
                      style={{ backgroundColor: iconBgColor, color: primaryColor }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = iconBgColor;
                      }}
                    >
                      <Edit className="w-3 h-3" />
                      {row.criteria ? 'Edit' : 'Set Up'}
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit / Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-card-border max-w-lg p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">
              {selectedRow?.criteria ? 'Edit' : 'Configure'} Graduation Criteria
            </DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              {selectedRow?.programName} ({selectedRow?.programCode})
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs text-primary-text">Min CGPA</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="4"
                  value={formData.minCGPA}
                  onChange={(e) => setFormData((p) => ({ ...p, minCGPA: e.target.value }))}
                  className="bg-card border-card-border text-primary-text text-xs h-8"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs text-primary-text">Min PLO Attainment (%)</Label>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={formData.minPloAttainmentPercent}
                  onChange={(e) => setFormData((p) => ({ ...p, minPloAttainmentPercent: e.target.value }))}
                  className="bg-card border-card-border text-primary-text text-xs h-8"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-xs text-primary-text">Require All Courses Passed</Label>
              <Select
                value={formData.requireAllCourses}
                onValueChange={(v) => setFormData((p) => ({ ...p, requireAllCourses: v }))}
              >
                <SelectTrigger className="bg-card border-card-border text-primary-text text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  <SelectItem value="true" className="text-xs text-primary-text">Yes — student must pass all courses</SelectItem>
                  <SelectItem value="false" className="text-xs text-primary-text">No — allow some failed courses</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs text-primary-text">
                  Direct Assessment Weight
                  <span className="text-muted-text ml-1">(HEC: 0.7)</span>
                </Label>
                <Input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={formData.directWeight}
                  onChange={(e) => handleWeightChange('directWeight', e.target.value)}
                  className="bg-card border-card-border text-primary-text text-xs h-8"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs text-primary-text">
                  Indirect Assessment Weight
                  <span className="text-muted-text ml-1">(HEC: 0.3)</span>
                </Label>
                <Input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={formData.indirectWeight}
                  onChange={(e) => handleWeightChange('indirectWeight', e.target.value)}
                  className="bg-card border-card-border text-primary-text text-xs h-8"
                />
              </div>
            </div>
            {Math.abs(parseFloat(formData.directWeight || '0') + parseFloat(formData.indirectWeight || '0') - 1.0) > 0.001 && (
              <p className="text-xs text-red-500">Direct + Indirect weights must equal 1.0</p>
            )}
          </div>
          <DialogFooter className="mt-2">
            <button
              onClick={() => setIsDialogOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border bg-transparent"
              style={{ color: isDarkMode ? '#ffffff' : '#111827' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 disabled:opacity-50"
              style={{ backgroundColor: primaryColor, color: '#ffffff' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = primaryColorDark; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = primaryColor; }}
            >
              {saving ? 'Saving...' : selectedRow?.criteria ? 'Update' : 'Save Criteria'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function GraduationCriteriaPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GraduationCriteriaContent />
    </Suspense>
  );
}
