'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  const courseId = params?.id;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);

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

  if (!data) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No analytics data available</p>
          <Button
            variant="outline"
            onClick={() => router.push(`/student/courses/${courseId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Course
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
      case 'evaluated':
        return <Badge variant="success">Completed</Badge>;
      case 'submitted':
        return <Badge variant="default">Submitted</Badge>;
      case 'not_submitted':
        return <Badge variant="secondary">Not Submitted</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getAttainmentBadge = (attainment: number, threshold: number) => {
    const isAttained = attainment >= threshold;
    return (
      <Badge variant={isAttained ? 'success' : 'destructive'}>
        {attainment.toFixed(1)}% {isAttained ? '✓' : '✗'}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/student/courses/${courseId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Course Analytics</h1>
            <p className="text-muted-foreground">
              {data.course.code} - {data.course.name} • {data.semester}
            </p>
          </div>
        </div>
      </div>

      {/* Overall Performance */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Percentage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overallPerformance.averagePercentage.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Grade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overallPerformance.currentGrade || 'N/A'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overallPerformance.completedAssessments} /{' '}
              {data.overallPerformance.totalAssessments}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              GPA Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overallPerformance.gpaPoints?.toFixed(2) || 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assessment Performance */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Assessment Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.assessmentPerformance.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No assessments available
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assessment</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.assessmentPerformance.map((assessment) => (
                  <TableRow key={assessment.id}>
                    <TableCell className="font-medium">
                      {assessment.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {assessment.type.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {assessment.obtainedMarks.toFixed(1)} /{' '}
                      {assessment.totalMarks.toFixed(1)}
                    </TableCell>
                    <TableCell>{assessment.percentage.toFixed(1)}%</TableCell>
                    <TableCell>{getStatusBadge(assessment.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* CLO Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            CLO Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.cloPerformance.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No CLO attainments available
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CLO Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Attainment</TableHead>
                  <TableHead>Threshold</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.cloPerformance.map((clo) => (
                  <TableRow key={clo.cloId}>
                    <TableCell className="font-medium">{clo.cloCode}</TableCell>
                    <TableCell className="max-w-md truncate">
                      {clo.cloDescription}
                    </TableCell>
                    <TableCell>
                      {getAttainmentBadge(clo.attainmentPercent, clo.threshold)}
                    </TableCell>
                    <TableCell>{clo.threshold}%</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          clo.status === 'attained' ? 'success' : 'destructive'
                        }
                      >
                        {clo.status === 'attained' ? 'Attained' : 'Not Attained'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

