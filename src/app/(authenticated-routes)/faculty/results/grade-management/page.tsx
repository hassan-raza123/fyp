'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  Calculator,
  Eye,
  Download,
  Lock,
  Unlock,
  Send,
  Edit,
  CheckCircle,
  AlertCircle,
  FileText,
  BarChart3,
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CourseOffering {
  courseOffering: {
    id: number;
    course: {
      id: number;
      code: string;
      name: string;
      creditHours: number;
    };
    semester: {
      id: number;
      name: string;
    };
  };
  grades: Array<{
    id: number;
    studentId: number;
    rollNumber: string;
    name: string;
    totalMarks: number;
    obtainedMarks: number;
    percentage: number;
    grade: string;
    gpaPoints: number;
    qualityPoints: number;
    status: string;
    calculatedAt: string;
  }>;
  statistics: {
    totalStudents: number;
    calculatedGrades: number;
    averagePercentage: number;
    gradeDistribution: Record<string, number>;
  };
}

const COLORS = [
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7300',
  '#00ff00',
  '#0088fe',
];

const GradeManagementPage = () => {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const primaryColorDark = isDarkMode ? 'var(--orange-dark)' : 'var(--blue-dark)';
  const iconBgColor = isDarkMode
    ? 'rgba(252, 153, 40, 0.15)'
    : 'rgba(38, 40, 149, 0.15)';

  const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>([]);
  const [selectedCourseOffering, setSelectedCourseOffering] = useState<
    number | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [showCalculateDialog, setShowCalculateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<any>(null);
  const [editPercentage, setEditPercentage] = useState(0);
  const [editGrade, setEditGrade] = useState('');
  const [editReason, setEditReason] = useState('');
  const [selectedGrades, setSelectedGrades] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/faculty/grades', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch grades');
      const result = await response.json();
      if (result.success) {
        setCourseOfferings(result.data);
      }
    } catch (error) {
      toast.error('Failed to load grades');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    if (!selectedCourseOffering) {
      toast.error('Please select a course offering');
      return;
    }

    setCalculating(true);
    try {
      const response = await fetch('/api/faculty/grades/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          courseOfferingId: selectedCourseOffering,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to calculate');
      }

      const result = await response.json();
      toast.success(result.message || 'Grades calculated successfully');
      setShowCalculateDialog(false);
      fetchGrades();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to calculate grades'
      );
      console.error(error);
    } finally {
      setCalculating(false);
    }
  };

  const handleEdit = (grade: any) => {
    setSelectedGrade(grade);
    setEditPercentage(grade.percentage);
    setEditGrade(grade.grade);
    setEditReason('');
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedGrade) return;

    try {
      const response = await fetch(`/api/faculty/grades/${selectedGrade.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          percentage: editPercentage,
          grade: editGrade,
          reason: editReason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update');
      }

      toast.success('Grade updated successfully');
      setShowEditDialog(false);
      fetchGrades();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update grade'
      );
      console.error(error);
    }
  };

  const handleBulkAction = async (action: 'submit' | 'lock') => {
    if (selectedGrades.size === 0) {
      toast.error('Please select at least one grade');
      return;
    }

    try {
      const response = await fetch('/api/faculty/grades/bulk-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          gradeIds: Array.from(selectedGrades),
          action,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to perform action');
      }

      toast.success(`Successfully ${action}ed ${selectedGrades.size} grade(s)`);
      setSelectedGrades(new Set());
      fetchGrades();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to perform action'
      );
      console.error(error);
    }
  };

  const handleExport = (
    courseOffering: CourseOffering,
    format: 'csv' | 'pdf' = 'csv'
  ) => {
    if (format === 'csv') {
      const csvRows: string[] = [];

      csvRows.push('Grade Report');
      csvRows.push(
        `Course: ${courseOffering.courseOffering.course.code} - ${courseOffering.courseOffering.course.name}`
      );
      csvRows.push(`Semester: ${courseOffering.courseOffering.semester.name}`);
      csvRows.push('');

      csvRows.push(
        'Roll Number,Name,Total Marks,Obtained Marks,Percentage,Grade,GPA Points,Quality Points,Status'
      );
      courseOffering.grades.forEach((grade) => {
        csvRows.push(
          `${grade.rollNumber},"${grade.name}",${grade.totalMarks},${
            grade.obtainedMarks
          },${grade.percentage.toFixed(2)},${grade.grade},${grade.gpaPoints},${
            grade.qualityPoints
          },${grade.status}`
        );
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `grades_${courseOffering.courseOffering.course.code}_${
          new Date().toISOString().split('T')[0]
        }.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Grades exported successfully');
    } else {
      // PDF export
      try {
        const doc = new jsPDF();
        let yPos = 20;

        // Title
        doc.setFontSize(18);
        doc.text('Grade Report', 14, yPos);
        yPos += 10;

        // Course Information
        doc.setFontSize(12);
        doc.text(
          `Course: ${courseOffering.courseOffering.course.code} - ${courseOffering.courseOffering.course.name}`,
          14,
          yPos
        );
        yPos += 7;
        doc.text(
          `Semester: ${courseOffering.courseOffering.semester.name}`,
          14,
          yPos
        );
        yPos += 7;
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, yPos);
        yPos += 15;

        // Statistics Summary
        doc.setFontSize(14);
        doc.text('Summary Statistics', 14, yPos);
        yPos += 8;

        const statsData = [
          [
            'Total Students',
            courseOffering.statistics.totalStudents.toString(),
          ],
          [
            'Calculated Grades',
            courseOffering.statistics.calculatedGrades.toString(),
          ],
          [
            'Average Percentage',
            `${courseOffering.statistics.averagePercentage.toFixed(1)}%`,
          ],
          [
            'Completion Rate',
            `${
              courseOffering.statistics.totalStudents > 0
                ? (
                    (courseOffering.statistics.calculatedGrades /
                      courseOffering.statistics.totalStudents) *
                    100
                  ).toFixed(1)
                : 0
            }%`,
          ],
        ];

        autoTable(doc, {
          startY: yPos,
          head: [['Metric', 'Value']],
          body: statsData,
          theme: 'striped',
          headStyles: { fillColor: [136, 132, 216] },
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;

        // Grade Distribution
        if (
          Object.keys(courseOffering.statistics.gradeDistribution).length > 0
        ) {
          doc.setFontSize(14);
          doc.text('Grade Distribution', 14, yPos);
          yPos += 8;

          const gradeDistData = Object.entries(
            courseOffering.statistics.gradeDistribution
          ).map(([grade, count]) => [grade, count.toString()]);

          autoTable(doc, {
            startY: yPos,
            head: [['Grade', 'Count']],
            body: gradeDistData,
            theme: 'striped',
            headStyles: { fillColor: [130, 202, 157] },
          });

          yPos = (doc as any).lastAutoTable.finalY + 15;
        }

        // Student Grades Table
        doc.addPage();
        yPos = 20;
        doc.setFontSize(14);
        doc.text('Student Grades', 14, yPos);
        yPos += 8;

        const gradesData = courseOffering.grades.map((grade) => [
          grade.rollNumber,
          grade.name,
          grade.totalMarks.toString(),
          grade.obtainedMarks.toFixed(1),
          `${grade.percentage.toFixed(1)}%`,
          grade.grade,
          grade.gpaPoints.toString(),
          grade.qualityPoints.toFixed(1),
          grade.status,
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [
            [
              'Roll No',
              'Name',
              'Total',
              'Obtained',
              'Percentage',
              'Grade',
              'GPA',
              'Quality Points',
              'Status',
            ],
          ],
          body: gradesData,
          theme: 'striped',
          headStyles: { fillColor: [136, 132, 216] },
          styles: { fontSize: 8 },
        });

        // Save PDF
        doc.save(
          `grades_${courseOffering.courseOffering.course.code}_${
            new Date().toISOString().split('T')[0]
          }.pdf`
        );
        toast.success('PDF exported successfully');
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast.error('Failed to generate PDF. Please try again.');
      }
    }
  };

  const toggleGradeSelection = (gradeId: number) => {
    const newSelected = new Set(selectedGrades);
    if (newSelected.has(gradeId)) {
      newSelected.delete(gradeId);
    } else {
      newSelected.add(gradeId);
    }
    setSelectedGrades(newSelected);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'final') {
      return (
        <Badge className="text-[10px] bg-[var(--gray-500)] text-white">
          <Lock className="w-3 h-3 mr-1" />
          Final
        </Badge>
      );
    } else if (status === 'superseded') {
      return (
        <Badge variant="secondary" className="text-[10px]">
          <AlertCircle className="w-3 h-3 mr-1" />
          Superseded
        </Badge>
      );
    } else {
      return (
        <Badge className="text-[10px] bg-[var(--success-green)] text-white">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    }
  };

  const selectedData = courseOfferings.find(
    (co) => co.courseOffering.id === selectedCourseOffering
  );

  // Prepare chart data
  const gradeDistributionData = selectedData
    ? Object.entries(selectedData.statistics.gradeDistribution).map(
        ([grade, count]) => ({
          name: grade,
          count,
        })
      )
    : [];

  if (loading && courseOfferings.length === 0) {
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
          <p className="text-xs text-secondary-text">Loading grades...</p>
        </div>
      </div>
    );
  }

  const btnStyle = (disabled?: boolean) => ({
    backgroundColor: iconBgColor,
    color: primaryColor,
    opacity: disabled ? 0.6 : 1,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-primary-text">Grade Management</h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Calculate, review, and manage student grades
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowCalculateDialog(true)}
            className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 inline-flex items-center gap-1.5"
            style={btnStyle()}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = iconBgColor;
            }}
          >
            <Calculator className="w-3.5 h-3.5" />
            Calculate Grades
          </button>
          {selectedGrades.size > 0 && (
            <>
              <button
                onClick={() => handleBulkAction('submit')}
                className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 inline-flex items-center gap-1.5"
                style={btnStyle()}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = iconBgColor;
                }}
              >
                <Send className="w-3.5 h-3.5" />
                Submit ({selectedGrades.size})
              </button>
              <button
                onClick={() => handleBulkAction('lock')}
                className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 inline-flex items-center gap-1.5"
                style={btnStyle()}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = iconBgColor;
                }}
              >
                <Lock className="w-3.5 h-3.5" />
                Lock ({selectedGrades.size})
              </button>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="review" className="w-full">
        <TabsList className="bg-card border border-card-border p-1 rounded-lg">
          <TabsTrigger value="review" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-white">Grade Review</TabsTrigger>
          <TabsTrigger value="statistics" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-white">Statistics</TabsTrigger>
          <TabsTrigger value="reports" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-white">Grade Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="space-y-4">
          {/* Course Offering Selection */}
          <div className="bg-card border-card-border rounded-xl shadow-sm border p-4">
            <h2 className="text-sm font-semibold text-primary-text mb-3">Select Course Offering</h2>
            <Select
              value={selectedCourseOffering?.toString() || ''}
              onValueChange={(value) =>
                setSelectedCourseOffering(parseInt(value))
              }
            >
              <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text w-full max-w-md">
                <SelectValue placeholder="Select a course offering" />
              </SelectTrigger>
              <SelectContent className="bg-card border-card-border">
                {courseOfferings.map((co) => (
                  <SelectItem
                    key={co.courseOffering.id}
                    value={co.courseOffering.id.toString()}
                    className="text-primary-text hover:bg-card/50 text-xs"
                  >
                    {co.courseOffering.course.code} - {co.courseOffering.course.name} (
                    {co.courseOffering.semester.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedData && (
            <div className="space-y-4">
              {/* Statistics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card border-card-border rounded-xl p-4 shadow-sm border">
                  <p className="text-xs font-medium text-secondary-text">Total Students</p>
                  <p className="text-lg font-bold mt-1 text-primary-text">{selectedData.statistics.totalStudents}</p>
                </div>
                <div className="bg-card border-card-border rounded-xl p-4 shadow-sm border">
                  <p className="text-xs font-medium text-secondary-text">Calculated Grades</p>
                  <p className="text-lg font-bold mt-1 text-primary-text">{selectedData.statistics.calculatedGrades}</p>
                </div>
                <div className="bg-card border-card-border rounded-xl p-4 shadow-sm border">
                  <p className="text-xs font-medium text-secondary-text">Average %</p>
                  <p className="text-lg font-bold mt-1 text-primary-text">{selectedData.statistics.averagePercentage.toFixed(1)}%</p>
                </div>
                <div className="bg-card border-card-border rounded-xl p-4 shadow-sm border">
                  <p className="text-xs font-medium text-secondary-text">Completion Rate</p>
                  <p className="text-lg font-bold mt-1 text-primary-text">
                    {selectedData.statistics.totalStudents > 0
                      ? (
                          (selectedData.statistics.calculatedGrades /
                            selectedData.statistics.totalStudents) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </p>
                </div>
              </div>

              {/* Grades Table */}
              <div className="bg-card border-card-border rounded-xl shadow-sm border">
                <div className="p-4 border-b border-card-border flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-primary-text">Student Grades</h2>
                    <p className="text-xs text-secondary-text mt-0.5">
                      {selectedData.courseOffering.course.code} - {selectedData.courseOffering.course.name} (
                      {selectedData.courseOffering.semester.name})
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExport(selectedData, 'csv')}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 inline-flex items-center gap-1.5 border border-card-border text-primary-text hover:bg-[var(--hover-bg)]"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export CSV
                    </button>
                    <button
                      onClick={() => handleExport(selectedData, 'pdf')}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 inline-flex items-center gap-1.5 border border-card-border text-primary-text hover:bg-[var(--hover-bg)]"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export PDF
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <input
                            type="checkbox"
                            className="rounded border-card-border"
                            checked={
                              selectedData.grades.length > 0 &&
                              selectedGrades.size === selectedData.grades.length
                            }
                            onChange={() => {
                              if (selectedGrades.size === selectedData.grades.length) {
                                setSelectedGrades(new Set());
                              } else {
                                setSelectedGrades(new Set(selectedData.grades.map((g) => g.id)));
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-primary-text">Roll No</TableHead>
                        <TableHead className="text-xs font-semibold text-primary-text">Name</TableHead>
                        <TableHead className="text-xs font-semibold text-primary-text">Total</TableHead>
                        <TableHead className="text-xs font-semibold text-primary-text">Obtained</TableHead>
                        <TableHead className="text-xs font-semibold text-primary-text">%</TableHead>
                        <TableHead className="text-xs font-semibold text-primary-text">Grade</TableHead>
                        <TableHead className="text-xs font-semibold text-primary-text">GPA</TableHead>
                        <TableHead className="text-xs font-semibold text-primary-text">QP</TableHead>
                        <TableHead className="text-xs font-semibold text-primary-text">Status</TableHead>
                        <TableHead className="text-xs font-semibold text-primary-text">Calculated</TableHead>
                        <TableHead className="text-xs font-semibold text-primary-text">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedData.grades.map((grade) => (
                        <TableRow key={grade.id} className="hover:bg-[var(--hover-bg)] transition-colors">
                          <TableCell>
                            <input
                              type="checkbox"
                              className="rounded border-card-border"
                              checked={selectedGrades.has(grade.id)}
                              onChange={() => toggleGradeSelection(grade.id)}
                            />
                          </TableCell>
                          <TableCell className="text-xs font-medium text-primary-text">{grade.rollNumber}</TableCell>
                          <TableCell className="text-xs text-primary-text">{grade.name}</TableCell>
                          <TableCell className="text-xs text-primary-text">{grade.totalMarks}</TableCell>
                          <TableCell className="text-xs text-primary-text">{grade.obtainedMarks.toFixed(1)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={grade.percentage} className="w-16" />
                              <span className="text-xs text-primary-text">{grade.percentage.toFixed(1)}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">{grade.grade}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-primary-text">{grade.gpaPoints}</TableCell>
                          <TableCell className="text-xs text-primary-text">{grade.qualityPoints.toFixed(1)}</TableCell>
                          <TableCell>{getStatusBadge(grade.status)}</TableCell>
                          <TableCell className="text-xs text-secondary-text">{format(new Date(grade.calculatedAt), 'PPp')}</TableCell>
                          <TableCell>
                            <button
                              onClick={() => handleEdit(grade)}
                              disabled={grade.status === 'final'}
                              className="px-2 py-1 rounded-md text-xs font-medium h-7 inline-flex items-center gap-1 disabled:opacity-50"
                              style={{ backgroundColor: iconBgColor, color: primaryColor }}
                              onMouseEnter={(e) => {
                                if (grade.status !== 'final') e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = iconBgColor;
                              }}
                            >
                              <Edit className="w-3.5 h-3.5" />
                              Edit
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {!selectedCourseOffering && (
            <div className="bg-card border-card-border rounded-xl shadow-sm border py-12 text-center">
              <BarChart3 className="w-10 h-10 mx-auto text-muted-text" />
              <p className="text-xs text-secondary-text mt-2">Select a course offering to view grades</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          {selectedData && (
            <div className="space-y-4">
              <div className="bg-card border-card-border rounded-xl shadow-sm border p-4">
                <h2 className="text-sm font-semibold text-primary-text mb-3">Grade Distribution</h2>
                {gradeDistributionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={gradeDistributionData}>
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
                ) : (
                  <p className="text-xs text-muted-text text-center py-8">No grade distribution data available</p>
                )}
              </div>

              <div className="bg-card border-card-border rounded-xl shadow-sm border p-4">
                <h2 className="text-sm font-semibold text-primary-text mb-3">Grade Statistics</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-secondary-text">Total Students</p>
                    <p className="text-lg font-bold text-primary-text">{selectedData.statistics.totalStudents}</p>
                  </div>
                  <div>
                    <p className="text-xs text-secondary-text">Calculated Grades</p>
                    <p className="text-lg font-bold text-primary-text">{selectedData.statistics.calculatedGrades}</p>
                  </div>
                  <div>
                    <p className="text-xs text-secondary-text">Average Percentage</p>
                    <p className="text-lg font-bold text-primary-text">{selectedData.statistics.averagePercentage.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-secondary-text">Completion Rate</p>
                    <p className="text-lg font-bold text-primary-text">
                      {selectedData.statistics.totalStudents > 0
                        ? (
                            (selectedData.statistics.calculatedGrades /
                              selectedData.statistics.totalStudents) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!selectedCourseOffering && (
            <div className="bg-card border-card-border rounded-xl shadow-sm border py-12 text-center">
              <BarChart3 className="w-10 h-10 mx-auto text-muted-text" />
              <p className="text-xs text-secondary-text mt-2">Select a course offering to view statistics</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          {selectedData && (
            <div className="space-y-4">
              <div className="bg-card border-card-border rounded-xl shadow-sm border p-4">
                <h2 className="text-sm font-semibold text-primary-text">Section-wise Grade Report</h2>
                <p className="text-xs text-secondary-text mt-0.5">
                  {selectedData.courseOffering.course.code} - {selectedData.courseOffering.course.name}
                </p>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-xs text-secondary-text">Course</p>
                    <p className="text-sm font-semibold text-primary-text">
                      {selectedData.courseOffering.course.code} - {selectedData.courseOffering.course.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-secondary-text">Semester</p>
                    <p className="text-sm font-semibold text-primary-text">{selectedData.courseOffering.semester.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-secondary-text">Credit Hours</p>
                    <p className="text-sm font-semibold text-primary-text">{selectedData.courseOffering.course.creditHours}</p>
                  </div>
                  <div>
                    <p className="text-xs text-secondary-text">Total Students</p>
                    <p className="text-sm font-semibold text-primary-text">{selectedData.statistics.totalStudents}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => handleExport(selectedData, 'pdf')}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 inline-flex items-center gap-1.5"
                    style={{ backgroundColor: primaryColor, color: '#fff' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = primaryColorDark; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = primaryColor; }}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Generate Full Report (PDF)
                  </button>
                  <button
                    onClick={() => handleExport(selectedData, 'csv')}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 inline-flex items-center gap-1.5 border border-card-border text-primary-text hover:bg-[var(--hover-bg)]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export as CSV
                  </button>
                </div>
              </div>

              <div className="bg-card border-card-border rounded-xl shadow-sm border">
                <div className="p-4 border-b border-card-border">
                  <h2 className="text-sm font-semibold text-primary-text">Student Grade Sheets</h2>
                  <p className="text-xs text-secondary-text mt-0.5">Detailed grade information for all students</p>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-semibold text-primary-text">Roll No</TableHead>
                        <TableHead className="text-xs font-semibold text-primary-text">Name</TableHead>
                        <TableHead className="text-xs font-semibold text-primary-text">Total</TableHead>
                        <TableHead className="text-xs font-semibold text-primary-text">Obtained</TableHead>
                        <TableHead className="text-xs font-semibold text-primary-text">%</TableHead>
                        <TableHead className="text-xs font-semibold text-primary-text">Grade</TableHead>
                        <TableHead className="text-xs font-semibold text-primary-text">GPA</TableHead>
                        <TableHead className="text-xs font-semibold text-primary-text">QP</TableHead>
                        <TableHead className="text-xs font-semibold text-primary-text">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedData.grades.map((grade) => (
                        <TableRow key={grade.id} className="hover:bg-[var(--hover-bg)]">
                          <TableCell className="text-xs font-medium text-primary-text">{grade.rollNumber}</TableCell>
                          <TableCell className="text-xs text-primary-text">{grade.name}</TableCell>
                          <TableCell className="text-xs text-primary-text">{grade.totalMarks}</TableCell>
                          <TableCell className="text-xs text-primary-text">{grade.obtainedMarks.toFixed(1)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={grade.percentage} className="w-14" />
                              <span className="text-xs text-primary-text">{grade.percentage.toFixed(1)}%</span>
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px]">{grade.grade}</Badge></TableCell>
                          <TableCell className="text-xs text-primary-text">{grade.gpaPoints}</TableCell>
                          <TableCell className="text-xs text-primary-text">{grade.qualityPoints.toFixed(1)}</TableCell>
                          <TableCell>{getStatusBadge(grade.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="bg-card border-card-border rounded-xl shadow-sm border p-4">
                <h2 className="text-sm font-semibold text-primary-text mb-3">Grade Distribution Report</h2>
                {gradeDistributionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={gradeDistributionData}>
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
                ) : (
                  <p className="text-xs text-muted-text text-center py-8">No grade distribution data available</p>
                )}
              </div>
            </div>
          )}

          {!selectedCourseOffering && (
            <div className="bg-card border-card-border rounded-xl shadow-sm border py-12 text-center">
              <FileText className="w-10 h-10 mx-auto text-muted-text" />
              <p className="text-xs text-secondary-text mt-2">Select a course offering to view grade reports</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Calculate Dialog */}
      <Dialog open={showCalculateDialog} onOpenChange={setShowCalculateDialog}>
        <DialogContent className="bg-card border-card-border text-primary-text max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-primary-text">Calculate Grades</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text">
              Calculate final grades for a course offering based on assessment results
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-xs text-secondary-text">Course Offering</Label>
              <Select
                value={selectedCourseOffering?.toString() || ''}
                onValueChange={(value) =>
                  setSelectedCourseOffering(parseInt(value))
                }
              >
                <SelectTrigger className="h-8 text-xs mt-1 bg-card border-card-border text-primary-text">
                  <SelectValue placeholder="Select course offering" />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  {courseOfferings.map((co) => (
                    <SelectItem
                      key={co.courseOffering.id}
                      value={co.courseOffering.id.toString()}
                      className="text-primary-text hover:bg-card/50 text-xs"
                    >
                      {co.courseOffering.course.code} - {co.courseOffering.semester.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div
              className="p-3 rounded-lg text-xs text-primary-text"
              style={{
                backgroundColor: isDarkMode ? 'rgba(252, 153, 40, 0.1)' : 'rgba(38, 40, 149, 0.08)',
                border: `1px solid ${isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.15)'}`,
              }}
            >
              Grades will be calculated based on weighted average of all assessments. Grade scale from the program will be applied.
            </div>
          </div>
          <DialogFooter className="mt-4 gap-2">
            <button
              type="button"
              onClick={() => setShowCalculateDialog(false)}
              disabled={calculating}
              className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border bg-transparent text-primary-text hover:bg-[var(--hover-bg)] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCalculate}
              disabled={calculating || !selectedCourseOffering}
              className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 disabled:opacity-50"
              style={{ backgroundColor: primaryColor, color: '#fff' }}
              onMouseEnter={(e) => {
                if (!calculating && selectedCourseOffering) e.currentTarget.style.backgroundColor = primaryColorDark;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = primaryColor;
              }}
            >
              {calculating ? 'Calculating...' : 'Calculate Grades'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Grade Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-card border-card-border text-primary-text max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-primary-text">Edit Grade</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text">
              Manually adjust grade for {selectedGrade?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="percentage" className="text-xs text-secondary-text">Percentage (%)</Label>
              <Input
                id="percentage"
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={editPercentage}
                onChange={(e) =>
                  setEditPercentage(parseFloat(e.target.value) || 0)
                }
                className="h-8 text-xs mt-1 bg-card border-card-border text-primary-text"
              />
            </div>
            <div>
              <Label htmlFor="grade" className="text-xs text-secondary-text">Grade</Label>
              <Input
                id="grade"
                value={editGrade}
                onChange={(e) => setEditGrade(e.target.value.toUpperCase())}
                placeholder="A+, A, B+, etc."
                className="h-8 text-xs mt-1 bg-card border-card-border text-primary-text placeholder:text-secondary-text"
              />
            </div>
            <div>
              <Label htmlFor="reason" className="text-xs text-secondary-text">Reason for Adjustment (Optional)</Label>
              <Input
                id="reason"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="Reason for manual grade adjustment"
                className="h-8 text-xs mt-1 bg-card border-card-border text-primary-text placeholder:text-secondary-text"
              />
            </div>
          </div>
          <DialogFooter className="mt-4 gap-2">
            <button
              type="button"
              onClick={() => setShowEditDialog(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border bg-transparent text-primary-text hover:bg-[var(--hover-bg)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              className="px-3 py-1.5 rounded-lg text-xs font-medium h-8"
              style={{ backgroundColor: primaryColor, color: '#fff' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = primaryColorDark; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = primaryColor; }}
            >
              Save Changes
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GradeManagementPage;
