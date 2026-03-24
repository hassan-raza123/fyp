'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  Calculator,
  Eye,
  Target,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  FlaskConical,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Course {
  course: {
    id: number;
    code: string;
    name: string;
    labHours: number;
  };
  totalLLOs: number;
  attainedLLOs: number;
  averageAttainment: number;
  llos: Array<{
    id: number;
    code: string;
    description: string;
    bloomLevel: string;
    attainmentPercent: number | null;
    threshold: number;
    status: 'attained' | 'not_attained' | 'not_calculated';
    calculatedAt: string | null;
  }>;
  courseOfferings: Array<{
    id: number;
    semester: { id: number; name: string };
    sections: Array<{ id: number; name: string }>;
  }>;
}

interface LLODetails {
  llo: {
    id: number;
    code: string;
    description: string;
    bloomLevel: string;
    course: { id: number; code: string; name: string };
  };
  attainments: Array<{
    id: number;
    courseOfferingId: number;
    semester: string;
    sections: Array<{ id: number; name: string }>;
    totalStudents: number;
    studentsAchieved: number;
    threshold: number;
    attainmentPercent: number;
    status: string;
    calculatedAt: string;
  }>;
  assessmentBreakdown: Array<{
    assessmentId: number;
    title: string;
    type: string;
    semester: string;
    totalMarks: number;
    itemCount: number;
    items: Array<{ id: number; questionNo: string; description: string; marks: number }>;
  }>;
  studentBreakdown: Array<{
    studentId: number;
    rollNumber: string;
    name: string;
    obtainedMarks: number;
    totalMarks: number;
    percentage: number;
    achieved: boolean;
    itemsCount: number;
  }>;
}

