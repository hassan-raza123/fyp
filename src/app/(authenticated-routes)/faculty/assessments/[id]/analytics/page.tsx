'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';

interface AnalyticsData {
  assessment: {
    id: number;
    title: string;
    type: string;
    totalMarks: number;
    weightage: number;
  };
  overall: {
    totalStudents: number;
    averageMarks: number;
    averagePercentage: number;
    highestMarks: number;
    lowestMarks: number;
    totalMarks: number;
  };
  gradeDistribution: Array<{
    grade: string;
    count: number;
  }>;
  cloPerformance: Array<{
    cloId: number;
    cloCode: string;
    totalMarks: number;
    totalObtained: number;
    averagePercentage: number;
    itemCount: number;
  }>;
  itemAnalysis: Array<{
    itemId: number;
    questionNo: string;
    description: string;
    totalMarks: number;
    averageMarks: number;
    averagePercentage: number;
    cloCode: string;
  }>;
  studentResults: Array<{
    studentId: number;
    studentName: string;
    rollNumber: string;
    obtainedMarks: number;
    totalMarks: number;
    percentage: number;
    status: string;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

export default function AssessmentAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = mounted && resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [params.id]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(
        `/api/assessments/${params.id}/analytics`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      toast.error('Failed to load analytics');
      console.error('Error fetching analytics:', error);
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

  if (!data) {
    return (
      <div className="rounded-lg border border-card-border bg-card py-12 text-center">
        <p className="text-xs text-secondary-text">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 rounded-lg border border-card-border bg-transparent text-primary-text hover:bg-[var(--hover-bg)]"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-primary-text">Assessment Analytics</h1>
          <p className="text-xs text-secondary-text mt-0.5">{data.assessment.title}</p>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-lg border border-card-border bg-card overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary-text">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-primary-text">{data.overall.totalStudents}</div>
          </CardContent>
        </Card>
        <Card className="rounded-lg border border-card-border bg-card overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary-text">Average Marks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-primary-text">
              {data.overall.averageMarks.toFixed(1)} / {data.overall.totalMarks}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-lg border border-card-border bg-card overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary-text">Average %</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-primary-text">
              {data.overall.averagePercentage.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-lg border border-card-border bg-card overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary-text">Range</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-primary-text">
              {data.overall.lowestMarks} - {data.overall.highestMarks}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grade Distribution */}
      <Card className="rounded-lg border border-card-border bg-card overflow-hidden">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-primary-text">Grade Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.gradeDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="grade" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* CLO Performance */}
      <Card className="rounded-lg border border-card-border bg-card overflow-hidden">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-primary-text">Performance by CLO</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.cloPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="cloCode" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="averagePercentage" fill="#82ca9d" name="Average %" />
              </BarChart>
            </ResponsiveContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CLO Code</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total Marks</TableHead>
                  <TableHead>Avg Obtained</TableHead>
                  <TableHead>Average %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.cloPerformance.map((clo) => (
                  <TableRow key={clo.cloId}>
                    <TableCell>
                      <Badge variant="outline">{clo.cloCode}</Badge>
                    </TableCell>
                    <TableCell>{clo.itemCount}</TableCell>
                    <TableCell>{clo.totalMarks}</TableCell>
                    <TableCell>
                      {clo.totalMarks > 0
                        ? (clo.totalObtained / (data.overall.totalStudents || 1)).toFixed(1)
                        : '0'}
                    </TableCell>
                    <TableCell>{clo.averagePercentage.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Item-wise Analysis */}
      <Card className="rounded-lg border border-card-border bg-card overflow-hidden">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-primary-text">Item-wise Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead>CLO</TableHead>
                <TableHead>Total Marks</TableHead>
                <TableHead>Avg Marks</TableHead>
                <TableHead>Avg %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.itemAnalysis.map((item) => (
                <TableRow key={item.itemId}>
                  <TableCell>{item.questionNo}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.cloCode}</Badge>
                  </TableCell>
                  <TableCell>{item.totalMarks}</TableCell>
                  <TableCell>{item.averageMarks.toFixed(1)}</TableCell>
                  <TableCell>{item.averagePercentage.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Student Results */}
      <Card className="rounded-lg border border-card-border bg-card overflow-hidden">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-primary-text">Student Results</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Roll Number</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Marks</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.studentResults.map((result) => (
                <TableRow key={result.studentId}>
                  <TableCell>{result.rollNumber}</TableCell>
                  <TableCell>{result.studentName}</TableCell>
                  <TableCell>
                    {result.obtainedMarks} / {result.totalMarks}
                  </TableCell>
                  <TableCell>{result.percentage.toFixed(1)}%</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        result.status === 'published' ? 'default' : 'secondary'
                      }
                    >
                      {result.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

