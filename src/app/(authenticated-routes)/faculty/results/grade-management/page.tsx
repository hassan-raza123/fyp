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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
        <Badge variant="default" className="bg-gray-600">
          <Lock className="w-3 h-3 mr-1" />
          Final
        </Badge>
      );
    } else if (status === 'superseded') {
      return (
        <Badge variant="secondary">
          <AlertCircle className="w-3 h-3 mr-1" />
          Superseded
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline">
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Grade Management</h1>
          <p className="text-muted-foreground">
            Calculate, review, and manage student grades
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowCalculateDialog(true)}
          >
            <Calculator className="w-4 h-4 mr-2" />
            Calculate Grades
          </Button>
          {selectedGrades.size > 0 && (
            <>
              <Button
                variant="outline"
                onClick={() => handleBulkAction('submit')}
              >
                <Send className="w-4 h-4 mr-2" />
                Submit ({selectedGrades.size})
              </Button>
              <Button
                variant="outline"
                onClick={() => handleBulkAction('lock')}
              >
                <Lock className="w-4 h-4 mr-2" />
                Lock ({selectedGrades.size})
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="review" className="w-full">
        <TabsList>
          <TabsTrigger value="review">Grade Review</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="reports">Grade Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="space-y-4">
          {/* Course Offering Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Course Offering</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedCourseOffering?.toString() || ''}
                onValueChange={(value) =>
                  setSelectedCourseOffering(parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a course offering" />
                </SelectTrigger>
                <SelectContent>
                  {courseOfferings.map((co) => (
                    <SelectItem
                      key={co.courseOffering.id}
                      value={co.courseOffering.id.toString()}
                    >
                      {co.courseOffering.course.code} -{' '}
                      {co.courseOffering.course.name} (
                      {co.courseOffering.semester.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedData && (
            <div className="space-y-4">
              {/* Statistics Cards */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Students</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {selectedData.statistics.totalStudents}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Calculated Grades</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {selectedData.statistics.calculatedGrades}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Average %</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {selectedData.statistics.averagePercentage.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Completion Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {selectedData.statistics.totalStudents > 0
                        ? (
                            (selectedData.statistics.calculatedGrades /
                              selectedData.statistics.totalStudents) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Grades Table */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Student Grades</CardTitle>
                      <CardDescription>
                        {selectedData.courseOffering.course.code} -{' '}
                        {selectedData.courseOffering.course.name} (
                        {selectedData.courseOffering.semester.name})
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleExport(selectedData, 'csv')}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleExport(selectedData, 'pdf')}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export PDF
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <input
                              type="checkbox"
                              checked={
                                selectedData.grades.length > 0 &&
                                selectedGrades.size ===
                                  selectedData.grades.length
                              }
                              onChange={() => {
                                if (
                                  selectedGrades.size ===
                                  selectedData.grades.length
                                ) {
                                  setSelectedGrades(new Set());
                                } else {
                                  setSelectedGrades(
                                    new Set(
                                      selectedData.grades.map((g) => g.id)
                                    )
                                  );
                                }
                              }}
                              className="w-4 h-4"
                            />
                          </TableHead>
                          <TableHead>Roll No</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Total Marks</TableHead>
                          <TableHead>Obtained</TableHead>
                          <TableHead>Percentage</TableHead>
                          <TableHead>Grade</TableHead>
                          <TableHead>GPA Points</TableHead>
                          <TableHead>Quality Points</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Calculated At</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedData.grades.map((grade) => (
                          <TableRow key={grade.id}>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={selectedGrades.has(grade.id)}
                                onChange={() => toggleGradeSelection(grade.id)}
                                className="w-4 h-4"
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {grade.rollNumber}
                            </TableCell>
                            <TableCell>{grade.name}</TableCell>
                            <TableCell>{grade.totalMarks}</TableCell>
                            <TableCell>
                              {grade.obtainedMarks.toFixed(1)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={grade.percentage}
                                  className="w-20"
                                />
                                <span>{grade.percentage.toFixed(1)}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{grade.grade}</Badge>
                            </TableCell>
                            <TableCell>{grade.gpaPoints}</TableCell>
                            <TableCell>
                              {grade.qualityPoints.toFixed(1)}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(grade.status)}
                            </TableCell>
                            <TableCell>
                              {format(new Date(grade.calculatedAt), 'PPp')}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(grade)}
                                  disabled={grade.status === 'final'}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {!selectedCourseOffering && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Select a course offering to view grades
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          {selectedData && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Grade Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {gradeDistributionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={gradeDistributionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No grade distribution data available
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Grade Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Students
                      </p>
                      <p className="text-2xl font-bold">
                        {selectedData.statistics.totalStudents}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Calculated Grades
                      </p>
                      <p className="text-2xl font-bold">
                        {selectedData.statistics.calculatedGrades}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Average Percentage
                      </p>
                      <p className="text-2xl font-bold">
                        {selectedData.statistics.averagePercentage.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Completion Rate
                      </p>
                      <p className="text-2xl font-bold">
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
                </CardContent>
              </Card>
            </div>
          )}

          {!selectedCourseOffering && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Select a course offering to view statistics
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          {selectedData && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Section-wise Grade Report</CardTitle>
                  <CardDescription>
                    Comprehensive grade report for{' '}
                    {selectedData.courseOffering.course.code} -{' '}
                    {selectedData.courseOffering.course.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Course</p>
                        <p className="text-lg font-semibold">
                          {selectedData.courseOffering.course.code} -{' '}
                          {selectedData.courseOffering.course.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Semester
                        </p>
                        <p className="text-lg font-semibold">
                          {selectedData.courseOffering.semester.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Credit Hours
                        </p>
                        <p className="text-lg font-semibold">
                          {selectedData.courseOffering.course.creditHours}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Total Students
                        </p>
                        <p className="text-lg font-semibold">
                          {selectedData.statistics.totalStudents}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="default"
                        onClick={() => handleExport(selectedData, 'pdf')}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Generate Full Report (PDF)
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleExport(selectedData, 'csv')}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export as CSV
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Student Grade Sheets</CardTitle>
                  <CardDescription>
                    Detailed grade information for all students
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Roll No</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Total Marks</TableHead>
                          <TableHead>Obtained</TableHead>
                          <TableHead>Percentage</TableHead>
                          <TableHead>Grade</TableHead>
                          <TableHead>GPA Points</TableHead>
                          <TableHead>Quality Points</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedData.grades.map((grade) => (
                          <TableRow key={grade.id}>
                            <TableCell className="font-medium">
                              {grade.rollNumber}
                            </TableCell>
                            <TableCell>{grade.name}</TableCell>
                            <TableCell>{grade.totalMarks}</TableCell>
                            <TableCell>
                              {grade.obtainedMarks.toFixed(1)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={grade.percentage}
                                  className="w-16"
                                />
                                <span>{grade.percentage.toFixed(1)}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{grade.grade}</Badge>
                            </TableCell>
                            <TableCell>{grade.gpaPoints}</TableCell>
                            <TableCell>
                              {grade.qualityPoints.toFixed(1)}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(grade.status)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Grade Distribution Report</CardTitle>
                  <CardDescription>
                    Visual representation of grade distribution
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {gradeDistributionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={gradeDistributionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No grade distribution data available
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {!selectedCourseOffering && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Select a course offering to view grade reports
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Calculate Dialog */}
      <Dialog open={showCalculateDialog} onOpenChange={setShowCalculateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Calculate Grades</DialogTitle>
            <DialogDescription>
              Calculate final grades for a course offering based on assessment
              results
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Course Offering</Label>
              <Select
                value={selectedCourseOffering?.toString() || ''}
                onValueChange={(value) =>
                  setSelectedCourseOffering(parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select course offering" />
                </SelectTrigger>
                <SelectContent>
                  {courseOfferings.map((co) => (
                    <SelectItem
                      key={co.courseOffering.id}
                      value={co.courseOffering.id.toString()}
                    >
                      {co.courseOffering.course.code} -{' '}
                      {co.courseOffering.semester.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
              <p>
                Grades will be calculated based on weighted average of all
                assessments. Grade scale from the program will be applied.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCalculateDialog(false)}
              disabled={calculating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCalculate}
              disabled={calculating || !selectedCourseOffering}
            >
              {calculating ? 'Calculating...' : 'Calculate Grades'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Grade Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Grade</DialogTitle>
            <DialogDescription>
              Manually adjust grade for {selectedGrade?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="percentage">Percentage (%)</Label>
              <Input
                id="percentage"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={editPercentage}
                onChange={(e) =>
                  setEditPercentage(parseFloat(e.target.value) || 0)
                }
              />
            </div>
            <div>
              <Label htmlFor="grade">Grade</Label>
              <Input
                id="grade"
                value={editGrade}
                onChange={(e) => setEditGrade(e.target.value.toUpperCase())}
                placeholder="A+, A, B+, etc."
              />
            </div>
            <div>
              <Label htmlFor="reason">Reason for Adjustment (Optional)</Label>
              <Input
                id="reason"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="Reason for manual grade adjustment"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GradeManagementPage;
