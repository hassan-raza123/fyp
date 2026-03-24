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
import { Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';
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
    course: {
      id: number;
      code: string;
      name: string;
    };
    semester: {
      id: number;
      name: string;
    };
  };
}

interface CLOAttainment {
  clo: {
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
    status: 'attained' | 'not_attained';
    calculatedAt: string;
  } | null;
  assessmentBreakdown: Array<{
    assessmentId: number;
    assessmentTitle: string;
    assessmentType: string;
    dueDate: string | null;
    totalMarks: number;
    obtainedMarks: number;
    percentage: number;
  }>;
}

interface CLOAttainmentsData {
  section: {
    id: number;
    name: string;
    course: {
      id: number;
      code: string;
      name: string;
    };
    semester: {
      id: number;
      name: string;
    };
  };
  cloAttainments: CLOAttainment[];
}

const CLOAttainmentsPage = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CLOAttainmentsData | null>(null);
  const [expandedCLO, setExpandedCLO] = useState<number | null>(null);

  const isDarkMode = mounted && resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const primaryColorDark = isDarkMode ? 'var(--orange-dark)' : 'var(--blue-dark)';
  const iconBgColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch sections on component mount
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await fetch('/api/student/sections', {
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch sections');
        const result = await response.json();
        if (result.success) {
          setSections(result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch sections');
        }
      } catch (err) {
        setError('Failed to load sections');
        console.error(err);
      }
    };
    fetchSections();
  }, []);

  // Fetch CLO attainments when section is selected
  useEffect(() => {
    if (!selectedSection) {
      setData(null);
      return;
    }

    const fetchCLOAttainments = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `/api/student/clo-attainments?sectionId=${selectedSection}`,
          {
            credentials: 'include',
          }
        );
        if (!response.ok) throw new Error('Failed to fetch CLO attainments');
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch CLO attainments');
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load CLO attainments'
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCLOAttainments();
  }, [selectedSection]);

  const selectedSectionData = sections.find(
    (section) => section.id === selectedSection
  );

  const getStatusBadge = (status: 'attained' | 'not_attained') => {
    return (
      <Badge className={status === 'attained' ? 'bg-[var(--success-green)] text-white text-[10px] px-1.5 py-0.5' : 'bg-[var(--error)] text-white text-[10px] px-1.5 py-0.5'}>
        {status === 'attained' ? 'Attained' : 'Not Attained'}
      </Badge>
    );
  };

  const getComparisonIcon = (
    studentPercent: number,
    classPercent: number | null
  ) => {
    if (!classPercent) return <Minus className="h-4 w-4 text-muted-text" />;
    if (studentPercent > classPercent)
      return <TrendingUp className="h-4 w-4 text-[var(--success-green)]" />;
    if (studentPercent < classPercent)
      return <TrendingDown className="h-4 w-4 text-[var(--error)]" />;
    return <Minus className="h-4 w-4 text-muted-text" />;
  };

  // Prepare chart data
  const chartData =
    data?.cloAttainments.map((attainment) => ({
      cloCode: attainment.clo.code,
      student: attainment.studentAttainment.percentage,
      class: attainment.classAttainment?.percentage || 0,
      threshold: attainment.classAttainment?.threshold || 60,
    })) || [];

  return (
    <div className="space-y-4">
      {/* Header - admin CLO style (title + subtitle only) */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-primary-text">My CLO Attainments</h1>
          <p className="text-xs text-secondary-text mt-0.5">View Course Learning Outcomes achievement by section</p>
        </div>
      </div>

      {/* Section Selection */}
      <div>
        <Label htmlFor="section-select" className="text-xs text-primary-text block mb-1.5">Select Section</Label>
        <Select
          value={selectedSection?.toString() || ''}
          onValueChange={(value) => setSelectedSection(parseInt(value))}
        >
          <SelectTrigger id="section-select" className="w-full max-w-md h-8 text-xs bg-card border-card-border text-primary-text">
            <SelectValue placeholder="Select a section" />
          </SelectTrigger>
          <SelectContent className="bg-card border-card-border">
            {sections.map((section) => (
              <SelectItem key={section.id} value={section.id.toString()} className="text-primary-text hover:bg-card/50">
                {section.courseOffering.course.code} - {section.name} ({section.courseOffering.semester.name})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-xs text-white bg-[var(--error)]">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderTopColor: primaryColor, borderRightColor: 'transparent', borderBottomColor: primaryColor, borderLeftColor: 'transparent' }}
          />
          <span className="text-xs text-secondary-text ml-2">Loading CLO attainments...</span>
        </div>
      ) : data && data.cloAttainments.length > 0 ? (
        <div className="space-y-4">
          {/* Section Info */}
          <div className="bg-card border border-card-border rounded-lg p-4">
            <p className="text-sm font-semibold text-primary-text">{data.section.course.code} - {data.section.course.name}</p>
            <p className="text-xs text-secondary-text mt-0.5">Section: {data.section.name} • Semester: {data.section.semester.name}</p>
          </div>

          {/* Overall Summary */}
          <div className="bg-card border border-card-border rounded-lg p-4">
            <h2 className="text-sm font-semibold text-primary-text mb-3">Overall CLO Attainment Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 rounded-lg bg-card border border-card-border">
                <p className="text-[10px] text-muted-text">Total CLOs</p>
                <p className="text-lg font-bold text-primary-text mt-0.5">{data.cloAttainments.length}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-card border border-card-border">
                <p className="text-[10px] text-muted-text">Attained CLOs</p>
                <p className="text-lg font-bold text-primary-text mt-0.5">
                  {data.cloAttainments.filter((a) => a.studentAttainment.status === 'attained').length}
                </p>
              </div>
              <div className="text-center p-3 rounded-lg bg-card border border-card-border">
                <p className="text-[10px] text-muted-text">Average Attainment</p>
                <p className="text-lg font-bold text-primary-text mt-0.5">
                  {(data.cloAttainments.reduce((sum, a) => sum + a.studentAttainment.percentage, 0) / data.cloAttainments.length).toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Chart */}
            <div className="h-[400px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="cloCode" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="student" name="Your Attainment" fill="#4f46e5" />
                  <Bar dataKey="class" name="Class Average" fill="#10b981" />
                  <Bar dataKey="threshold" name="Threshold" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CLO Details */}
          <div className="space-y-4">
            {data.cloAttainments.map((attainment) => (
              <div key={attainment.clo.id} className="bg-card border border-card-border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary-text" />
                      <span className="text-sm font-semibold text-primary-text">{attainment.clo.code}</span>
                    </div>
                    <p className="text-xs text-secondary-text mt-1">{attainment.clo.description}</p>
                    {attainment.clo.bloomLevel && (
                      <Badge className="mt-2 text-[10px] px-1.5 py-0.5 border border-card-border bg-transparent text-primary-text">
                        {attainment.clo.bloomLevel}
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
                        {attainment.studentAttainment.obtainedMarks.toFixed(1)} / {attainment.studentAttainment.totalMarks.toFixed(1)}
                    </p>
                  </div>
                  {attainment.classAttainment && (
                    <>
                      <div>
                        <p className="text-[10px] text-muted-text">Class Average</p>
                        <p className="text-sm font-semibold text-primary-text">{attainment.classAttainment.percentage.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-text">Comparison</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getComparisonIcon(attainment.studentAttainment.percentage, attainment.classAttainment.percentage)}
                          <span className="text-xs text-primary-text">
                            {attainment.studentAttainment.percentage > attainment.classAttainment.percentage
                              ? 'Above Average'
                              : attainment.studentAttainment.percentage < attainment.classAttainment.percentage
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
                      Threshold: {attainment.classAttainment.threshold}% • Last Calculated:{' '}
                      {new Date(attainment.classAttainment.calculatedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {/* Assessment Breakdown */}
                {attainment.assessmentBreakdown.length > 0 && (
                  <div>
                    <button
                      onClick={() => setExpandedCLO(expandedCLO === attainment.clo.id ? null : attainment.clo.id)}
                      className="text-xs text-primary-text hover:underline mb-2"
                    >
                        {expandedCLO === attainment.clo.id
                          ? 'Hide'
                          : 'Show'}{' '}
                        Assessment Breakdown ({attainment.assessmentBreakdown.length})
                      </button>

                      {expandedCLO === attainment.clo.id && (
                        <div className="mt-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-xs font-semibold text-primary-text">Assessment</TableHead>
                                <TableHead className="text-xs font-semibold text-primary-text">Type</TableHead>
                                <TableHead className="text-xs font-semibold text-primary-text">Marks</TableHead>
                                <TableHead className="text-xs font-semibold text-primary-text">Percentage</TableHead>
                                <TableHead className="text-xs font-semibold text-primary-text">Contribution</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {attainment.assessmentBreakdown.map((assessment) => (
                                <TableRow key={assessment.assessmentId} className="hover:bg-hover-bg transition-colors">
                                  <TableCell className="text-xs font-medium text-primary-text">
                                    {assessment.assessmentTitle}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="border border-card-border text-[10px] px-1.5 py-0.5 text-primary-text">
                                      {assessment.assessmentType.replace(/_/g, ' ')}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-xs text-primary-text">
                                    {assessment.obtainedMarks.toFixed(1)} /{' '}
                                    {assessment.totalMarks.toFixed(1)}
                                  </TableCell>
                                  <TableCell className="text-xs text-primary-text">
                                    {assessment.percentage.toFixed(1)}%
                                  </TableCell>
                                  <TableCell className="text-xs text-primary-text">
                                    {(
                                      (assessment.totalMarks /
                                        attainment.studentAttainment.totalMarks) *
                                      100
                                    ).toFixed(1)}%
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  )}
              </div>
            ))}
          </div>
        </div>
      ) : selectedSection ? (
        <div className="text-center text-xs text-secondary-text py-8">No CLO attainments data available for this section</div>
      ) : (
        <div className="text-center text-xs text-secondary-text py-8">Select a section to view CLO attainments</div>
      )}
    </div>
  );
};

export default CLOAttainmentsPage;
