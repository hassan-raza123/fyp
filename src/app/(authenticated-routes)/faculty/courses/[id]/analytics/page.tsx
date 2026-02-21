'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, TrendingUp, Users, FileText, Target, BarChart2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface CourseAnalytics {
  course: {
    id: number;
    code: string;
    name: string;
  };
  enrollmentTrend: Array<{
    semester: string;
    semesterId: number;
    enrollment: number;
    sectionName: string;
  }>;
  assessmentPerformanceByCLO: Array<{
    cloId: number;
    cloCode: string;
    averagePercentage: number;
    assessmentCount: number;
  }>;
  overallPerformance: {
    totalAssessments: number;
    totalStudents: number;
    averageCLOAttainment: number;
    attainedCLOs: number;
    totalCLOs: number;
  };
  sectionPerformance: Array<{
    sectionId: number;
    sectionName: string;
    semester: string;
    enrollment: number;
    assessmentCount: number;
    averagePerformance: number;
  }>;
}

const COLORS = ['#8B5CF6', '#6366F1', '#4F46E5', '#3730A3', '#312E81'];

export default function CourseAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = mounted && resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';

  const courseId = params.id as string;
  const [course, setCourse] = useState<any>(null);
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (courseId) {
      fetchData();
    }
  }, [courseId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [courseRes, analyticsRes] = await Promise.all([
        fetch(`/api/courses/${courseId}`, { credentials: 'include' }),
        fetch(`/api/courses/${courseId}/analytics`, { credentials: 'include' }),
      ]);

      const [courseData, analyticsData] = await Promise.all([
        courseRes.json(),
        analyticsRes.json(),
      ]);

      if (!courseData.success) {
        throw new Error(courseData.error || 'Failed to fetch course');
      }

      setCourse(courseData.data);

      if (analyticsData.success) {
        setAnalytics(analyticsData.data);
      }
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] bg-page">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderTopColor: primaryColor, borderRightColor: 'transparent', borderBottomColor: primaryColor, borderLeftColor: 'transparent' }}
          />
          <p className="text-xs text-secondary-text">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-card-border bg-card py-12 text-center">
          <BarChart2 className="w-10 h-10 mx-auto mb-3 text-muted-text" />
          <p className="text-xs text-secondary-text">No analytics data available</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const enrollmentChartData = analytics.enrollmentTrend.map((item) => ({
    name: item.semester,
    enrollment: item.enrollment,
  }));

  const cloPerformanceData = analytics.assessmentPerformanceByCLO.map(
    (item) => ({
      name: item.cloCode,
      performance: item.averagePercentage,
    })
  );

  const sectionPerformanceData = analytics.sectionPerformance.map((item) => ({
    name: item.sectionName,
    performance: item.averagePerformance,
    enrollment: item.enrollment,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push(`/faculty/courses/${courseId}`)}
          className="p-2 rounded-lg border border-card-border bg-transparent text-primary-text hover:bg-[var(--hover-bg)]"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-primary-text">
            Course Analytics - {course?.name} ({course?.code})
          </h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Performance metrics and trends
          </p>
        </div>
      </div>

      {/* Overall Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-lg border border-card-border bg-card overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-text">Total Students</p>
                <p className="text-2xl font-bold">
                  {analytics.overallPerformance.totalStudents}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-lg border border-card-border bg-card overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-text">Total Assessments</p>
                <p className="text-2xl font-bold">
                  {analytics.overallPerformance.totalAssessments}
                </p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-lg border border-card-border bg-card overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-text">CLO Attainment</p>
                <p className="text-2xl font-bold">
                  {analytics.overallPerformance.averageCLOAttainment.toFixed(1)}%
                </p>
              </div>
              <Target className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-lg border border-card-border bg-card overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-text">CLOs Attained</p>
                <p className="text-2xl font-bold">
                  {analytics.overallPerformance.attainedCLOs} /{' '}
                  {analytics.overallPerformance.totalCLOs}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Enrollment Trend */}
        <Card className="rounded-lg border border-card-border bg-card overflow-hidden">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-primary-text">Student Enrollment Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {enrollmentChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={enrollmentChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="enrollment"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-secondary-text text-center py-8">
                No enrollment data available
              </p>
            )}
          </CardContent>
        </Card>

        {/* CLO Performance */}
        <Card className="rounded-lg border border-card-border bg-card overflow-hidden">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-primary-text">Assessment Performance by CLO</CardTitle>
          </CardHeader>
          <CardContent>
            {cloPerformanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cloPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="performance" fill="#6366F1" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-secondary-text text-center py-8">
                No CLO performance data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section-wise Performance */}
      <Card className="rounded-lg border border-card-border bg-card overflow-hidden">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-primary-text">Section-wise Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.sectionPerformance.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Section</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Enrollment</TableHead>
                  <TableHead>Assessments</TableHead>
                  <TableHead>Avg Performance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.sectionPerformance.map((section) => (
                  <TableRow key={section.sectionId}>
                    <TableCell className="font-medium">
                      {section.sectionName}
                    </TableCell>
                    <TableCell>{section.semester}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-secondary-text" />
                        {section.enrollment}
                      </div>
                    </TableCell>
                    <TableCell>{section.assessmentCount}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            section.averagePerformance >= 70
                              ? 'default'
                              : section.averagePerformance >= 50
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {section.averagePerformance.toFixed(1)}%
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => router.push(`/faculty/sections/${section.sectionId}`)}
                        className="px-2 py-1 rounded-lg text-xs font-medium h-7"
                        style={{ backgroundColor: iconBgColor, color: primaryColor }}
                      >
                        View Details
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-secondary-text text-center py-8">
              No section performance data available
            </p>
          )}
        </CardContent>
      </Card>

      {/* CLO Performance Table */}
      {analytics.assessmentPerformanceByCLO.length > 0 && (
        <Card className="rounded-lg border border-card-border bg-card overflow-hidden">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-primary-text">CLO Performance Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CLO Code</TableHead>
                  <TableHead>Average Performance</TableHead>
                  <TableHead>Assessments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.assessmentPerformanceByCLO.map((clo) => (
                  <TableRow key={clo.cloId}>
                    <TableCell className="font-medium">{clo.cloCode}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          clo.averagePercentage >= 70
                            ? 'default'
                            : clo.averagePercentage >= 50
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {clo.averagePercentage.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell>{clo.assessmentCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

