'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  AlertTriangle,
  Download,
  Filter,
  Calendar,
  Target,
  BookOpen,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AnalyticsData {
  performance: {
    overall: Array<{
      courseId: number;
      courseCode: string;
      courseName: string;
      totalStudents: number;
      totalAssessments: number;
      averagePercentage: number;
      sections: any[];
    }>;
    sectionComparison: Array<{
      sectionId: number;
      sectionName: string;
      course: any;
      semester: string;
      enrollment: number;
      assessmentCount: number;
      averagePercentage: number;
    }>;
    studentTrends: Array<{
      studentId: number;
      trends: Array<{ semester: string; average: number }>;
    }>;
  };
  clo: {
    trends: Array<{
      cloId: number;
      cloCode: string;
      description: string;
      attainments: number[];
      average: number;
      latest: number | null;
      trend: 'improving' | 'declining' | 'stable';
    }>;
    weakCLOs: any[];
    suggestions: Array<{
      cloCode: string;
      currentAttainment: number;
      suggestion: string;
    }>;
  };
  student: {
    topPerformers: Array<{
      studentId: number;
      rollNumber: string;
      name: string;
      average: number;
      totalAssessments: number;
    }>;
    atRiskStudents: Array<{
      studentId: number;
      rollNumber: string;
      name: string;
      average: number;
      totalAssessments: number;
    }>;
    distribution: {
      excellent: number;
      good: number;
      average: number;
      poor: number;
    };
    gradeDistribution: {
      'A+': number;
      A: number;
      'B+': number;
      B: number;
      'C+': number;
      C: number;
      F: number;
    };
  };
  assessment: Array<{
    assessmentId: number;
    title: string;
    type: string;
    difficulty: 'easy' | 'medium' | 'hard' | null;
    averageScore: number | null;
    averagePercentage: number | null;
    totalStudents: number;
    itemAnalysis: Array<{
      itemId: number;
      questionNo: string;
      averageMarks: number;
      difficulty: 'easy' | 'medium' | 'hard' | null;
    }>;
  }>;
}

const COLORS = [
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7300',
  '#00ff00',
  '#0088fe',
];

