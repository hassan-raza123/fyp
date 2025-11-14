'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
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
  const courseId = params.id as string;
  const [course, setCourse] = useState<any>(null);
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p>Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="py-8 text-center">
            <BarChart2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No analytics data available</p>
          </CardContent>
        </Card>
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
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/faculty/courses/${courseId}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            Course Analytics - {course?.name} ({course?.code})
          </h1>
          <p className="text-muted-foreground">
            Performance metrics and trends
          </p>
        </div>
      </div>

      {/* Overall Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">
                  {analytics.overallPerformance.totalStudents}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Assessments</p>
                <p className="text-2xl font-bold">
                  {analytics.overallPerformance.totalAssessments}
                </p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CLO Attainment</p>
                <p className="text-2xl font-bold">
                  {analytics.overallPerformance.averageCLOAttainment.toFixed(1)}%
                </p>
              </div>
              <Target className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CLOs Attained</p>
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
        <Card>
          <CardHeader>
            <CardTitle>Student Enrollment Trend</CardTitle>
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
              <p className="text-sm text-muted-foreground text-center py-8">
                No enrollment data available
              </p>
            )}
          </CardContent>
        </Card>

        {/* CLO Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Assessment Performance by CLO</CardTitle>
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
              <p className="text-sm text-muted-foreground text-center py-8">
                No CLO performance data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section-wise Performance */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Section-wise Performance</CardTitle>
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
                        <Users className="w-4 h-4 text-muted-foreground" />
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          router.push(`/faculty/sections/${section.sectionId}`)
                        }
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No section performance data available
            </p>
          )}
        </CardContent>
      </Card>

      {/* CLO Performance Table */}
      {analytics.assessmentPerformanceByCLO.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>CLO Performance Details</CardTitle>
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

