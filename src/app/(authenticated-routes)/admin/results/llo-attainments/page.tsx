'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Calculator, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';

interface CourseOffering {
  id: number;
  course: {
    id: number;
    code: string;
    name: string;
  };
  semester: {
    id: number;
    name: string;
  };
}

interface LLO {
  id: number;
  code: string;
  description: string;
  courseId: number;
}

interface LLOAttainment {
  id: number;
  lloId: number;
  courseOfferingId: number;
  totalStudents: number;
  studentsAchieved: number;
  threshold: number;
  attainmentPercent: number;
  calculatedAt: string;
  status: string;
  llo: LLO;
  courseOffering: CourseOffering;
}

export default function LLOAttainmentsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode
    ? 'rgba(252, 153, 40, 0.15)'
    : 'rgba(38, 40, 149, 0.15)';

  const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>([]);
  const [selectedCourseOffering, setSelectedCourseOffering] = useState<string>('');
  const [llos, setLLOs] = useState<LLO[]>([]);
  const [attainments, setAttainments] = useState<LLOAttainment[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isCalculateDialogOpen, setIsCalculateDialogOpen] = useState(false);
  const [threshold, setThreshold] = useState('60');

  useEffect(() => {
    setMounted(true);
    fetchCourseOfferings();
  }, []);

  useEffect(() => {
    if (selectedCourseOffering) {
      fetchLLOs();
      fetchAttainments();
    }
  }, [selectedCourseOffering]);

  const fetchCourseOfferings = async () => {
    try {
      const response = await fetch('/api/course-offerings?status=active', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch course offerings');
      const result = await response.json();
      if (result.success) {
        setCourseOfferings(result.data || []);
      }
    } catch (error) {
      toast.error('Failed to load course offerings');
    }
  };

  const fetchLLOs = async () => {
    if (!selectedCourseOffering) return;
    try {
      const offering = courseOfferings.find(
        (co) => co.id.toString() === selectedCourseOffering
      );
      if (!offering) return;
      const response = await fetch(`/api/llos?courseId=${offering.course.id}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch LLOs');
      const result = await response.json();
      if (result.success) {
        setLLOs(result.data || []);
      }
    } catch (error) {
      toast.error('Failed to load LLOs');
    }
  };

  const fetchAttainments = async () => {
    if (!selectedCourseOffering) return;
    try {
      const response = await fetch(
        `/api/admin/llo-attainments?courseOfferingId=${selectedCourseOffering}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Failed to fetch attainments');
      const result = await response.json();
      if (result.success) {
        setAttainments(result.data || []);
      }
    } catch (error) {
      toast.error('Failed to load attainments');
    }
  };

  const handleCalculate = async () => {
    if (!selectedCourseOffering) {
      toast.error('Please select a course offering');
      return;
    }
    try {
      setIsCalculating(true);
      const response = await fetch('/api/admin/llo-attainments/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          courseOfferingId: parseInt(selectedCourseOffering),
          threshold: parseFloat(threshold),
        }),
      });
      if (!response.ok) throw new Error('Failed to calculate attainments');
      const result = await response.json();
      if (result.success) {
        toast.success(result.message || 'LLO attainments calculated successfully');
        setIsCalculateDialogOpen(false);
        fetchAttainments();
      } else {
        throw new Error(result.error || 'Failed to calculate attainments');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to calculate attainments');
    } finally {
      setIsCalculating(false);
    }
  };

  const getStatusBadge = (attainment: LLOAttainment) => {
    const attained = attainment.attainmentPercent >= attainment.threshold;
    return (
      <Badge
        className={`text-[10px] px-1.5 py-0.5 ${attained ? 'bg-[var(--success-green)] text-white' : 'bg-[var(--error)] text-white'}`}
        variant="secondary"
      >
        {attained ? 'Attained' : 'Not Attained'}
      </Badge>
    );
  };

  const getTrendIcon = (attainment: LLOAttainment) => {
    return attainment.attainmentPercent >= attainment.threshold ? (
      <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--success-green)' }} />
    ) : (
      <TrendingDown className="w-3.5 h-3.5" style={{ color: 'var(--error)' }} />
    );
  };

  const selectedOffering = courseOfferings.find(
    (co) => co.id.toString() === selectedCourseOffering
  );

  const attainedCount = attainments.filter(
    (a) => a.attainmentPercent >= a.threshold
  ).length;
  const avgAttainment =
    attainments.length > 0
      ? (attainments.reduce((sum, a) => sum + a.attainmentPercent, 0) / attainments.length).toFixed(1)
      : '0';
  const attainmentRate =
    llos.length > 0
      ? ((attainedCount / llos.length) * 100).toFixed(1)
      : '0';

  if (!mounted) return null;

  return (
    <div className="space-y-4">
      {/* Header - CLO style */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: iconBgColor }}
          >
            <Calculator className="h-5 w-5" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary-text">LLO Attainments</h1>
            <p className="text-xs text-secondary-text mt-0.5">
              Calculate and analyze Lab Learning Outcome achievement percentages
            </p>
          </div>
        </div>
        {selectedCourseOffering && (
          <button
            onClick={() => setIsCalculateDialogOpen(true)}
            className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 flex items-center gap-1.5"
            style={{ backgroundColor: iconBgColor, color: primaryColor }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode
                ? 'rgba(252, 153, 40, 0.2)'
                : 'rgba(38, 40, 149, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = iconBgColor;
            }}
          >
            <Calculator className="w-3.5 h-3.5" />
            Calculate Attainments
          </button>
        )}
      </div>

      {/* Course Offering Filter */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Select
            value={selectedCourseOffering}
            onValueChange={setSelectedCourseOffering}
          >
            <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
              <SelectValue placeholder="Select a course offering" />
            </SelectTrigger>
            <SelectContent className="bg-card border-card-border">
              {courseOfferings.map((offering) => (
                <SelectItem
                  key={offering.id}
                  value={offering.id.toString()}
                  className="text-primary-text hover:bg-card/50"
                >
                  {offering.course.code} - {offering.course.name} (
                  {offering.semester.name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content — visible when a course offering is selected */}
      {selectedCourseOffering && (
        <>
          {llos.length === 0 ? (
            <div className="rounded-lg border border-card-border bg-card p-8">
              <div className="text-center text-xs text-secondary-text">
                No LLOs found for this course. Please create LLOs first.
              </div>
            </div>
          ) : attainments.length === 0 ? (
            <div className="rounded-lg border border-card-border bg-card p-8">
              <div className="flex flex-col items-center gap-3">
                <p className="text-xs text-secondary-text">
                  No LLO attainments calculated yet for this course offering.
                </p>
                <button
                  onClick={() => setIsCalculateDialogOpen(true)}
                  className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 flex items-center gap-1.5"
                  style={{ backgroundColor: iconBgColor, color: primaryColor }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDarkMode
                      ? 'rgba(252, 153, 40, 0.2)'
                      : 'rgba(38, 40, 149, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = iconBgColor;
                  }}
                >
                  <Calculator className="w-3.5 h-3.5" />
                  Calculate Attainments
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-lg border border-card-border bg-card p-4">
                  <p className="text-[10px] text-secondary-text mb-1">Total LLOs</p>
                  <p className="text-xl font-bold text-primary-text">{llos.length}</p>
                </div>
                <div className="rounded-lg border border-card-border bg-card p-4">
                  <p className="text-[10px] text-secondary-text mb-1">Attained LLOs</p>
                  <p className="text-xl font-bold" style={{ color: 'var(--success-green)' }}>
                    {attainedCount}
                  </p>
                </div>
                <div className="rounded-lg border border-card-border bg-card p-4">
                  <p className="text-[10px] text-secondary-text mb-1">Average Attainment</p>
                  <p className="text-xl font-bold text-primary-text">{avgAttainment}%</p>
                </div>
                <div className="rounded-lg border border-card-border bg-card p-4">
                  <p className="text-[10px] text-secondary-text mb-1">Attainment Rate</p>
                  <p className="text-xl font-bold text-primary-text">{attainmentRate}%</p>
                </div>
              </div>

              {/* Table */}
              <div className="rounded-lg border border-card-border bg-card overflow-hidden">
                <div className="px-4 py-3 border-b border-card-border">
                  <p className="text-xs font-semibold text-primary-text">LLO Attainment Details</p>
                  {selectedOffering && (
                    <p className="text-[10px] text-secondary-text mt-0.5">
                      {selectedOffering.course.code} - {selectedOffering.course.name} (
                      {selectedOffering.semester.name})
                    </p>
                  )}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-semibold text-primary-text">LLO Code</TableHead>
                      <TableHead className="text-xs font-semibold text-primary-text">Description</TableHead>
                      <TableHead className="text-xs font-semibold text-primary-text">Total Students</TableHead>
                      <TableHead className="text-xs font-semibold text-primary-text">Achieved</TableHead>
                      <TableHead className="text-xs font-semibold text-primary-text">Attainment %</TableHead>
                      <TableHead className="text-xs font-semibold text-primary-text">Threshold</TableHead>
                      <TableHead className="text-xs font-semibold text-primary-text">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-primary-text">Calculated At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attainments.map((attainment) => (
                      <TableRow key={attainment.id} className="hover:bg-hover-bg transition-colors">
                        <TableCell className="text-xs font-medium text-primary-text">
                          {attainment.llo.code}
                        </TableCell>
                        <TableCell className="text-xs text-secondary-text max-w-xs truncate">
                          {attainment.llo.description}
                        </TableCell>
                        <TableCell className="text-xs text-primary-text">
                          {attainment.totalStudents}
                        </TableCell>
                        <TableCell className="text-xs text-primary-text">
                          {attainment.studentsAchieved}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {getTrendIcon(attainment)}
                            <span className="text-xs font-medium text-primary-text">
                              {attainment.attainmentPercent.toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-secondary-text">
                          {attainment.threshold}%
                        </TableCell>
                        <TableCell>{getStatusBadge(attainment)}</TableCell>
                        <TableCell className="text-xs text-secondary-text">
                          {new Date(attainment.calculatedAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </>
      )}

      {/* Empty state when nothing selected */}
      {!selectedCourseOffering && (
        <div className="rounded-lg border border-card-border bg-card p-8">
          <div className="text-center text-xs text-secondary-text">
            Please select a course offering to view LLO attainments
          </div>
        </div>
      )}

      {/* Calculate Dialog */}
      <Dialog open={isCalculateDialogOpen} onOpenChange={setIsCalculateDialogOpen}>
        <DialogContent className="bg-card border-card-border p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">
              Calculate LLO Attainments
            </DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Calculate LLO attainments for the selected course offering
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] text-muted-text mb-1">Course Offering</p>
              <p className="text-xs text-primary-text">
                {selectedOffering?.course.code} - {selectedOffering?.course.name} (
                {selectedOffering?.semester.name})
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="threshold" className="text-xs text-primary-text">
                Threshold (%)
              </Label>
              <Input
                id="threshold"
                type="number"
                min="0"
                max="100"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder="60"
                className="h-8 text-xs bg-card border-card-border text-primary-text placeholder:text-secondary-text"
              />
              <p className="text-[10px] text-secondary-text">
                Minimum percentage required for LLO attainment (default: 60%)
              </p>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <button
              onClick={() => setIsCalculateDialogOpen(false)}
              disabled={isCalculating}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 border border-card-border bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                color: isDarkMode ? '#ffffff' : '#111827',
                borderColor: isDarkMode ? '#404040' : '#e5e7eb',
              }}
              onMouseEnter={(e) => {
                if (!isCalculating)
                  e.currentTarget.style.backgroundColor = isDarkMode
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.05)';
              }}
              onMouseLeave={(e) => {
                if (!isCalculating) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleCalculate}
              disabled={isCalculating}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: iconBgColor, color: primaryColor }}
              onMouseEnter={(e) => {
                if (!isCalculating)
                  e.currentTarget.style.backgroundColor = isDarkMode
                    ? 'rgba(252, 153, 40, 0.2)'
                    : 'rgba(38, 40, 149, 0.2)';
              }}
              onMouseLeave={(e) => {
                if (!isCalculating) e.currentTarget.style.backgroundColor = iconBgColor;
              }}
            >
              {isCalculating ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Calculating...
                </>
              ) : (
                'Calculate'
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
