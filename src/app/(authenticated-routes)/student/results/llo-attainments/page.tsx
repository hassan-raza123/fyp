'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { FlaskConical, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Section {
  id: number;
  name: string;
  courseOffering: {
    course: { id: number; code: string; name: string; labHours: number };
    semester: { id: number; name: string };
  };
}

interface LLOAttainment {
  llo: {
    id: number;
    code: string;
    description: string;
    bloomLevel: string | null;
  };
  studentAttainment: {
    percentage: number;
    obtainedMarks: number;
    totalMarks: number;
    status: 'attained' | 'not_attained';
  };
  classAttainment: {
    percentage: number;
    threshold: number;
    studentsAchieved: number;
    totalStudents: number;
    calculatedAt: string;
  } | null;
  assessmentBreakdown: Array<{
    assessmentId: number;
    assessmentTitle: string;
    assessmentType: string;
    totalMarks: number;
    obtainedMarks: number;
    percentage: number;
  }>;
}

interface LLOAttainmentsData {
  section: {
    id: number;
    name: string;
    course: { id: number; code: string; name: string; labHours: number };
    semester: { id: number; name: string };
  };
  lloAttainments: LLOAttainment[];
  hasLabComponent: boolean;
}

const StudentLLOAttainmentsPage = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LLOAttainmentsData | null>(null);
  const [expandedLLO, setExpandedLLO] = useState<number | null>(null);

  const isDarkMode = mounted && resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';

  useEffect(() => { setMounted(true); }, []);

  // Fetch all enrolled sections
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await fetch('/api/student/sections', { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to fetch sections');
        const result = await response.json();
        if (result.success) {
          // Only show sections where the course has lab hours
          const labSections = result.data.filter(
            (s: Section) => s.courseOffering.course.labHours > 0
          );
          setSections(labSections);
        }
      } catch (err) {
        setError('Failed to load sections');
        console.error(err);
      }
    };
    fetchSections();
  }, []);

  // Fetch LLO attainments when a section is selected
  useEffect(() => {
    if (!selectedSection) {
      setData(null);
      return;
    }
    const fetchLLOAttainments = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `/api/student/llo-attainments?sectionId=${selectedSection}`,
          { credentials: 'include' }
        );
        if (!response.ok) throw new Error('Failed to fetch LLO attainments');
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch LLO attainments');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load LLO attainments');
        toast.error('Failed to load LLO attainments');
      } finally {
        setLoading(false);
      }
    };
    fetchLLOAttainments();
  }, [selectedSection]);

  const getStatusBadge = (status: 'attained' | 'not_attained') => (
    <Badge
      className={
        status === 'attained'
          ? 'bg-[var(--success-green)] text-white text-[10px] px-1.5 py-0.5'
          : 'bg-[var(--error)] text-white text-[10px] px-1.5 py-0.5'
      }
    >
      {status === 'attained' ? 'Attained' : 'Not Attained'}
    </Badge>
  );

  const getComparisonIcon = (studentPercent: number, classPercent: number | null) => {
    if (classPercent === null) return <Minus className="h-4 w-4 text-muted-text" />;
    if (studentPercent > classPercent)
      return <TrendingUp className="h-4 w-4 text-[var(--success-green)]" />;
    if (studentPercent < classPercent)
      return <TrendingDown className="h-4 w-4 text-[var(--error)]" />;
    return <Minus className="h-4 w-4 text-muted-text" />;
  };

  const chartData =
    data?.lloAttainments.map((a) => ({
      lloCode: a.llo.code,
      student: parseFloat(a.studentAttainment.percentage.toFixed(1)),
      class: parseFloat((a.classAttainment?.percentage ?? 0).toFixed(1)),
      threshold: a.classAttainment?.threshold ?? 60,
    })) ?? [];

  if (!mounted) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: iconBgColor }}
        >
          <FlaskConical className="h-5 w-5" style={{ color: primaryColor }} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-primary-text">My LLO Attainments</h1>
          <p className="text-xs text-secondary-text mt-0.5">
            View Lab Learning Outcomes achievement for your lab-component courses
          </p>
        </div>
      </div>

      {/* Section Selection — only lab courses */}
      <div>
        <Label htmlFor="section-select" className="text-xs text-primary-text block mb-1.5">
          Select Section (lab courses only)
        </Label>
        {sections.length === 0 ? (
          <p className="text-xs text-secondary-text">
            No lab-component sections found. You need to be enrolled in a course that has lab hours.
          </p>
        ) : (
          <Select
            value={selectedSection?.toString() || ''}
            onValueChange={(v) => setSelectedSection(parseInt(v))}
          >
            <SelectTrigger
              id="section-select"
              className="w-full max-w-md h-8 text-xs bg-card border-card-border text-primary-text"
            >
              <SelectValue placeholder="Select a section" />
            </SelectTrigger>
            <SelectContent className="bg-card border-card-border">
              {sections.map((section) => (
                <SelectItem
                  key={section.id}
                  value={section.id.toString()}
                  className="text-primary-text hover:bg-card/50"
                >
                  {section.courseOffering.course.code} - {section.name} (
                  {section.courseOffering.semester.name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg text-xs text-white bg-[var(--error)]">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: primaryColor, borderTopColor: 'transparent' }}
          />
          <span className="text-xs text-secondary-text ml-2">Loading LLO attainments...</span>
        </div>
      ) : data && !data.hasLabComponent ? (
        <div className="rounded-lg border border-card-border bg-card p-8 text-center text-xs text-secondary-text">
          This course has no lab component. Switch to a course with lab hours.
        </div>
      ) : data && data.lloAttainments.length > 0 ? (
        <div className="space-y-4">
          {/* Section Info */}
          <div className="bg-card border border-card-border rounded-lg p-4">
            <p className="text-sm font-semibold text-primary-text">
              {data.section.course.code} - {data.section.course.name}
            </p>
            <p className="text-xs text-secondary-text mt-0.5">
              Section: {data.section.name} • Semester: {data.section.semester.name} •
              Lab Hours: {data.section.course.labHours}h/week
            </p>
          </div>

          {/* Summary Stats */}
          <div className="bg-card border border-card-border rounded-lg p-4">
            <h2 className="text-sm font-semibold text-primary-text mb-3">
              Overall LLO Attainment Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 rounded-lg bg-card border border-card-border">
                <p className="text-[10px] text-muted-text">Total LLOs</p>
                <p className="text-lg font-bold text-primary-text mt-0.5">
                  {data.lloAttainments.length}
                </p>
              </div>
              <div className="text-center p-3 rounded-lg bg-card border border-card-border">
                <p className="text-[10px] text-muted-text">Attained LLOs</p>
                <p className="text-lg font-bold mt-0.5" style={{ color: 'var(--success-green)' }}>
                  {data.lloAttainments.filter((a) => a.studentAttainment.status === 'attained').length}
                </p>
              </div>
              <div className="text-center p-3 rounded-lg bg-card border border-card-border">
                <p className="text-[10px] text-muted-text">Average Attainment</p>
                <p className="text-lg font-bold text-primary-text mt-0.5">
                  {data.lloAttainments.length > 0
                    ? (
                        data.lloAttainments.reduce(
                          (sum, a) => sum + a.studentAttainment.percentage,
                          0
                        ) / data.lloAttainments.length
                      ).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
            </div>

            {/* Chart */}
            {chartData.length > 0 && (
              <div className="h-[360px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="lloCode" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                    <Legend />
                    <Bar dataKey="student" name="Your Attainment" fill="#8b5cf6" />
                    <Bar dataKey="class" name="Class Average" fill="#10b981" />
                    <Bar dataKey="threshold" name="Threshold" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Per-LLO detail cards */}
          <div className="space-y-4">
            {data.lloAttainments.map((attainment) => (
              <div
                key={attainment.llo.id}
                className="bg-card border border-card-border rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <FlaskConical className="h-4 w-4 text-primary-text" />
                      <span className="text-sm font-semibold text-primary-text">
                        {attainment.llo.code}
                      </span>
                    </div>
                    <p className="text-xs text-secondary-text mt-1">{attainment.llo.description}</p>
                    {attainment.llo.bloomLevel && (
                      <Badge className="mt-2 text-[10px] px-1.5 py-0.5 border border-card-border bg-transparent text-primary-text">
                        {attainment.llo.bloomLevel}
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary-text">
                      {attainment.studentAttainment.percentage.toFixed(1)}%
                    </div>
                    <div className="mt-1">{getStatusBadge(attainment.studentAttainment.status)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-[10px] text-muted-text">Your Marks</p>
                    <p className="text-sm font-semibold text-primary-text">
                      {attainment.studentAttainment.obtainedMarks.toFixed(1)} /{' '}
                      {attainment.studentAttainment.totalMarks.toFixed(1)}
                    </p>
                  </div>
                  {attainment.classAttainment && (
                    <>
                      <div>
                        <p className="text-[10px] text-muted-text">Class Average</p>
                        <p className="text-sm font-semibold text-primary-text">
                          {attainment.classAttainment.percentage.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-text">Comparison</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getComparisonIcon(
                            attainment.studentAttainment.percentage,
                            attainment.classAttainment.percentage
                          )}
                          <span className="text-xs text-primary-text">
                            {attainment.studentAttainment.percentage >
                            attainment.classAttainment.percentage
                              ? 'Above Average'
                              : attainment.studentAttainment.percentage <
                                attainment.classAttainment.percentage
                              ? 'Below Average'
                              : 'At Average'}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {attainment.classAttainment && (
                  <div className="mb-4 p-3 rounded-lg bg-card border border-card-border">
                    <p className="text-xs text-secondary-text">
                      Threshold: {attainment.classAttainment.threshold}% •{' '}
                      {attainment.classAttainment.studentsAchieved} of{' '}
                      {attainment.classAttainment.totalStudents} students attained • Last
                      Calculated:{' '}
                      {new Date(attainment.classAttainment.calculatedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {/* Lab Assessment Breakdown (expandable) */}
                {attainment.assessmentBreakdown.length > 0 && (
                  <div>
                    <button
                      onClick={() =>
                        setExpandedLLO(expandedLLO === attainment.llo.id ? null : attainment.llo.id)
                      }
                      className="text-xs hover:underline mb-2"
                      style={{ color: primaryColor }}
                    >
                      {expandedLLO === attainment.llo.id ? 'Hide' : 'Show'} Lab Assessment
                      Breakdown ({attainment.assessmentBreakdown.length})
                    </button>

                    {expandedLLO === attainment.llo.id && (
                      <div className="mt-2">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs font-semibold text-primary-text">
                                Assessment
                              </TableHead>
                              <TableHead className="text-xs font-semibold text-primary-text">
                                Type
                              </TableHead>
                              <TableHead className="text-xs font-semibold text-primary-text">
                                Marks
                              </TableHead>
                              <TableHead className="text-xs font-semibold text-primary-text">
                                Percentage
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {attainment.assessmentBreakdown.map((a) => (
                              <TableRow
                                key={a.assessmentId}
                                className="hover:bg-hover-bg transition-colors"
                              >
                                <TableCell className="text-xs font-medium text-primary-text">
                                  {a.assessmentTitle}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className="border border-card-border text-[10px] px-1.5 py-0.5 text-primary-text"
                                  >
                                    {a.assessmentType.replace(/_/g, ' ')}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-primary-text">
                                  {a.obtainedMarks.toFixed(1)} / {a.totalMarks.toFixed(1)}
                                </TableCell>
                                <TableCell className="text-xs text-primary-text">
                                  {a.percentage.toFixed(1)}%
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                )}

                {attainment.assessmentBreakdown.length === 0 && (
                  <p className="text-xs text-secondary-text mt-2">
                    No lab assessment results available yet for this LLO.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : data && data.lloAttainments.length === 0 ? (
        <div className="rounded-lg border border-card-border bg-card p-8 text-center text-xs text-secondary-text">
          No LLOs defined for this course yet. Ask your admin to create Lab Learning Outcomes.
        </div>
      ) : selectedSection ? (
        <div className="rounded-lg border border-card-border bg-card p-8 text-center text-xs text-secondary-text">
          Loading...
        </div>
      ) : (
        <div className="rounded-lg border border-card-border bg-card p-8 text-center text-xs text-secondary-text">
          Select a section above to view your LLO attainments
        </div>
      )}
    </div>
  );
};

export default StudentLLOAttainmentsPage;
