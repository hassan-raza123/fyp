'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BarChart3, Target, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface AnalyticsData {
  course: {
    id: number;
    code: string;
    name: string;
  };
  semester: string;
  overallPerformance: {
    averagePercentage: number;
    totalAssessments: number;
    completedAssessments: number;
    currentGrade: string | null;
    currentPercentage: number | null;
    gpaPoints: number | null;
  };
  assessmentPerformance: Array<{
    id: number;
    title: string;
    type: string;
    totalMarks: number;
    dueDate: string | null;
    obtainedMarks: number;
    percentage: number;
    status: string;
  }>;
  cloPerformance: Array<{
    cloId: number;
    cloCode: string;
    cloDescription: string;
    attainmentPercent: number;
    threshold: number;
    status: string;
  }>;
}

export default function CourseAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const courseId = params?.id;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);

  const isDarkMode = mounted && resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const primaryColorDark = isDarkMode ? 'var(--orange-dark)' : 'var(--blue-dark)';
  const iconBgColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!courseId) return;
    fetchAnalytics();
  }, [courseId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/student/courses/${courseId}/analytics`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to fetch analytics'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-page">
        <div className="flex flex-col items-center space-y-3">
          <div
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
            style={{
              borderTopColor: primaryColor,
              borderBottomColor: primaryColor,
              borderRightColor: 'transparent',
              borderLeftColor: 'transparent',
            }}
          />
          <p className="text-xs text-secondary-text">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-primary-text">Course Analytics</h1>
            <p className="text-xs text-secondary-text mt-0.5">No analytics data available</p>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/student/courses/${courseId}`)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 flex items-center gap-1.5"
            style={{ backgroundColor: iconBgColor, color: primaryColor }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = iconBgColor;
            }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Course
          </button>
        </div>
        <div className="rounded-lg border border-card-border bg-card p-4">
          <p className="text-xs text-secondary-text">No analytics data available for this course.</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
      case 'evaluated':
        return <Badge className="bg-[var(--success-green)] text-white text-[10px] px-1.5 py-0.5">Completed</Badge>;
      case 'submitted':
        return <Badge className="bg-[var(--blue)] text-white text-[10px] px-1.5 py-0.5 dark:bg-[var(--orange)]">Submitted</Badge>;
      case 'not_submitted':
        return <Badge className="bg-[var(--gray-500)] text-white text-[10px] px-1.5 py-0.5">Not Submitted</Badge>;
      default:
        return <Badge className="text-[10px] px-1.5 py-0.5">{status}</Badge>;
    }
  };

  const getAttainmentBadge = (attainment: number, threshold: number) => {
    const isAttained = attainment >= threshold;
    return (
      <Badge className={isAttained ? 'bg-[var(--success-green)] text-white text-[10px] px-1.5 py-0.5' : 'bg-[var(--error)] text-white text-[10px] px-1.5 py-0.5'}>
        {attainment.toFixed(1)}% {isAttained ? '✓' : '✗'}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header - admin CLO style (title + subtitle, back on right) */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-primary-text">Course Analytics</h1>
          <p className="text-xs text-secondary-text mt-0.5">
            {data.course.code} - {data.course.name} • {data.semester}
          </p>
        </div>
        <button
          onClick={() => router.push(`/student/courses/${courseId}`)}
          className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 flex items-center gap-1.5"
          style={{ backgroundColor: iconBgColor, color: primaryColor }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = iconBgColor;
          }}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Course
        </button>
      </div>

      {/* Overall Performance */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-card-border rounded-lg p-4 shadow-sm">
          <p className="text-xs font-medium text-secondary-text">Average Percentage</p>
          <div className="text-xl font-bold mt-1 text-primary-text">{data.overallPerformance.averagePercentage.toFixed(1)}%</div>
        </div>
        <div className="bg-card border border-card-border rounded-lg p-4 shadow-sm">
          <p className="text-xs font-medium text-secondary-text">Current Grade</p>
          <div className="text-xl font-bold mt-1 text-primary-text">{data.overallPerformance.currentGrade || 'N/A'}</div>
        </div>
        <div className="bg-card border border-card-border rounded-lg p-4 shadow-sm">
          <p className="text-xs font-medium text-secondary-text">Completed Assessments</p>
          <div className="text-xl font-bold mt-1 text-primary-text">
            {data.overallPerformance.completedAssessments} / {data.overallPerformance.totalAssessments}
          </div>
        </div>
        <div className="bg-card border border-card-border rounded-lg p-4 shadow-sm">
          <p className="text-xs font-medium text-secondary-text">GPA Points</p>
          <div className="text-xl font-bold mt-1 text-primary-text">{data.overallPerformance.gpaPoints?.toFixed(2) || 'N/A'}</div>
        </div>
      </div>

      {/* Assessment Performance */}
      <div className="rounded-lg border border-card-border bg-card overflow-hidden mb-6">
        <div className="p-4 border-b border-card-border flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary-text" style={{ color: primaryColor }} />
          <h2 className="text-sm font-semibold text-primary-text">Assessment Performance</h2>
        </div>
        <div className="p-4">
          {data.assessmentPerformance.length === 0 ? (
            <p className="text-xs text-secondary-text text-center py-4">No assessments available</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-semibold text-primary-text">Assessment</TableHead>
                  <TableHead className="text-xs font-semibold text-primary-text">Type</TableHead>
                  <TableHead className="text-xs font-semibold text-primary-text">Marks</TableHead>
                  <TableHead className="text-xs font-semibold text-primary-text">Percentage</TableHead>
                  <TableHead className="text-xs font-semibold text-primary-text">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.assessmentPerformance.map((assessment) => (
                  <TableRow key={assessment.id} className="hover:bg-hover-bg transition-colors">
                    <TableCell className="text-xs font-medium text-primary-text">{assessment.title}</TableCell>
                    <TableCell>
                      <Badge className="border border-card-border text-[10px] px-1.5 py-0.5 text-primary-text">{assessment.type.replace(/_/g, ' ')}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-primary-text">
                      {assessment.obtainedMarks.toFixed(1)} / {assessment.totalMarks.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-xs text-primary-text">{assessment.percentage.toFixed(1)}%</TableCell>
                    <TableCell>{getStatusBadge(assessment.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* CLO Performance */}
      <div className="rounded-lg border border-card-border bg-card overflow-hidden">
        <div className="p-4 border-b border-card-border flex items-center gap-2">
          <Target className="w-5 h-5 text-primary-text" style={{ color: primaryColor }} />
          <h2 className="text-sm font-semibold text-primary-text">CLO Performance</h2>
        </div>
        <div className="p-4">
          {data.cloPerformance.length === 0 ? (
            <p className="text-xs text-secondary-text text-center py-4">No CLO attainments available</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-semibold text-primary-text">CLO Code</TableHead>
                  <TableHead className="text-xs font-semibold text-primary-text">Description</TableHead>
                  <TableHead className="text-xs font-semibold text-primary-text">Attainment</TableHead>
                  <TableHead className="text-xs font-semibold text-primary-text">Threshold</TableHead>
                  <TableHead className="text-xs font-semibold text-primary-text">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.cloPerformance.map((clo) => (
                  <TableRow key={clo.cloId} className="hover:bg-hover-bg transition-colors">
                    <TableCell className="text-xs font-medium text-primary-text">{clo.cloCode}</TableCell>
                    <TableCell className="text-xs text-secondary-text max-w-md truncate">{clo.cloDescription}</TableCell>
                    <TableCell>{getAttainmentBadge(clo.attainmentPercent, clo.threshold)}</TableCell>
                    <TableCell className="text-xs text-primary-text">{clo.threshold}%</TableCell>
                    <TableCell>
                      <Badge className={clo.status === 'attained' ? 'bg-[var(--success-green)] text-white text-[10px] px-1.5 py-0.5' : 'bg-[var(--error)] text-white text-[10px] px-1.5 py-0.5'}>
                        {clo.status === 'attained' ? 'Attained' : 'Not Attained'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}

