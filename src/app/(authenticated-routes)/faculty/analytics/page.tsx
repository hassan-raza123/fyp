'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const primaryColorDark = isDarkMode ? 'var(--orange-dark)' : 'var(--blue-dark)';

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
      <div className="flex items-center justify-center min-h-[50vh] bg-page">
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
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center text-xs text-muted-text">
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
    <div className="space-y-4">
      {/* Header - same as admin/faculty dashboard */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-primary-text">
            Analytics Dashboard
          </h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Comprehensive insights and performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 inline-flex items-center"
            style={{
              backgroundColor: isDarkMode ? 'rgba(252, 153, 40, 0.1)' : 'rgba(38, 40, 149, 0.1)',
              color: primaryColor,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.1)' : 'rgba(38, 40, 149, 0.1)';
            }}
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 inline-flex items-center"
            style={{
              backgroundColor: isDarkMode ? 'rgba(252, 153, 40, 0.1)' : 'rgba(38, 40, 149, 0.1)',
              color: primaryColor,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.1)' : 'rgba(38, 40, 149, 0.1)';
            }}
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border-card-border rounded-xl shadow-sm border">
        <div className="p-4 border-b border-card-border">
          <h2 className="text-sm font-semibold text-primary-text">Filters</h2>
          <p className="text-xs text-secondary-text mt-0.5">
            Filter analytics data by course, section, or date range
          </p>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs text-secondary-text">Course ID (Optional)</Label>
              <Input
                className="mt-1 h-8 text-xs border-card-border"
                placeholder="Filter by course ID"
                value={filters.courseId}
                onChange={(e) =>
                  setFilters({ ...filters, courseId: e.target.value })
                }
              />
            </div>
            <div>
              <Label className="text-xs text-secondary-text">Section ID (Optional)</Label>
              <Input
                className="mt-1 h-8 text-xs border-card-border"
                placeholder="Filter by section ID"
                value={filters.sectionId}
                onChange={(e) =>
                  setFilters({ ...filters, sectionId: e.target.value })
                }
              />
            </div>
            <div>
              <Label className="text-xs text-secondary-text">Start Date (Optional)</Label>
              <Input
                type="date"
                className="mt-1 h-8 text-xs border-card-border"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
              />
            </div>
            <div>
              <Label className="text-xs text-secondary-text">End Date (Optional)</Label>
              <Input
                type="date"
                className="mt-1 h-8 text-xs border-card-border"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() =>
                setFilters({
                  courseId: '',
                  sectionId: '',
                  startDate: '',
                  endDate: '',
                })
              }
              className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border bg-transparent text-primary-text hover:bg-[var(--hover-bg)]"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="bg-card border border-card-border p-1 rounded-lg">
          <TabsTrigger value="performance" className="text-xs data-[state=active]:bg-[var(--hover-bg)] data-[state=active]:text-primary-text rounded-md">Performance</TabsTrigger>
          <TabsTrigger value="clo" className="text-xs data-[state=active]:bg-[var(--hover-bg)] data-[state=active]:text-primary-text rounded-md">CLO Analytics</TabsTrigger>
          <TabsTrigger value="student" className="text-xs data-[state=active]:bg-[var(--hover-bg)] data-[state=active]:text-primary-text rounded-md">Student Analytics</TabsTrigger>
          <TabsTrigger value="assessment" className="text-xs data-[state=active]:bg-[var(--hover-bg)] data-[state=active]:text-primary-text rounded-md">Assessment Analytics</TabsTrigger>
        </TabsList>

        {/* Performance Analytics */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border-card-border rounded-xl p-4 shadow-sm border">
              <p className="text-xs font-medium text-secondary-text">Total Courses</p>
              <p className="text-lg font-bold mt-1 text-primary-text">{data.performance.overall.length}</p>
            </div>
            <div className="bg-card border-card-border rounded-xl p-4 shadow-sm border">
              <p className="text-xs font-medium text-secondary-text">Total Sections</p>
              <p className="text-lg font-bold mt-1 text-primary-text">{data.performance.sectionComparison.length}</p>
            </div>
            <div className="bg-card border-card-border rounded-xl p-4 shadow-sm border">
              <p className="text-xs font-medium text-secondary-text">Overall Average</p>
              <p className="text-lg font-bold mt-1 text-primary-text">
                {data.performance.overall.length > 0
                  ? (
                      data.performance.overall.reduce(
                        (sum, c) => sum + c.averagePercentage,
                        0
                      ) / data.performance.overall.length
                    ).toFixed(1)
                  : 0}
                %
              </p>
            </div>
          </div>

          <div className="bg-card border-card-border rounded-xl shadow-sm border p-4">
            <h2 className="text-sm font-semibold text-primary-text mb-3">Course Performance</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#404040' : '#e5e5e5'} opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: isDarkMode ? '#a3a3a3' : '#737373' }} stroke={isDarkMode ? '#525252' : '#d4d4d4'} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: isDarkMode ? '#a3a3a3' : '#737373' }} stroke={isDarkMode ? '#525252' : '#d4d4d4'} />
                <Tooltip
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#171717' : '#ffffff',
                    border: `1px solid ${isDarkMode ? '#404040' : '#e5e5e5'}`,
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="average" fill={primaryColor} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border-card-border rounded-xl shadow-sm border">
            <div className="p-4 border-b border-card-border">
              <h2 className="text-sm font-semibold text-primary-text">Section Comparison</h2>
            </div>
            <div className="p-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-card-border">
                    <TableHead className="text-xs text-secondary-text">Section</TableHead>
                    <TableHead className="text-xs text-secondary-text">Course</TableHead>
                    <TableHead className="text-xs text-secondary-text">Semester</TableHead>
                    <TableHead className="text-xs text-secondary-text">Enrollment</TableHead>
                    <TableHead className="text-xs text-secondary-text">Assessments</TableHead>
                    <TableHead className="text-xs text-secondary-text">Average %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.performance.sectionComparison.map((section) => (
                    <TableRow key={section.sectionId} className="border-card-border">
                      <TableCell className="font-medium text-sm text-primary-text">
                        {section.sectionName}
                      </TableCell>
                      <TableCell className="text-xs text-secondary-text">
                        {section.course.code} - {section.course.name}
                      </TableCell>
                      <TableCell className="text-xs text-secondary-text">{section.semester}</TableCell>
                      <TableCell className="text-xs text-primary-text">{section.enrollment}</TableCell>
                      <TableCell className="text-xs text-primary-text">{section.assessmentCount}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={section.averagePercentage}
                            className="w-20"
                          />
                          <span className="text-xs text-primary-text">{section.averagePercentage.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* CLO Analytics */}
        <TabsContent value="clo" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border-card-border rounded-xl p-4 shadow-sm border">
              <p className="text-xs font-medium text-secondary-text">Total CLOs</p>
              <p className="text-lg font-bold mt-1 text-primary-text">{data.clo.trends.length}</p>
            </div>
            <div className="bg-card border-card-border rounded-xl p-4 shadow-sm border">
              <p className="text-xs font-medium text-secondary-text">Weak CLOs</p>
              <p className="text-lg font-bold mt-1" style={{ color: 'var(--error)' }}>{data.clo.weakCLOs.length}</p>
            </div>
            <div className="bg-card border-card-border rounded-xl p-4 shadow-sm border">
              <p className="text-xs font-medium text-secondary-text">Average Attainment</p>
              <p className="text-lg font-bold mt-1 text-primary-text">
                {data.clo.trends.length > 0
                  ? (
                      data.clo.trends.reduce(
                        (sum, c) => sum + (c.latest || 0),
                        0
                      ) / data.clo.trends.length
                    ).toFixed(1)
                  : 0}
                %
              </p>
            </div>
          </div>

          <div className="bg-card border-card-border rounded-xl shadow-sm border p-4">
            <h2 className="text-sm font-semibold text-primary-text mb-3">CLO Attainment Trends</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cloTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#404040' : '#e5e5e5'} opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: isDarkMode ? '#a3a3a3' : '#737373' }} stroke={isDarkMode ? '#525252' : '#d4d4d4'} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: isDarkMode ? '#a3a3a3' : '#737373' }} stroke={isDarkMode ? '#525252' : '#d4d4d4'} />
                <Tooltip
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#171717' : '#ffffff',
                    border: `1px solid ${isDarkMode ? '#404040' : '#e5e5e5'}`,
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="latest" fill={primaryColor} name="Latest" radius={[4, 4, 0, 0]} />
                <Bar dataKey="average" fill="var(--success-green)" name="Average" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border-card-border rounded-xl shadow-sm border">
            <div className="p-4 border-b border-card-border">
              <h2 className="text-sm font-semibold text-primary-text">Weak CLOs & Suggestions</h2>
            </div>
            <div className="p-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-card-border">
                    <TableHead className="text-xs text-secondary-text">CLO Code</TableHead>
                    <TableHead className="text-xs text-secondary-text">Current Attainment</TableHead>
                    <TableHead className="text-xs text-secondary-text">Suggestion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.clo.suggestions.map((suggestion, idx) => (
                    <TableRow key={idx} className="border-card-border">
                      <TableCell className="font-medium text-sm text-primary-text">
                        {suggestion.cloCode}
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive" className="text-[10px]">
                          {suggestion.currentAttainment.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-secondary-text">{suggestion.suggestion}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* Student Analytics */}
        <TabsContent value="student" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card border-card-border rounded-xl p-4 shadow-sm border">
              <p className="text-xs font-medium text-secondary-text">Top Performers</p>
              <p className="text-lg font-bold mt-1 text-[var(--success-green)]">{data.student.topPerformers.length}</p>
            </div>
            <div className="bg-card border-card-border rounded-xl p-4 shadow-sm border">
              <p className="text-xs font-medium text-secondary-text">At-Risk Students</p>
              <p className="text-lg font-bold mt-1" style={{ color: 'var(--error)' }}>{data.student.atRiskStudents.length}</p>
            </div>
            <div className="bg-card border-card-border rounded-xl p-4 shadow-sm border">
              <p className="text-xs font-medium text-secondary-text">Excellent</p>
              <p className="text-lg font-bold mt-1 text-primary-text">{data.student.distribution.excellent}</p>
            </div>
            <div className="bg-card border-card-border rounded-xl p-4 shadow-sm border">
              <p className="text-xs font-medium text-secondary-text">Poor</p>
              <p className="text-lg font-bold mt-1 text-primary-text">{data.student.distribution.poor}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card border-card-border rounded-xl shadow-sm border p-4">
              <h2 className="text-sm font-semibold text-primary-text mb-3">Performance Distribution</h2>
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
                    fill={primaryColor}
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#171717' : '#ffffff',
                      border: `1px solid ${isDarkMode ? '#404040' : '#e5e5e5'}`,
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card border-card-border rounded-xl shadow-sm border p-4">
              <h2 className="text-sm font-semibold text-primary-text mb-3">Grade Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={gradeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#404040' : '#e5e5e5'} opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: isDarkMode ? '#a3a3a3' : '#737373' }} stroke={isDarkMode ? '#525252' : '#d4d4d4'} />
                  <YAxis tick={{ fontSize: 10, fill: isDarkMode ? '#a3a3a3' : '#737373' }} stroke={isDarkMode ? '#525252' : '#d4d4d4'} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#171717' : '#ffffff',
                      border: `1px solid ${isDarkMode ? '#404040' : '#e5e5e5'}`,
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill={primaryColor} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card border-card-border rounded-xl shadow-sm border">
              <div className="p-4 border-b border-card-border">
                <h2 className="text-sm font-semibold text-primary-text">Top Performers</h2>
              </div>
              <div className="p-4 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-card-border">
                      <TableHead className="text-xs text-secondary-text">Roll No</TableHead>
                      <TableHead className="text-xs text-secondary-text">Name</TableHead>
                      <TableHead className="text-xs text-secondary-text">Average</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.student.topPerformers.slice(0, 10).map((student) => (
                      <TableRow key={student.studentId} className="border-card-border">
                        <TableCell className="font-medium text-sm text-primary-text">{student.rollNumber}</TableCell>
                        <TableCell className="text-xs text-secondary-text">{student.name}</TableCell>
                        <TableCell>
                          <Badge className="text-[10px] bg-[var(--success-green)] hover:bg-[var(--success-green)]">
                            {student.average.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="bg-card border-card-border rounded-xl shadow-sm border">
              <div className="p-4 border-b border-card-border">
                <h2 className="text-sm font-semibold text-primary-text">At-Risk Students</h2>
              </div>
              <div className="p-4 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-card-border">
                      <TableHead className="text-xs text-secondary-text">Roll No</TableHead>
                      <TableHead className="text-xs text-secondary-text">Name</TableHead>
                      <TableHead className="text-xs text-secondary-text">Average</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.student.atRiskStudents.map((student) => (
                      <TableRow key={student.studentId} className="border-card-border">
                        <TableCell className="font-medium text-sm text-primary-text">{student.rollNumber}</TableCell>
                        <TableCell className="text-xs text-secondary-text">{student.name}</TableCell>
                        <TableCell>
                          <Badge variant="destructive" className="text-[10px]">
                            {student.average.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Assessment Analytics */}
        <TabsContent value="assessment" className="space-y-4">
          <div className="bg-card border-card-border rounded-xl shadow-sm border">
            <div className="p-4 border-b border-card-border">
              <h2 className="text-sm font-semibold text-primary-text">Assessment Difficulty Analysis</h2>
            </div>
            <div className="p-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-card-border">
                    <TableHead className="text-xs text-secondary-text">Assessment</TableHead>
                    <TableHead className="text-xs text-secondary-text">Type</TableHead>
                    <TableHead className="text-xs text-secondary-text">Difficulty</TableHead>
                    <TableHead className="text-xs text-secondary-text">Average Score</TableHead>
                    <TableHead className="text-xs text-secondary-text">Average %</TableHead>
                    <TableHead className="text-xs text-secondary-text">Students</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.assessment.map((assessment) => (
                    <TableRow key={assessment.assessmentId} className="border-card-border">
                      <TableCell className="font-medium text-sm text-primary-text">
                        {assessment.title}
                      </TableCell>
                      <TableCell className="text-xs text-secondary-text">
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
                            className="text-[10px]"
                          >
                            {assessment.difficulty.toUpperCase()}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-text">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-primary-text">
                        {assessment.averageScore !== null
                          ? assessment.averageScore.toFixed(1)
                          : 'N/A'}
                      </TableCell>
                      <TableCell className="text-xs text-primary-text">
                        {assessment.averagePercentage !== null
                          ? `${assessment.averagePercentage.toFixed(1)}%`
                          : 'N/A'}
                      </TableCell>
                      <TableCell className="text-xs text-primary-text">{assessment.totalStudents}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {data.assessment.length > 0 && (
            <div className="bg-card border-card-border rounded-xl shadow-sm border">
              <div className="p-4 border-b border-card-border">
                <h2 className="text-sm font-semibold text-primary-text">
                  Item Analysis - {data.assessment[0].title}
                </h2>
              </div>
              <div className="p-4 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-card-border">
                      <TableHead className="text-xs text-secondary-text">Question</TableHead>
                      <TableHead className="text-xs text-secondary-text">Average Marks</TableHead>
                      <TableHead className="text-xs text-secondary-text">Difficulty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.assessment[0].itemAnalysis.map((item) => (
                      <TableRow key={item.itemId} className="border-card-border">
                        <TableCell className="font-medium text-sm text-primary-text">
                          {item.questionNo}
                        </TableCell>
                        <TableCell className="text-xs text-primary-text">{item.averageMarks.toFixed(1)}</TableCell>
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
                              className="text-[10px]"
                            >
                              {item.difficulty.toUpperCase()}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-text">N/A</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsPage;
