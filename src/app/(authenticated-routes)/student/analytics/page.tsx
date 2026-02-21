'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  AlertCircle,
  Download,
  BarChart3,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface AnalyticsData {
  student: {
    id: number;
    rollNumber: string;
    name: string;
    email: string;
    program: { id: number; code: string; name: string } | null;
    batch: { id: string; name: string } | null;
  };
  overallPerformance: {
    averagePercentage: number;
    cgpa: number;
    totalAssessments: number;
    completedAssessments: number;
  };
  semesterPerformance: Array<{
    semester: string;
    semesterId: number;
    averagePercentage: number;
    gpa: number;
    totalAssessments: number;
    completedAssessments: number;
  }>;
  coursePerformance: Array<{
    courseId: number;
    courseCode: string;
    courseName: string;
    semester: string;
    averagePercentage: number;
    grade: string | null;
    gpa: number;
    totalAssessments: number;
    completedAssessments: number;
  }>;
  cloAnalytics: {
    total: number;
    attained: number;
    strongCLOs: Array<{
      cloId: number;
      cloCode: string;
      cloDescription: string;
      courseCode: string;
      courseName: string;
      studentAttainment: number;
      classAttainment: number;
      status: 'attained' | 'not_attained';
    }>;
    weakCLOs: Array<{
      cloId: number;
      cloCode: string;
      cloDescription: string;
      courseCode: string;
      courseName: string;
      studentAttainment: number;
      classAttainment: number;
      status: 'attained' | 'not_attained';
    }>;
    allCLOs: Array<{
      cloId: number;
      cloCode: string;
      cloDescription: string;
      courseCode: string;
      courseName: string;
      studentAttainment: number;
      classAttainment: number;
      status: 'attained' | 'not_attained';
    }>;
  };
  assessmentAnalytics: {
    total: number;
    completed: number;
    pending: number;
    averagePercentage: number;
    byType: Record<string, { count: number; average: number }>;
    bestPerforming: Array<{
      id: number;
      title: string;
      type: string;
      course: string;
      percentage: number;
      obtainedMarks: number;
      totalMarks: number;
    }>;
    needsImprovement: Array<{
      id: number;
      title: string;
      type: string;
      course: string;
      percentage: number;
      obtainedMarks: number;
      totalMarks: number;
    }>;
  };
  gradeDistribution: Record<string, number>;
}

