'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-6'>
        <div className='bg-red-100 text-red-700 p-4 rounded'>{error}</div>
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-primary-text">My Analytics</h1>
          <p className="text-xs text-secondary-text mt-0.5">Comprehensive performance analysis and insights</p>
        </div>
        <button
          onClick={exportToCSV}
          className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 flex items-center gap-1.5 border border-card-border bg-transparent text-primary-text hover:bg-hover-bg"
        >
          <Download className="h-3.5 w-3.5" />
          Export to CSV
        </button>
      </div>

      {/* Overall Performance Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Overall Average
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>
              {data.overallPerformance.averagePercentage.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              CGPA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>
              {data.overallPerformance.cgpa.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Total Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>
              {data.overallPerformance.totalAssessments}
            </div>
            <p className='text-sm text-muted-foreground mt-1'>
              {data.overallPerformance.completedAssessments} completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              CLO Attainment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>
              {data.cloAnalytics.attained} / {data.cloAnalytics.total}
            </div>
            <p className='text-sm text-muted-foreground mt-1'>
              {data.cloAnalytics.total > 0
                ? (
                    (data.cloAnalytics.attained / data.cloAnalytics.total) *
                    100
                  ).toFixed(1)
                : 0}
              % attained
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* GPA Trend */}
        <Card>
          <CardHeader>
            <CardTitle>GPA Trend Over Time</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Performance Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Trend</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Grade Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Assessment Performance by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Performance by Assessment Type</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>

      {/* Course Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Courses</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* CLO Analytics */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Strong CLOs */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Award className='h-5 w-5 text-green-600' />
              Strong CLOs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {data.cloAnalytics.strongCLOs.slice(0, 5).map((clo) => (
                <div
                  key={clo.cloId}
                  className='p-3 bg-green-50 rounded-lg border border-green-200'
                >
                  <div className='flex justify-between items-start'>
                    <div>
                      <p className='font-semibold'>{clo.cloCode}</p>
                      <p className='text-sm text-muted-foreground'>
                        {clo.courseCode}
                      </p>
                    </div>
                    <Badge variant='success'>
                      {clo.studentAttainment.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
              {data.cloAnalytics.strongCLOs.length === 0 && (
                <p className='text-center text-muted-foreground py-4'>
                  No strong CLOs yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Weak CLOs */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <AlertCircle className='h-5 w-5 text-orange-600' />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {data.cloAnalytics.weakCLOs.slice(0, 5).map((clo) => (
                <div
                  key={clo.cloId}
                  className='p-3 bg-orange-50 rounded-lg border border-orange-200'
                >
                  <div className='flex justify-between items-start'>
                    <div>
                      <p className='font-semibold'>{clo.cloCode}</p>
                      <p className='text-sm text-muted-foreground'>
                        {clo.courseCode}
                      </p>
                    </div>
                    <Badge variant='destructive'>
                      {clo.studentAttainment.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
              {data.cloAnalytics.weakCLOs.length === 0 && (
                <p className='text-center text-muted-foreground py-4'>
                  Great job! No weak areas identified
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assessment Analytics */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Best Performing Assessments */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <TrendingUp className='h-5 w-5 text-green-600' />
              Best Performing Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {data.assessmentAnalytics.bestPerforming.map((assessment) => (
                <div
                  key={assessment.id}
                  className='p-3 bg-gray-50 rounded-lg border'
                >
                  <div className='flex justify-between items-start'>
                    <div>
                      <p className='font-semibold'>{assessment.title}</p>
                      <p className='text-sm text-muted-foreground'>
                        {assessment.course} • {assessment.type.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <Badge variant='success'>
                      {assessment.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Needs Improvement */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Target className='h-5 w-5 text-orange-600' />
              Assessments Needing Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {data.assessmentAnalytics.needsImprovement.map((assessment) => (
                <div
                  key={assessment.id}
                  className='p-3 bg-gray-50 rounded-lg border'
                >
                  <div className='flex justify-between items-start'>
                    <div>
                      <p className='font-semibold'>{assessment.title}</p>
                      <p className='text-sm text-muted-foreground'>
                        {assessment.course} • {assessment.type.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <Badge variant='destructive'>
                      {assessment.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;