const AnalyticsPage = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    courseId: '',
    sectionId: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchAnalytics();
  }, [filters]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.courseId) params.append('courseId', filters.courseId);
      if (filters.sectionId) params.append('sectionId', filters.sectionId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await fetch(
        `/api/faculty/analytics?${params.toString()}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      toast.error('Failed to load analytics');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    if (!data) return;

    if (format === 'csv') {
      // Export CSV
      const csvRows: string[] = [];

      // Performance Analytics
      csvRows.push('Performance Analytics');
      csvRows.push(
        'Course Code,Course Name,Total Students,Total Assessments,Average %'
      );
      data.performance.overall.forEach((course) => {
        csvRows.push(
          `${course.courseCode},${course.courseName},${course.totalStudents},${
            course.totalAssessments
          },${course.averagePercentage.toFixed(2)}`
        );
      });

      csvRows.push('\nSection Comparison');
      csvRows.push(
        'Section Name,Course,Semester,Enrollment,Assessments,Average %'
      );
      data.performance.sectionComparison.forEach((section) => {
        csvRows.push(
          `${section.sectionName},${section.course.code} - ${
            section.course.name
          },${section.semester},${section.enrollment},${
            section.assessmentCount
          },${section.averagePercentage.toFixed(2)}`
        );
      });

      // CLO Analytics
      csvRows.push('\nCLO Analytics');
      csvRows.push(
        'CLO Code,Description,Latest Attainment,Average Attainment,Trend'
      );
      data.clo.trends.forEach((clo) => {
        csvRows.push(
          `${clo.cloCode},"${clo.description}",${
            clo.latest || 0
          },${clo.average.toFixed(2)},${clo.trend}`
        );
      });

      // Student Analytics
      csvRows.push('\nTop Performers');
      csvRows.push('Roll Number,Name,Average %,Total Assessments');
      data.student.topPerformers.forEach((student) => {
        csvRows.push(
          `${student.rollNumber},"${student.name}",${student.average.toFixed(
            2
          )},${student.totalAssessments}`
        );
      });

      csvRows.push('\nAt-Risk Students');
      csvRows.push('Roll Number,Name,Average %,Total Assessments');
      data.student.atRiskStudents.forEach((student) => {
        csvRows.push(
          `${student.rollNumber},"${student.name}",${student.average.toFixed(
            2
          )},${student.totalAssessments}`
        );
      });

      // Assessment Analytics
      csvRows.push('\nAssessment Analytics');
      csvRows.push(
        'Assessment Title,Type,Difficulty,Average Score,Average %,Total Students'
      );
      data.assessment.forEach((assessment) => {
        csvRows.push(
          `"${assessment.title}",${assessment.type},${
            assessment.difficulty || 'N/A'
          },${assessment.averageScore?.toFixed(2) || 'N/A'},${
            assessment.averagePercentage?.toFixed(2) || 'N/A'
          },${assessment.totalStudents}`
        );
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `analytics_${new Date().toISOString().split('T')[0]}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('CSV exported successfully');
    } else {
      // PDF export using jsPDF
      try {
        const doc = new jsPDF();
        let yPos = 20;

        // Title
        doc.setFontSize(18);
        doc.text('Analytics Report', 14, yPos);
        yPos += 10;

        // Date
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, yPos);
        yPos += 15;

        // Performance Analytics
        doc.setFontSize(14);
        doc.text('Performance Analytics', 14, yPos);
        yPos += 8;

        // Overall Course Performance Table
        const performanceData = data.performance.overall.map((course) => [
          course.courseCode,
          course.courseName,
          course.totalStudents.toString(),
          course.totalAssessments.toString(),
          `${course.averagePercentage.toFixed(1)}%`,
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [
            [
              'Course Code',
              'Course Name',
              'Students',
              'Assessments',
              'Average %',
            ],
          ],
          body: performanceData,
          theme: 'striped',
          headStyles: { fillColor: [136, 132, 216] },
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;

        // Section Comparison Table
        if (data.performance.sectionComparison.length > 0) {
          doc.setFontSize(14);
          doc.text('Section Comparison', 14, yPos);
          yPos += 8;

          const sectionData = data.performance.sectionComparison.map(
            (section) => [
              section.sectionName,
              `${section.course.code} - ${section.course.name}`,
              section.semester,
              section.enrollment.toString(),
              section.assessmentCount.toString(),
              `${section.averagePercentage.toFixed(1)}%`,
            ]
          );

          autoTable(doc, {
            startY: yPos,
            head: [
              [
                'Section',
                'Course',
                'Semester',
                'Enrollment',
                'Assessments',
                'Average %',
              ],
            ],
            body: sectionData,
            theme: 'striped',
            headStyles: { fillColor: [136, 132, 216] },
          });

          yPos = (doc as any).lastAutoTable.finalY + 15;
        }

        // CLO Analytics
        if (data.clo.trends.length > 0) {
          doc.addPage();
          yPos = 20;
          doc.setFontSize(14);
          doc.text('CLO Analytics', 14, yPos);
          yPos += 8;

          const cloData = data.clo.trends.map((clo) => [
            clo.cloCode,
            clo.description.substring(0, 50) +
              (clo.description.length > 50 ? '...' : ''),
            `${(clo.latest || 0).toFixed(1)}%`,
            `${clo.average.toFixed(1)}%`,
            clo.trend,
          ]);

          autoTable(doc, {
            startY: yPos,
            head: [['CLO Code', 'Description', 'Latest', 'Average', 'Trend']],
            body: cloData,
            theme: 'striped',
            headStyles: { fillColor: [130, 202, 157] },
          });

          yPos = (doc as any).lastAutoTable.finalY + 15;

          // Weak CLOs
          if (data.clo.weakCLOs.length > 0) {
            doc.setFontSize(12);
            doc.text('Weak CLOs & Suggestions', 14, yPos);
            yPos += 8;

            const weakCLOData = data.clo.suggestions.map((suggestion) => [
              suggestion.cloCode,
              `${suggestion.currentAttainment.toFixed(1)}%`,
              suggestion.suggestion.substring(0, 60) +
                (suggestion.suggestion.length > 60 ? '...' : ''),
            ]);

            autoTable(doc, {
              startY: yPos,
              head: [['CLO Code', 'Attainment', 'Suggestion']],
              body: weakCLOData,
              theme: 'striped',
              headStyles: { fillColor: [239, 68, 68] },
            });

            yPos = (doc as any).lastAutoTable.finalY + 15;
          }
        }

        // Student Analytics
        if (
          data.student.topPerformers.length > 0 ||
          data.student.atRiskStudents.length > 0
        ) {
          doc.addPage();
          yPos = 20;
          doc.setFontSize(14);
          doc.text('Student Analytics', 14, yPos);
          yPos += 8;

          // Top Performers
          if (data.student.topPerformers.length > 0) {
            doc.setFontSize(12);
            doc.text('Top Performers', 14, yPos);
            yPos += 8;

            const topPerformersData = data.student.topPerformers.map(
              (student) => [
                student.rollNumber,
                student.name,
                `${student.average.toFixed(1)}%`,
                student.totalAssessments.toString(),
              ]
            );

            autoTable(doc, {
              startY: yPos,
              head: [['Roll Number', 'Name', 'Average %', 'Assessments']],
              body: topPerformersData,
              theme: 'striped',
              headStyles: { fillColor: [34, 197, 94] },
            });

            yPos = (doc as any).lastAutoTable.finalY + 15;
          }

          // At-Risk Students
          if (data.student.atRiskStudents.length > 0) {
            doc.setFontSize(12);
            doc.text('At-Risk Students', 14, yPos);
            yPos += 8;

            const atRiskData = data.student.atRiskStudents.map((student) => [
              student.rollNumber,
              student.name,
              `${student.average.toFixed(1)}%`,
              student.totalAssessments.toString(),
            ]);

            autoTable(doc, {
              startY: yPos,
              head: [['Roll Number', 'Name', 'Average %', 'Assessments']],
              body: atRiskData,
              theme: 'striped',
              headStyles: { fillColor: [239, 68, 68] },
            });

            yPos = (doc as any).lastAutoTable.finalY + 15;
          }

          // Performance Distribution
          doc.setFontSize(12);
          doc.text('Performance Distribution', 14, yPos);
          yPos += 8;

          const distributionData = [
            [
              'Excellent (≥85%)',
              data.student.distribution.excellent.toString(),
            ],
            ['Good (70-84%)', data.student.distribution.good.toString()],
            ['Average (50-69%)', data.student.distribution.average.toString()],
            ['Poor (<50%)', data.student.distribution.poor.toString()],
          ];

          autoTable(doc, {
            startY: yPos,
            head: [['Category', 'Count']],
            body: distributionData,
            theme: 'striped',
            headStyles: { fillColor: [136, 132, 216] },
          });

          yPos = (doc as any).lastAutoTable.finalY + 15;

          // Grade Distribution
          doc.setFontSize(12);
          doc.text('Grade Distribution', 14, yPos);
          yPos += 8;

          const gradeDistData = Object.entries(
            data.student.gradeDistribution
          ).map(([grade, count]) => [grade, count.toString()]);

          autoTable(doc, {
            startY: yPos,
            head: [['Grade', 'Count']],
            body: gradeDistData,
            theme: 'striped',
            headStyles: { fillColor: [136, 132, 216] },
          });
        }

        // Assessment Analytics
        if (data.assessment.length > 0) {
          doc.addPage();
          yPos = 20;
          doc.setFontSize(14);
          doc.text('Assessment Analytics', 14, yPos);
          yPos += 8;

          const assessmentData = data.assessment.map((assessment) => [
            assessment.title.substring(0, 40) +
              (assessment.title.length > 40 ? '...' : ''),
            assessment.type.replace(/_/g, ' '),
            assessment.difficulty || 'N/A',
            assessment.averageScore !== null
              ? assessment.averageScore.toFixed(1)
              : 'N/A',
            assessment.averagePercentage !== null
              ? `${assessment.averagePercentage.toFixed(1)}%`
              : 'N/A',
            assessment.totalStudents.toString(),
          ]);

          autoTable(doc, {
            startY: yPos,
            head: [
              [
                'Assessment',
                'Type',
                'Difficulty',
                'Avg Score',
                'Avg %',
                'Students',
              ],
            ],
            body: assessmentData,
            theme: 'striped',
            headStyles: { fillColor: [255, 198, 88] },
          });
        }

        // Save PDF
        doc.save(
          `analytics_report_${new Date().toISOString().split('T')[0]}.pdf`
        );
        toast.success('PDF exported successfully');
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast.error('Failed to generate PDF. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">Loading analytics...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12 text-muted-foreground">
          No analytics data available
        </div>
      </div>
    );
  }

  // Prepare chart data
  const performanceChartData = data.performance.overall.map((course) => ({
    name: course.courseCode,
    average: course.averagePercentage,
  }));

  const sectionChartData = data.performance.sectionComparison.map(
    (section) => ({
      name: section.sectionName,
      average: section.averagePercentage,
    })
  );

  const cloTrendData = data.clo.trends.map((clo) => ({
    name: clo.cloCode,
    latest: clo.latest || 0,
    average: clo.average,
  }));

  const distributionData = [
    { name: 'Excellent (≥85%)', value: data.student.distribution.excellent },
    { name: 'Good (70-84%)', value: data.student.distribution.good },
    { name: 'Average (50-69%)', value: data.student.distribution.average },
    { name: 'Poor (<50%)', value: data.student.distribution.poor },
  ];

  const gradeData = Object.entries(data.student.gradeDistribution).map(
    ([grade, count]) => ({
      name: grade,
      count,
    })
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights and performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter analytics data by course, section, or date range
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label>Course ID (Optional)</Label>
              <Input
                placeholder="Filter by course ID"
                value={filters.courseId}
                onChange={(e) =>
                  setFilters({ ...filters, courseId: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Section ID (Optional)</Label>
              <Input
                placeholder="Filter by section ID"
                value={filters.sectionId}
                onChange={(e) =>
                  setFilters({ ...filters, sectionId: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Start Date (Optional)</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
              />
            </div>
            <div>
              <Label>End Date (Optional)</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                setFilters({
                  courseId: '',
                  sectionId: '',
                  startDate: '',
                  endDate: '',
                })
              }
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="clo">CLO Analytics</TabsTrigger>
          <TabsTrigger value="student">Student Analytics</TabsTrigger>
          <TabsTrigger value="assessment">Assessment Analytics</TabsTrigger>
        </TabsList>

        {/* Performance Analytics */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.performance.overall.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Sections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.performance.sectionComparison.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Overall Average</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.performance.overall.length > 0
                    ? (
                        data.performance.overall.reduce(
                          (sum, c) => sum + c.averagePercentage,
                          0
                        ) / data.performance.overall.length
                      ).toFixed(1)
                    : 0}
                  %
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Course Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                  />
                  <Bar dataKey="average" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Section Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Section</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Enrollment</TableHead>
                    <TableHead>Assessments</TableHead>
                    <TableHead>Average %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.performance.sectionComparison.map((section) => (
                    <TableRow key={section.sectionId}>
                      <TableCell className="font-medium">
                        {section.sectionName}
                      </TableCell>
                      <TableCell>
                        {section.course.code} - {section.course.name}
                      </TableCell>
                      <TableCell>{section.semester}</TableCell>
                      <TableCell>{section.enrollment}</TableCell>
                      <TableCell>{section.assessmentCount}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={section.averagePercentage}
                            className="w-20"
                          />
                          <span>{section.averagePercentage.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CLO Analytics */}
        <TabsContent value="clo" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total CLOs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.clo.trends.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Weak CLOs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {data.clo.weakCLOs.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Average Attainment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.clo.trends.length > 0
                    ? (
                        data.clo.trends.reduce(
                          (sum, c) => sum + (c.latest || 0),
                          0
                        ) / data.clo.trends.length
                      ).toFixed(1)
                    : 0}
                  %
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>CLO Attainment Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cloTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                  />
                  <Legend />
                  <Bar dataKey="latest" fill="#8884d8" name="Latest" />
                  <Bar dataKey="average" fill="#82ca9d" name="Average" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Weak CLOs & Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CLO Code</TableHead>
                    <TableHead>Current Attainment</TableHead>
                    <TableHead>Suggestion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.clo.suggestions.map((suggestion, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        {suggestion.cloCode}
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">
                          {suggestion.currentAttainment.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>{suggestion.suggestion}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Student Analytics */}
        <TabsContent value="student" className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Top Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {data.student.topPerformers.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">At-Risk Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {data.student.atRiskStudents.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Excellent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.student.distribution.excellent}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Poor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.student.distribution.poor}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {distributionData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Grade Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={gradeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Average</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.student.topPerformers.slice(0, 10).map((student) => (
                      <TableRow key={student.studentId}>
                        <TableCell className="font-medium">
                          {student.rollNumber}
                        </TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>
                          <Badge variant="default" className="bg-green-600">
                            {student.average.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>At-Risk Students</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Average</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.student.atRiskStudents.map((student) => (
                      <TableRow key={student.studentId}>
                        <TableCell className="font-medium">
                          {student.rollNumber}
                        </TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">
                            {student.average.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Assessment Analytics */}
        <TabsContent value="assessment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Difficulty Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assessment</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Average Score</TableHead>
                    <TableHead>Average %</TableHead>
                    <TableHead>Students</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.assessment.map((assessment) => (
                    <TableRow key={assessment.assessmentId}>
                      <TableCell className="font-medium">
                        {assessment.title}
                      </TableCell>
                      <TableCell>
                        {assessment.type
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                      </TableCell>
                      <TableCell>
                        {assessment.difficulty ? (
                          <Badge
                            variant={
                              assessment.difficulty === 'easy'
                                ? 'default'
                                : assessment.difficulty === 'medium'
                                ? 'secondary'
                                : 'destructive'
                            }
                          >
                            {assessment.difficulty.toUpperCase()}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {assessment.averageScore !== null
                          ? assessment.averageScore.toFixed(1)
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {assessment.averagePercentage !== null
                          ? `${assessment.averagePercentage.toFixed(1)}%`
                          : 'N/A'}
                      </TableCell>
                      <TableCell>{assessment.totalStudents}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {data.assessment.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Item Analysis - {data.assessment[0].title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Question</TableHead>
                      <TableHead>Average Marks</TableHead>
                      <TableHead>Difficulty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.assessment[0].itemAnalysis.map((item) => (
                      <TableRow key={item.itemId}>
                        <TableCell className="font-medium">
                          {item.questionNo}
                        </TableCell>
                        <TableCell>{item.averageMarks.toFixed(1)}</TableCell>
                        <TableCell>
                          {item.difficulty ? (
                            <Badge
                              variant={
                                item.difficulty === 'easy'
                                  ? 'default'
                                  : item.difficulty === 'medium'
                                  ? 'secondary'
                                  : 'destructive'
                              }
                            >
                              {item.difficulty.toUpperCase()}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsPage;