const AnalyticsPage = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isDarkMode = mounted && resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const primaryColorDark = isDarkMode ? 'var(--orange-dark)' : 'var(--blue-dark)';
  const iconBgColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/student/analytics', {
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch analytics');
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch analytics');
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load analytics'
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const exportToCSV = () => {
    if (!data) {
      toast.error('No data to export');
      return;
    }

    const csvRows: string[] = [];
    csvRows.push('Student Analytics Report');
    csvRows.push(`Generated: ${new Date().toLocaleString()}`);
    csvRows.push('');
    csvRows.push('Overall Performance');
    csvRows.push(`Average Percentage,${data.overallPerformance.averagePercentage}%`);
    csvRows.push(`CGPA,${data.overallPerformance.cgpa}`);
    csvRows.push(`Total Assessments,${data.overallPerformance.totalAssessments}`);
    csvRows.push(`Completed Assessments,${data.overallPerformance.completedAssessments}`);
    csvRows.push('');

    csvRows.push('Semester Performance');
    csvRows.push('Semester,Average %,GPA,Total Assessments,Completed');
    data.semesterPerformance.forEach((sem) => {
      csvRows.push(
        `${sem.semester},${sem.averagePercentage}%,${sem.gpa},${sem.totalAssessments},${sem.completedAssessments}`
      );
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `student_analytics_${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Analytics exported successfully');
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

  if (error) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-bold text-primary-text">My Analytics</h1>
          <p className="text-xs text-secondary-text mt-0.5">Comprehensive performance analysis</p>
        </div>
        <div className="rounded-lg border border-card-border bg-card p-4">
          <p className="text-sm text-primary-text">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Prepare chart data
  const semesterTrendData = data.semesterPerformance.map((sem) => ({
    semester: sem.semester,
    gpa: sem.gpa,
    percentage: sem.averagePercentage,
  }));

  const coursePerformanceData = data.coursePerformance
    .sort((a, b) => b.averagePercentage - a.averagePercentage)
    .slice(0, 10)
    .map((course) => ({
      course: course.courseCode,
      percentage: course.averagePercentage,
      gpa: course.gpa,
    }));

  const gradeDistributionData = Object.entries(data.gradeDistribution)
    .filter(([_, count]) => count > 0)
    .map(([grade, count]) => ({
      name: grade,
      value: count,
    }));

  const assessmentTypeData = Object.entries(data.assessmentAnalytics.byType).map(
    ([type, data]) => ({
      type: type.replace(/_/g, ' '),
      average: data.average,
      count: data.count,
    })
  );

  const cloAttainmentData = data.cloAnalytics.allCLOs.map((clo) => ({
    clo: clo.cloCode,
    attainment: clo.studentAttainment,
  }));

  return (
    <div className="space-y-4">
      {/* Header - admin CLO style with icon */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: iconBgColor }}
          >
            <BarChart3 className="h-5 w-5" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary-text">My Analytics</h1>
            <p className="text-xs text-secondary-text mt-0.5">Comprehensive performance analysis and insights</p>
          </div>
        </div>
        <button
          onClick={exportToCSV}
          className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 flex items-center gap-1.5 transition-colors"
          style={{ backgroundColor: iconBgColor, color: primaryColor }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = iconBgColor;
          }}
        >
          <Download className="h-3.5 w-3.5" />
          Export to CSV
        </button>
      </div>

      {/* Overall Performance Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <div className="bg-card border border-card-border rounded-lg p-4 shadow-sm">
          <p className="text-xs font-medium text-secondary-text">Overall Average</p>
          <div className="text-2xl font-bold mt-1 text-primary-text">{data.overallPerformance.averagePercentage.toFixed(1)}%</div>
        </div>
        <div className="bg-card border border-card-border rounded-lg p-4 shadow-sm">
          <p className="text-xs font-medium text-secondary-text">CGPA</p>
          <div className="text-2xl font-bold mt-1 text-primary-text">{data.overallPerformance.cgpa.toFixed(2)}</div>
        </div>
        <div className="bg-card border border-card-border rounded-lg p-4 shadow-sm">
          <p className="text-xs font-medium text-secondary-text">Total Assessments</p>
          <div className="text-2xl font-bold mt-1 text-primary-text">{data.overallPerformance.totalAssessments}</div>
          <p className="text-xs text-muted-text mt-1">{data.overallPerformance.completedAssessments} completed</p>
        </div>
        <div className="bg-card border border-card-border rounded-lg p-4 shadow-sm">
          <p className="text-xs font-medium text-secondary-text">CLO Attainment</p>
          <div className="text-2xl font-bold mt-1 text-primary-text">{data.cloAnalytics.attained} / {data.cloAnalytics.total}</div>
          <p className="text-xs text-muted-text mt-1">
            {data.cloAnalytics.total > 0 ? ((data.cloAnalytics.attained / data.cloAnalytics.total) * 100).toFixed(1) : 0}% attained
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* GPA Trend */}
        <div className="bg-card border border-card-border rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-card-border">
            <h2 className="text-sm font-semibold text-primary-text">GPA Trend Over Time</h2>
          </div>
          <div className="p-4">
            <div className='h-[300px]'>
              <ResponsiveContainer width='100%' height='100%'>
                <LineChart data={semesterTrendData}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='semester' />
                  <YAxis domain={[0, 4]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type='monotone'
                    dataKey='gpa'
                    stroke='#4f46e5'
                    strokeWidth={2}
                    name='GPA'
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Performance Trend */}
        <div className="bg-card border border-card-border rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-card-border">
            <h2 className="text-sm font-semibold text-primary-text">Performance Trend</h2>
          </div>
          <div className="p-4">
            <div className='h-[300px]'>
              <ResponsiveContainer width='100%' height='100%'>
                <LineChart data={semesterTrendData}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='semester' />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type='monotone'
                    dataKey='percentage'
                    stroke='#10b981'
                    strokeWidth={2}
                    name='Average %'
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Grade Distribution */}
        <div className="bg-card border border-card-border rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-card-border">
            <h2 className="text-sm font-semibold text-primary-text">Grade Distribution</h2>
          </div>
          <div className="p-4">
            <div className='h-[300px]'>
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Pie
                    data={gradeDistributionData}
                    cx='50%'
                    cy='50%'
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill='#8884d8'
                    dataKey='value'
                  >
                    {gradeDistributionData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Assessment Performance by Type */}
        <div className="bg-card border border-card-border rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-card-border">
            <h2 className="text-sm font-semibold text-primary-text">Performance by Assessment Type</h2>
          </div>
          <div className="p-4">
            <div className='h-[300px]'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={assessmentTypeData}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='type' />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey='average' fill='#4f46e5' name='Average %' />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Course Performance */}
      <div className="bg-card border border-card-border rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-card-border">
          <h2 className="text-sm font-semibold text-primary-text">Top Performing Courses</h2>
        </div>
        <div className="p-4">
          <div className='h-[300px]'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={coursePerformanceData}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='course' />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey='percentage' fill='#10b981' name='Average %' />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CLO Analytics */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className="bg-card border border-card-border rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-card-border flex items-center gap-2">
            <Award className="h-5 w-5" style={{ color: 'var(--success-green)' }} />
            <h2 className="text-sm font-semibold text-primary-text">Strong CLOs</h2>
          </div>
          <div className="p-4">
            <div className='space-y-3'>
              {data.cloAnalytics.strongCLOs.slice(0, 5).map((clo) => (
                <div key={clo.cloId} className='p-3 rounded-lg border border-card-border bg-[var(--success-green-opacity-10)] dark:bg-[var(--success-green-opacity-10)]'>
                  <div className='flex justify-between items-start'>
                    <div>
                      <p className='text-xs font-semibold text-primary-text'>{clo.cloCode}</p>
                      <p className='text-xs text-secondary-text'>{clo.courseCode}</p>
                    </div>
                    <Badge className="bg-[var(--success-green)] text-white text-[10px] px-1.5 py-0.5">{clo.studentAttainment.toFixed(1)}%</Badge>
                  </div>
                </div>
              ))}
              {data.cloAnalytics.strongCLOs.length === 0 && (
                <p className='text-center text-xs text-secondary-text py-4'>No strong CLOs yet</p>
              )}
            </div>
          </div>
        </div>
        <div className="bg-card border border-card-border rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-card-border flex items-center gap-2">
            <AlertCircle className="h-5 w-5" style={{ color: 'var(--warning)' }} />
            <h2 className="text-sm font-semibold text-primary-text">Areas for Improvement</h2>
          </div>
          <div className="p-4">
            <div className='space-y-3'>
              {data.cloAnalytics.weakCLOs.slice(0, 5).map((clo) => (
                <div key={clo.cloId} className='p-3 rounded-lg border border-card-border bg-[var(--brand-secondary-opacity-10)] dark:bg-[var(--brand-secondary-opacity-10)]'>
                  <div className='flex justify-between items-start'>
                    <div>
                      <p className='text-xs font-semibold text-primary-text'>{clo.cloCode}</p>
                      <p className='text-xs text-secondary-text'>{clo.courseCode}</p>
                    </div>
                    <Badge className="bg-[var(--warning)] text-white text-[10px] px-1.5 py-0.5">{clo.studentAttainment.toFixed(1)}%</Badge>
                  </div>
                </div>
              ))}
              {data.cloAnalytics.weakCLOs.length === 0 && (
                <p className='text-center text-xs text-secondary-text py-4'>Great job! No weak areas identified</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assessment Analytics */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className="bg-card border border-card-border rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-card-border flex items-center gap-2">
            <TrendingUp className="h-5 w-5" style={{ color: 'var(--success-green)' }} />
            <h2 className="text-sm font-semibold text-primary-text">Best Performing Assessments</h2>
          </div>
          <div className="p-4">
            <div className='space-y-3'>
              {data.assessmentAnalytics.bestPerforming.map((assessment) => (
                <div key={assessment.id} className='p-3 rounded-lg border border-card-border bg-hover-bg/50'>
                  <div className='flex justify-between items-start'>
                    <div>
                      <p className='text-xs font-semibold text-primary-text'>{assessment.title}</p>
                      <p className='text-xs text-secondary-text'>{assessment.course} • {assessment.type.replace(/_/g, ' ')}</p>
                    </div>
                    <Badge className="bg-[var(--success-green)] text-white text-[10px] px-1.5 py-0.5">{assessment.percentage.toFixed(1)}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-card border border-card-border rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-card-border flex items-center gap-2">
            <Target className="h-5 w-5" style={{ color: primaryColor }} />
            <h2 className="text-sm font-semibold text-primary-text">Assessments Needing Improvement</h2>
          </div>
          <div className="p-4">
            <div className='space-y-3'>
              {data.assessmentAnalytics.needsImprovement.map((assessment) => (
                <div key={assessment.id} className='p-3 rounded-lg border border-card-border bg-hover-bg/50'>
                  <div className='flex justify-between items-start'>
                    <div>
                      <p className='text-xs font-semibold text-primary-text'>{assessment.title}</p>
                      <p className='text-xs text-secondary-text'>{assessment.course} • {assessment.type.replace(/_/g, ' ')}</p>
                    </div>
                    <Badge className="bg-[var(--error)] text-white text-[10px] px-1.5 py-0.5">{assessment.percentage.toFixed(1)}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
