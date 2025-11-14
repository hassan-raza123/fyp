'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
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
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div>Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto py-6">
        <div>No data available</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Assessment Analytics</h1>
          <p className="text-muted-foreground">{data.assessment.title}</p>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overall.totalStudents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Marks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overall.averageMarks.toFixed(1)} / {data.overall.totalMarks}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average %</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overall.averagePercentage.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Range</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overall.lowestMarks} - {data.overall.highestMarks}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grade Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Grade Distribution</CardTitle>
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
      <Card>
        <CardHeader>
          <CardTitle>Performance by CLO</CardTitle>
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
      <Card>
        <CardHeader>
          <CardTitle>Item-wise Analysis</CardTitle>
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
      <Card>
        <CardHeader>
          <CardTitle>Student Results</CardTitle>
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