const LLOAttainmentsPage = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = mounted && resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [selectedLLO, setSelectedLLO] = useState<number | null>(null);
  const [lloDetails, setLloDetails] = useState<LLODetails | null>(null);
  const [showCalculateDialog, setShowCalculateDialog] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [selectedCourseOffering, setSelectedCourseOffering] = useState<number | null>(null);
  const [threshold, setThreshold] = useState(60);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { fetchCourses(); }, []);
  useEffect(() => {
    if (selectedLLO) fetchLLODetails(selectedLLO);
    else setLloDetails(null);
  }, [selectedLLO, selectedCourseOffering]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/faculty/llo-attainments', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      if (result.success) setCourses(result.data);
    } catch {
      toast.error('Failed to load LLO attainments');
    } finally {
      setLoading(false);
    }
  };

  const fetchLLODetails = async (lloId: number) => {
    setLoading(true);
    try {
      const url = selectedCourseOffering
        ? `/api/faculty/llo-attainments/${lloId}/details?courseOfferingId=${selectedCourseOffering}`
        : `/api/faculty/llo-attainments/${lloId}/details`;
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch LLO details');
      const result = await response.json();
      if (result.success) setLloDetails(result.data);
    } catch {
      toast.error('Failed to load LLO details');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    if (!selectedCourseOffering) {
      toast.error('Please select a course offering');
      return;
    }
    setCalculating(true);
    try {
      const response = await fetch('/api/faculty/llo-attainments/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ courseOfferingId: selectedCourseOffering, threshold }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to calculate');
      }
      const result = await response.json();
      toast.success(result.message || 'LLO attainments calculated successfully');
      setShowCalculateDialog(false);
      fetchCourses();
      if (selectedLLO) fetchLLODetails(selectedLLO);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to calculate LLO attainments');
    } finally {
      setCalculating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'attained')
      return (
        <Badge variant="default" className="bg-green-600">
          <CheckCircle className="w-3 h-3 mr-1" /> Attained
        </Badge>
      );
    if (status === 'not_attained')
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" /> Not Attained
        </Badge>
      );
    return (
      <Badge variant="outline">
        <AlertCircle className="w-3 h-3 mr-1" /> Not Calculated
      </Badge>
    );
  };

  const selectedCourseData = courses.find((c) => c.course.id === selectedCourse);
  const chartData = selectedCourseData
    ? selectedCourseData.llos.map((llo) => ({
        name: llo.code,
        attainment: llo.attainmentPercent || 0,
        threshold: llo.threshold,
      }))
    : [];

  if (!mounted) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: iconBgColor }}
          >
            <FlaskConical className="h-5 w-5" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary-text">LLO Attainments</h1>
            <p className="text-xs text-secondary-text mt-0.5">
              Calculate and analyze Lab Learning Outcomes attainment (lab exams &amp; lab reports)
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowCalculateDialog(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 inline-flex items-center gap-1.5 border border-card-border"
            style={{ backgroundColor: iconBgColor, color: primaryColor }}
          >
            <Calculator className="w-3.5 h-3.5" />
            Calculate Attainments
          </button>
          <button
            type="button"
            onClick={fetchCourses}
            className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 inline-flex items-center gap-1.5 border border-card-border"
            style={{ backgroundColor: iconBgColor, color: primaryColor }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="bg-card border border-card-border p-1 rounded-lg">
          <TabsTrigger value="dashboard" className="text-xs data-[state=active]:bg-[var(--hover-bg)] data-[state=active]:text-primary-text rounded-md">
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="details" disabled={!selectedLLO} className="text-xs data-[state=active]:bg-[var(--hover-bg)] data-[state=active]:text-primary-text rounded-md disabled:opacity-50">
            LLO Details
          </TabsTrigger>
          <TabsTrigger value="llo-plo" disabled={!selectedCourse} className="text-xs data-[state=active]:bg-[var(--hover-bg)] data-[state=active]:text-primary-text rounded-md disabled:opacity-50">
            LLO-PLO Mappings
          </TabsTrigger>
        </TabsList>

        {/* ── Dashboard Tab ── */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="rounded-lg border border-card-border bg-card overflow-hidden">
            <div className="p-4 border-b border-card-border">
              <h2 className="text-sm font-semibold text-primary-text">Select Course</h2>
              <p className="text-xs text-secondary-text mt-0.5">Only courses with a lab component are shown</p>
            </div>
            <div className="p-4">
              {courses.length === 0 && !loading ? (
                <p className="text-xs text-secondary-text">
                  No lab courses found. You need to be assigned to a course that has lab hours.
                </p>
              ) : (
                <Select
                  value={selectedCourse?.toString() || ''}
                  onValueChange={(value) => {
                    setSelectedCourse(value ? parseInt(value) : null);
                    setSelectedLLO(null);
                  }}
                >
                  <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
                    <SelectValue placeholder="Select a lab course" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-card-border">
                    {courses.map((c) => (
                      <SelectItem key={c.course.id} value={c.course.id.toString()} className="text-primary-text">
                        {c.course.code} - {c.course.name}{' '}
                        <span className="text-secondary-text">(Lab: {c.course.labHours}h)</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {selectedCourseData && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Total LLOs', value: selectedCourseData.totalLLOs, color: 'text-primary-text' },
                  { label: 'Attained LLOs', value: selectedCourseData.attainedLLOs, color: 'text-[var(--success-green)]' },
                  { label: 'Avg Attainment', value: `${selectedCourseData.averageAttainment.toFixed(1)}%`, color: 'text-primary-text' },
                  {
                    label: 'Attainment Rate',
                    value: selectedCourseData.totalLLOs > 0
                      ? `${((selectedCourseData.attainedLLOs / selectedCourseData.totalLLOs) * 100).toFixed(1)}%`
                      : '0%',
                    color: 'text-primary-text',
                  },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-lg border border-card-border bg-card p-4">
                    <p className="text-xs font-medium text-secondary-text mb-1">{label}</p>
                    <div className={`text-lg font-bold ${color}`}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div className="rounded-lg border border-card-border bg-card overflow-hidden">
                <div className="p-4 border-b border-card-border">
                  <h3 className="text-sm font-semibold text-primary-text">LLO Attainment Overview</h3>
                </div>
                <div className="p-4">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                        <Bar dataKey="attainment" name="Attainment %" fill="#8884d8" />
                        <Bar dataKey="threshold" name="Threshold %" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-secondary-text text-center py-8 text-xs">No LLO attainment data yet</p>
                  )}
                </div>
              </div>

              {/* LLOs Table */}
              <div className="rounded-lg border border-card-border bg-card overflow-hidden">
                <div className="p-4 border-b border-card-border">
                  <h3 className="text-sm font-semibold text-primary-text">Lab Learning Outcomes</h3>
                  <p className="text-xs text-secondary-text mt-0.5">Click a row to view detailed breakdown</p>
                </div>
                <div className="p-4 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">LLO Code</TableHead>
                        <TableHead className="text-xs">Description</TableHead>
                        <TableHead className="text-xs">Bloom's Level</TableHead>
                        <TableHead className="text-xs">Attainment %</TableHead>
                        <TableHead className="text-xs">Threshold</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Last Calculated</TableHead>
                        <TableHead className="text-xs">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedCourseData.llos.map((llo) => (
                        <TableRow
                          key={llo.id}
                          className="cursor-pointer hover:bg-[var(--hover-bg)]"
                          onClick={() => setSelectedLLO(llo.id)}
                        >
                          <TableCell className="font-medium text-xs">{llo.code}</TableCell>
                          <TableCell className="max-w-xs truncate text-xs">{llo.description}</TableCell>
                          <TableCell className="text-xs">{llo.bloomLevel ?? '—'}</TableCell>
                          <TableCell className="text-xs">
                            {llo.attainmentPercent !== null ? (
                              <div className="flex items-center gap-2">
                                <Progress value={llo.attainmentPercent} className="w-16" />
                                <span>{llo.attainmentPercent.toFixed(1)}%</span>
                              </div>
                            ) : (
                              <span className="text-secondary-text">N/A</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">{llo.threshold}%</TableCell>
                          <TableCell>{getStatusBadge(llo.status)}</TableCell>
                          <TableCell className="text-xs">
                            {llo.calculatedAt ? format(new Date(llo.calculatedAt), 'PPp') : 'Never'}
                          </TableCell>
                          <TableCell>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setSelectedLLO(llo.id); }}
                              className="p-2 rounded-lg h-7 inline-flex items-center justify-center hover:bg-[var(--hover-bg)]"
                              style={{ backgroundColor: iconBgColor, color: primaryColor }}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {!selectedCourse && (
            <div className="rounded-lg border border-card-border bg-card py-12 text-center text-xs text-secondary-text">
              Select a lab course to view LLO attainments
            </div>
          )}
        </TabsContent>

        {/* ── LLO Details Tab ── */}
        <TabsContent value="details" className="space-y-4">
          {lloDetails ? (
            <div className="space-y-4">
              {/* LLO Info */}
              <div className="rounded-lg border border-card-border bg-card overflow-hidden">
                <div className="p-4 border-b border-card-border">
                  <h3 className="text-sm font-semibold text-primary-text">{lloDetails.llo.code}</h3>
                  <p className="text-xs text-secondary-text mt-0.5">{lloDetails.llo.description}</p>
                </div>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-secondary-text">Course</p>
                    <p className="text-sm font-semibold text-primary-text">
                      {lloDetails.llo.course.code} - {lloDetails.llo.course.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-secondary-text">Bloom's Level</p>
                    <p className="text-sm font-semibold text-primary-text">{lloDetails.llo.bloomLevel ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-secondary-text">Latest Attainment</p>
                    <p className="text-sm font-semibold text-primary-text">
                      {lloDetails.attainments[0]?.attainmentPercent.toFixed(1) ?? 'N/A'}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-secondary-text">Status</p>
                    <div className="mt-1">
                      {getStatusBadge(lloDetails.attainments[0]?.status || 'not_calculated')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Attainment History */}
              <div className="rounded-lg border border-card-border bg-card overflow-hidden">
                <div className="p-4 border-b border-card-border">
                  <h3 className="text-sm font-semibold text-primary-text">Attainment History</h3>
                </div>
                <div className="p-4 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Semester</TableHead>
                        <TableHead className="text-xs">Section</TableHead>
                        <TableHead className="text-xs">Total Students</TableHead>
                        <TableHead className="text-xs">Students Achieved</TableHead>
                        <TableHead className="text-xs">Attainment %</TableHead>
                        <TableHead className="text-xs">Threshold</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Calculated At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lloDetails.attainments.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className="text-xs">{a.semester}</TableCell>
                          <TableCell className="text-xs">{a.sections.map((s) => s.name).join(', ')}</TableCell>
                          <TableCell className="text-xs">{a.totalStudents}</TableCell>
                          <TableCell className="text-xs">{a.studentsAchieved}</TableCell>
                          <TableCell className="text-xs">
                            <div className="flex items-center gap-2">
                              <Progress value={a.attainmentPercent} className="w-16" />
                              <span>{a.attainmentPercent.toFixed(1)}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">{a.threshold}%</TableCell>
                          <TableCell>{getStatusBadge(a.status)}</TableCell>
                          <TableCell className="text-xs">{format(new Date(a.calculatedAt), 'PPp')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Lab Assessment Breakdown */}
              <div className="rounded-lg border border-card-border bg-card overflow-hidden">
                <div className="p-4 border-b border-card-border">
                  <h3 className="text-sm font-semibold text-primary-text">Lab Assessment Breakdown</h3>
                  <p className="text-xs text-secondary-text mt-0.5">Only lab_exam and lab_report assessments contribute to LLO attainment</p>
                </div>
                <div className="p-4 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Assessment</TableHead>
                        <TableHead className="text-xs">Type</TableHead>
                        <TableHead className="text-xs">Semester</TableHead>
                        <TableHead className="text-xs">Items</TableHead>
                        <TableHead className="text-xs">Total Marks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lloDetails.assessmentBreakdown.map((a) => (
                        <TableRow key={a.assessmentId}>
                          <TableCell className="font-medium text-xs">{a.title}</TableCell>
                          <TableCell className="text-xs">
                            <Badge variant="outline" className="text-[10px]">
                              {a.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">{a.semester}</TableCell>
                          <TableCell className="text-xs">{a.itemCount}</TableCell>
                          <TableCell className="text-xs">{a.totalMarks}</TableCell>
                        </TableRow>
                      ))}
                      {lloDetails.assessmentBreakdown.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-xs text-secondary-text py-6">
                            No lab assessments mapped to this LLO yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Student Breakdown */}
              <div className="rounded-lg border border-card-border bg-card overflow-hidden">
                <div className="p-4 border-b border-card-border">
                  <h3 className="text-sm font-semibold text-primary-text">Student-wise Breakdown</h3>
                </div>
                <div className="p-4">
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Roll No</TableHead>
                          <TableHead className="text-xs">Name</TableHead>
                          <TableHead className="text-xs">Obtained</TableHead>
                          <TableHead className="text-xs">Total</TableHead>
                          <TableHead className="text-xs">Percentage</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lloDetails.studentBreakdown.map((s) => (
                          <TableRow key={s.studentId}>
                            <TableCell className="font-medium text-xs">{s.rollNumber}</TableCell>
                            <TableCell className="text-xs">{s.name}</TableCell>
                            <TableCell className="text-xs">{s.obtainedMarks.toFixed(1)}</TableCell>
                            <TableCell className="text-xs">{s.totalMarks}</TableCell>
                            <TableCell className="text-xs">
                              <div className="flex items-center gap-2">
                                <Progress value={s.percentage} className="w-16" />
                                <span>{s.percentage.toFixed(1)}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {s.achieved ? (
                                <Badge variant="default" className="bg-green-600 text-[10px]">Achieved</Badge>
                              ) : (
                                <Badge variant="destructive" className="text-[10px]">Not Achieved</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                        {lloDetails.studentBreakdown.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-xs text-secondary-text py-6">
                              No student results yet — calculate attainments first
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-card-border bg-card py-12 text-center text-xs text-secondary-text">
              Select an LLO from the dashboard to view details
            </div>
          )}
        </TabsContent>

        {/* ── LLO-PLO Mappings Tab ── */}
        <TabsContent value="llo-plo" className="space-y-4">
          {selectedCourse && <LLOPLOMappingsView courseId={selectedCourse} />}
        </TabsContent>
      </Tabs>

      {/* Calculate Dialog */}
      <Dialog open={showCalculateDialog} onOpenChange={setShowCalculateDialog}>
        <DialogContent className="bg-card border-card-border text-primary-text max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-primary-text">Calculate LLO Attainments</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text">
              Calculates attainment for each LLO using lab_exam and lab_report assessments only
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-secondary-text">Course Offering</Label>
              <Select
                value={selectedCourseOffering?.toString() || ''}
                onValueChange={(value) => setSelectedCourseOffering(parseInt(value))}
              >
                <SelectTrigger className="h-8 text-xs mt-1 bg-card border-card-border text-primary-text">
                  <SelectValue placeholder="Select course offering" />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  {courses.flatMap((c) =>
                    c.courseOfferings.map((co) => (
                      <SelectItem key={co.id} value={co.id.toString()} className="text-primary-text">
                        {c.course.code} — {co.semester.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="threshold" className="text-xs text-secondary-text">Threshold (%)</Label>
              <Input
                id="threshold"
                type="number"
                min={0}
                max={100}
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value) || 60)}
                className="h-8 text-xs mt-1 bg-card border-card-border text-primary-text"
              />
              <p className="text-xs text-secondary-text mt-1">
                Minimum percentage for a student to be counted as having attained the LLO (default: 60%)
              </p>
            </div>
          </div>
          <DialogFooter className="border-t border-card-border pt-4 gap-2">
            <button
              type="button"
              onClick={() => setShowCalculateDialog(false)}
              disabled={calculating}
              className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border bg-transparent text-primary-text hover:bg-[var(--hover-bg)] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCalculate}
              disabled={calculating || !selectedCourseOffering}
              className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 disabled:opacity-50"
              style={{ backgroundColor: primaryColor, color: '#fff' }}
            >
              {calculating ? 'Calculating...' : 'Calculate'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// LLO-PLO Mappings sub-component
function LLOPLOMappingsView({ courseId }: { courseId: number }) {
  const [mappings, setMappings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMappings = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/courses/${courseId}/llos/plo-mappings`, {
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch mappings');
        const result = await response.json();
        if (result.success) setMappings(result.data);
      } catch {
        console.error('Error fetching LLO-PLO mappings');
      } finally {
        setLoading(false);
      }
    };
    fetchMappings();
  }, [courseId]);

  if (loading)
    return (
      <div className="rounded-lg border border-card-border bg-card py-12 text-center text-xs text-secondary-text">
        Loading mappings...
      </div>
    );

  return (
    <div className="rounded-lg border border-card-border bg-card overflow-hidden">
      <div className="p-4 border-b border-card-border">
        <h3 className="text-sm font-semibold text-primary-text">LLO-PLO Mappings</h3>
        <p className="text-xs text-secondary-text mt-0.5">
          How Lab Learning Outcomes map to Program Learning Outcomes
        </p>
      </div>
      <div className="p-4">
        {mappings.length === 0 ? (
          <p className="text-xs text-secondary-text text-center py-8">No LLO-PLO mappings found</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">LLO Code</TableHead>
                  <TableHead className="text-xs">LLO Description</TableHead>
                  <TableHead className="text-xs">Mapped PLOs</TableHead>
                  <TableHead className="text-xs">Total Weight</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((mapping) => (
                  <TableRow key={mapping.llo.id} className="hover:bg-[var(--hover-bg)]">
                    <TableCell className="font-medium text-xs text-primary-text">{mapping.llo.code}</TableCell>
                    <TableCell className="max-w-xs truncate text-xs text-primary-text">{mapping.llo.description}</TableCell>
                    <TableCell className="text-xs text-primary-text">
                      <div className="flex flex-wrap gap-1">
                        {mapping.plos.map((plo: any) => (
                          <Badge key={plo.ploId} variant="outline" className="text-[10px] border-card-border">
                            {plo.ploCode} ({plo.weight}%)
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-primary-text">
                      {mapping.plos.reduce((sum: number, plo: any) => sum + plo.weight, 0)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

export default LLOAttainmentsPage;
