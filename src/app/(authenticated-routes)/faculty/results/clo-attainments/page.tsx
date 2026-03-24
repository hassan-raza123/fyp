'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  BarChart3,
  Calculator,
  Eye,
  TrendingUp,
  Target,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { format } from 'date-fns';
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
} from 'recharts';

interface Course {
  course: {
    id: number;
    code: string;
    name: string;
  };
  totalCLOs: number;
  attainedCLOs: number;
  averageAttainment: number;
  clos: Array<{
    id: number;
    code: string;
    description: string;
    bloomLevel: string;
    attainmentPercent: number | null;
    threshold: number;
    status: 'attained' | 'not_attained' | 'not_calculated';
    calculatedAt: string | null;
  }>;
  courseOfferings: Array<{
    id: number;
    semester: {
      id: number;
      name: string;
    };
    sections: Array<{
  id: number;
  name: string;
    }>;
  }>;
}

interface CLODetails {
  clo: {
    id: number;
    code: string;
    description: string;
    bloomLevel: string;
    course: {
      id: number;
      code: string;
      name: string;
    };
  };
  attainments: Array<{
    id: number;
    courseOfferingId: number;
    semester: string;
    sections: Array<{ id: number; name: string }>;
    totalStudents: number;
    studentsAchieved: number;
    threshold: number;
    attainmentPercent: number;
    status: string;
    calculatedAt: string;
  }>;
  assessmentBreakdown: Array<{
    assessmentId: number;
    title: string;
    type: string;
    semester: string;
    totalMarks: number;
    itemCount: number;
    items: Array<{
      id: number;
      questionNo: string;
      description: string;
      marks: number;
    }>;
  }>;
  studentBreakdown: Array<{
    studentId: number;
    rollNumber: string;
    name: string;
    obtainedMarks: number;
    totalMarks: number;
    percentage: number;
    achieved: boolean;
    itemsCount: number;
  }>;
}

const CLOAttainmentsPage = () => {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = mounted && resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode
    ? 'rgba(252, 153, 40, 0.15)'
    : 'rgba(38, 40, 149, 0.15)';

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [selectedCLO, setSelectedCLO] = useState<number | null>(null);
  const [cloDetails, setCloDetails] = useState<CLODetails | null>(null);
  const [showCalculateDialog, setShowCalculateDialog] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [selectedCourseOffering, setSelectedCourseOffering] = useState<number | null>(null);
  const [threshold, setThreshold] = useState(60);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCLO) {
      fetchCLODetails(selectedCLO);
    } else {
      setCloDetails(null);
    }
  }, [selectedCLO, selectedCourseOffering]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/faculty/clo-attainments', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch courses');
      const result = await response.json();
      if (result.success) {
        setCourses(result.data);
      }
    } catch (error) {
      toast.error('Failed to load CLO attainments');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCLODetails = async (cloId: number) => {
    setLoading(true);
    try {
      const url = selectedCourseOffering
        ? `/api/faculty/clo-attainments/${cloId}/details?courseOfferingId=${selectedCourseOffering}`
        : `/api/faculty/clo-attainments/${cloId}/details`;
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch CLO details');
      const result = await response.json();
      if (result.success) {
        setCloDetails(result.data);
      }
    } catch (error) {
      toast.error('Failed to load CLO details');
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
      const response = await fetch('/api/faculty/clo-attainments/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          courseOfferingId: selectedCourseOffering,
          threshold: threshold,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to calculate');
      }

      const result = await response.json();
      toast.success(result.message || 'CLO attainments calculated successfully');
      setShowCalculateDialog(false);
      fetchCourses();
      if (selectedCLO) {
        fetchCLODetails(selectedCLO);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to calculate CLO attainments'
      );
      console.error(error);
    } finally {
      setCalculating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'attained') {
      return (
        <Badge variant="default" className="bg-green-600">
          <CheckCircle className="w-3 h-3 mr-1" />
          Attained
        </Badge>
      );
    } else if (status === 'not_attained') {
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Not Attained
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline">
          <AlertCircle className="w-3 h-3 mr-1" />
          Not Calculated
        </Badge>
      );
    }
  };

  const selectedCourseData = courses.find((c) => c.course.id === selectedCourse);

  // Prepare chart data
  const chartData = selectedCourseData
    ? selectedCourseData.clos.map((clo) => ({
        name: clo.code,
        attainment: clo.attainmentPercent || 0,
        threshold: clo.threshold,
      }))
    : [];

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

  if (!mounted) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: iconBgColor }}
          >
            <Target className="h-5 w-5" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary-text">CLO Attainments</h1>
            <p className="text-xs text-secondary-text mt-0.5">
              Calculate and analyze Course Learning Outcomes attainment
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowCalculateDialog(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 inline-flex items-center gap-1.5 border border-card-border text-primary-text hover:bg-[var(--hover-bg)]"
            style={{ backgroundColor: iconBgColor, color: primaryColor }}
          >
            <Calculator className="w-3.5 h-3.5" />
            Calculate Attainments
          </button>
          <button
            type="button"
            onClick={fetchCourses}
            className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 inline-flex items-center gap-1.5 border border-card-border text-primary-text hover:opacity-90"
            style={{ backgroundColor: iconBgColor, color: primaryColor }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="bg-card border border-card-border p-1 rounded-lg">
          <TabsTrigger value="dashboard" className="text-xs data-[state=active]:bg-[var(--hover-bg)] data-[state=active]:text-primary-text rounded-md">Dashboard</TabsTrigger>
          <TabsTrigger value="details" disabled={!selectedCLO} className="text-xs data-[state=active]:bg-[var(--hover-bg)] data-[state=active]:text-primary-text rounded-md disabled:opacity-50">CLO Details</TabsTrigger>
          <TabsTrigger value="analysis" disabled={!selectedCourse} className="text-xs data-[state=active]:bg-[var(--hover-bg)] data-[state=active]:text-primary-text rounded-md disabled:opacity-50">Analysis</TabsTrigger>
          <TabsTrigger value="plo-mappings" disabled={!selectedCourse} className="text-xs data-[state=active]:bg-[var(--hover-bg)] data-[state=active]:text-primary-text rounded-md disabled:opacity-50">CLO-PLO Mappings</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          {/* Course Selection */}
          <div className="rounded-lg border border-card-border bg-card overflow-hidden">
            <div className="p-4 border-b border-card-border">
              <h2 className="text-sm font-semibold text-primary-text">Select Course</h2>
            </div>
            <div className="p-4">
              <Select
                value={selectedCourse?.toString() || ''}
                onValueChange={(value) => {
                  setSelectedCourse(value ? parseInt(value) : null);
                  setSelectedCLO(null);
                }}
              >
                <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  {courses.map((course) => (
                    <SelectItem
                      key={course.course.id}
                      value={course.course.id.toString()}
                      className="text-primary-text hover:bg-card/50"
                    >
                      {course.course.code} - {course.course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedCourseData && (
            <div className="space-y-4">
              {/* Overall Statistics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-lg border border-card-border bg-card p-4">
                  <p className="text-xs font-medium text-secondary-text mb-1">Total CLOs</p>
                  <div className="text-lg font-bold text-primary-text">{selectedCourseData.totalCLOs}</div>
                </div>
                <div className="rounded-lg border border-card-border bg-card p-4">
                  <p className="text-xs font-medium text-secondary-text mb-1">Attained CLOs</p>
                  <div className="text-lg font-bold text-[var(--success-green)]">{selectedCourseData.attainedCLOs}</div>
                </div>
                <div className="rounded-lg border border-card-border bg-card p-4">
                  <p className="text-xs font-medium text-secondary-text mb-1">Average Attainment</p>
                  <div className="text-lg font-bold text-primary-text">{selectedCourseData.averageAttainment.toFixed(1)}%</div>
                </div>
                <div className="rounded-lg border border-card-border bg-card p-4">
                  <p className="text-xs font-medium text-secondary-text mb-1">Attainment Rate</p>
                  <div className="text-lg font-bold text-primary-text">
                    {selectedCourseData.totalCLOs > 0
                      ? ((selectedCourseData.attainedCLOs / selectedCourseData.totalCLOs) * 100).toFixed(1)
                      : 0}%
                  </div>
                </div>
              </div>

              {/* CLO Attainment Chart */}
              <div className="rounded-lg border border-card-border bg-card overflow-hidden">
                <div className="p-4 border-b border-card-border">
                  <h3 className="text-sm font-semibold text-primary-text">CLO Attainment Overview</h3>
                </div>
                <div className="p-4">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip
                          formatter={(value: number) => `${value.toFixed(1)}%`}
                        />
                        <Bar dataKey="attainment" fill="#8884d8" />
                        <Bar dataKey="threshold" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-secondary-text text-center py-8 text-xs">
                      No CLO attainment data available
                    </p>
                  )}
                </div>
              </div>

              {/* CLOs List */}
              <div className="rounded-lg border border-card-border bg-card overflow-hidden">
                <div className="p-4 border-b border-card-border">
                  <h3 className="text-sm font-semibold text-primary-text">CLOs List</h3>
                  <p className="text-xs text-secondary-text mt-0.5">Click on a CLO to view detailed information</p>
                </div>
                <div className="p-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>CLO Code</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Bloom's Level</TableHead>
                        <TableHead>Attainment %</TableHead>
                        <TableHead>Threshold</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Calculated</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedCourseData.clos.map((clo) => (
                        <TableRow
                          key={clo.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => setSelectedCLO(clo.id)}
                        >
                          <TableCell className="font-medium">{clo.code}</TableCell>
                          <TableCell className="max-w-md truncate">
                            {clo.description}
                          </TableCell>
                          <TableCell>{clo.bloomLevel}</TableCell>
                          <TableCell>
                            {clo.attainmentPercent !== null ? (
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={clo.attainmentPercent}
                                  className="w-20"
                                />
                                <span>{clo.attainmentPercent.toFixed(1)}%</span>
                              </div>
                            ) : (
                              <span className="text-secondary-text">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>{clo.threshold}%</TableCell>
                          <TableCell>{getStatusBadge(clo.status)}</TableCell>
                          <TableCell>
                            {clo.calculatedAt
                              ? format(new Date(clo.calculatedAt), 'PPp')
                              : 'Never'}
                          </TableCell>
                          <TableCell>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCLO(clo.id);
                              }}
                              className="p-2 rounded-lg text-xs font-medium h-7 inline-flex items-center justify-center hover:bg-[var(--hover-bg)]"
                              style={{ backgroundColor: iconBgColor, color: primaryColor }}
                            >
                              <Eye className="w-3.5 h-3.5" />
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

          {!selectedCourse && (
            <div className="rounded-lg border border-card-border bg-card py-12 text-center text-xs text-secondary-text">
              Select a course to view CLO attainments
            </div>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {cloDetails ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-card-border bg-card overflow-hidden">
                <div className="p-4 border-b border-card-border">
                  <h3 className="text-sm font-semibold text-primary-text">{cloDetails.clo.code}</h3>
                  <p className="text-xs text-secondary-text mt-0.5">{cloDetails.clo.description}</p>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-secondary-text">Course</p>
                      <p className="text-sm font-semibold text-primary-text">
                        {cloDetails.clo.course.code} - {cloDetails.clo.course.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary-text">Bloom's Level</p>
                      <p className="text-sm font-semibold text-primary-text">{cloDetails.clo.bloomLevel}</p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary-text">Latest Attainment</p>
                      <p className="text-sm font-semibold text-primary-text">
                        {cloDetails.attainments[0]?.attainmentPercent.toFixed(1) || 'N/A'}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary-text">Status</p>
                      <div className="mt-1">{getStatusBadge(cloDetails.attainments[0]?.status || 'not_calculated')}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attainments History */}
              <div className="rounded-lg border border-card-border bg-card overflow-hidden">
                <div className="p-4 border-b border-card-border">
                  <h3 className="text-sm font-semibold text-primary-text">Attainment History</h3>
                </div>
                <div className="p-4 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Semester</TableHead>
                        <TableHead>Section</TableHead>
                        <TableHead>Total Students</TableHead>
                        <TableHead>Students Achieved</TableHead>
                        <TableHead>Attainment %</TableHead>
                        <TableHead>Threshold</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Calculated At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cloDetails.attainments.map((attainment) => (
                        <TableRow key={attainment.id}>
                          <TableCell>{attainment.semester}</TableCell>
                          <TableCell>
                            {attainment.sections.map((s) => s.name).join(', ')}
                          </TableCell>
                          <TableCell>{attainment.totalStudents}</TableCell>
                          <TableCell>{attainment.studentsAchieved}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={attainment.attainmentPercent}
                                className="w-20"
                              />
                              <span>{attainment.attainmentPercent.toFixed(1)}%</span>
                            </div>
                          </TableCell>
                          <TableCell>{attainment.threshold}%</TableCell>
                          <TableCell>
                            {getStatusBadge(attainment.status)}
                          </TableCell>
                          <TableCell>
                            {format(new Date(attainment.calculatedAt), 'PPp')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Assessment Breakdown */}
              <div className="rounded-lg border border-card-border bg-card overflow-hidden">
                <div className="p-4 border-b border-card-border">
                  <h3 className="text-sm font-semibold text-primary-text">Assessment-wise Breakdown</h3>
                </div>
                <div className="p-4 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Assessment</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Semester</TableHead>
                        <TableHead>Items Count</TableHead>
                        <TableHead>Total Marks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cloDetails.assessmentBreakdown.map((assessment) => (
                        <TableRow key={assessment.assessmentId}>
                          <TableCell className="font-medium">
                            {assessment.title}
                          </TableCell>
                          <TableCell>
                            {assessment.type
                              .replace(/_/g, ' ')
                              .replace(/\b\w/g, (c) => c.toUpperCase())}
                          </TableCell>
                          <TableCell>{assessment.semester}</TableCell>
                          <TableCell>{assessment.itemCount}</TableCell>
                          <TableCell>{assessment.totalMarks}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Student Breakdown */}
              <div className="rounded-lg border border-card-border bg-card overflow-hidden">
                <div className="p-4 border-b border-card-border">
                  <h3 className="text-sm font-semibold text-primary-text">Student-wise Breakdown</h3>
                </div>
                <div className="p-4">
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Roll No</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Obtained</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Percentage</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cloDetails.studentBreakdown.map((student) => (
                          <TableRow key={student.studentId}>
                            <TableCell className="font-medium">
                              {student.rollNumber}
                            </TableCell>
                            <TableCell>{student.name}</TableCell>
                            <TableCell>{student.obtainedMarks.toFixed(1)}</TableCell>
                            <TableCell>{student.totalMarks}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={student.percentage} className="w-20" />
                                <span>{student.percentage.toFixed(1)}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {student.achieved ? (
                                <Badge variant="default" className="bg-green-600">
                                  Achieved
                                </Badge>
                              ) : (
                                <Badge variant="destructive">Not Achieved</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-card-border bg-card py-12 text-center text-xs text-secondary-text">
              Select a CLO from the dashboard to view details
            </div>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          {selectedCourseData && (
            <div className="space-y-4">
              <div className="rounded-lg border border-card-border bg-card overflow-hidden">
                <div className="p-4 border-b border-card-border">
                  <h3 className="text-sm font-semibold text-primary-text">Trend Analysis</h3>
                </div>
                <div className="p-4">
                  <p className="text-xs text-secondary-text">Historical trend analysis coming soon...</p>
                </div>
              </div>

              <div className="rounded-lg border border-card-border bg-card overflow-hidden">
                <div className="p-4 border-b border-card-border">
                  <h3 className="text-sm font-semibold text-primary-text">Section Comparison</h3>
                </div>
                <div className="p-4">
                  <p className="text-xs text-secondary-text">Section-wise comparison coming soon...</p>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="plo-mappings" className="space-y-4">
          {selectedCourse && (
            <CLOPLOMappingsView courseId={selectedCourse} />
          )}
        </TabsContent>
      </Tabs>

      {/* Calculate Dialog */}
      <Dialog open={showCalculateDialog} onOpenChange={setShowCalculateDialog}>
        <DialogContent className="bg-card border-card-border text-primary-text max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-primary-text">Calculate CLO Attainments</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text">
              Calculate CLO attainments for a course offering
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
                  {courses.flatMap((course) =>
                    course.courseOfferings.map((co) => (
                      <SelectItem
                        key={co.id}
                        value={co.id.toString()}
                        className="text-primary-text hover:bg-card/50"
                      >
                        {course.course.code} - {co.semester.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="threshold" className="text-xs text-secondary-text">Threshold (%)</Label>
              <Input
                id="threshold"
                type="number"
                min={0}
                max={100}
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value) || 60)}
                className="h-8 text-xs mt-1 bg-card border-card-border text-primary-text"
              />
              <p className="text-xs text-secondary-text mt-1">
                Minimum percentage required for CLO attainment (default: 60%)
              </p>
            </div>
          </div>
          <DialogFooter className="border-t border-card-border pt-4 gap-2">
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
            >
              {calculating ? 'Calculating...' : 'Calculate'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// CLO-PLO Mappings View Component
function CLOPLOMappingsView({ courseId }: { courseId: number }) {
  const [mappings, setMappings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMappings();
  }, [courseId]);

  const fetchMappings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/clos/plo-mappings`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch mappings');
      const result = await response.json();
      if (result.success) {
        setMappings(result.data);
      }
    } catch (error) {
      console.error('Error fetching CLO-PLO mappings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-card-border bg-card py-12 text-center text-xs text-secondary-text">Loading mappings...</div>
    );
  }

  return (
    <div className="rounded-lg border border-card-border bg-card overflow-hidden">
      <div className="p-4 border-b border-card-border">
        <h3 className="text-sm font-semibold text-primary-text">CLO-PLO Mappings</h3>
        <p className="text-xs text-secondary-text mt-0.5">View how CLOs map to Program Learning Outcomes</p>
      </div>
      <div className="p-4">
        {mappings.length === 0 ? (
          <p className="text-xs text-secondary-text text-center py-8">No CLO-PLO mappings found</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-semibold text-primary-text">CLO Code</TableHead>
                  <TableHead className="text-xs font-semibold text-primary-text">CLO Description</TableHead>
                  <TableHead className="text-xs font-semibold text-primary-text">Mapped PLOs</TableHead>
                  <TableHead className="text-xs font-semibold text-primary-text">Total Weight</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((mapping) => (
                  <TableRow key={mapping.clo.id} className="hover:bg-[var(--hover-bg)]">
                    <TableCell className="font-medium text-xs text-primary-text">{mapping.clo.code}</TableCell>
                    <TableCell className="max-w-md truncate text-xs text-primary-text">{mapping.clo.description}</TableCell>
                    <TableCell className="text-xs text-primary-text">
                      <div className="flex flex-wrap gap-1">
                        {mapping.plos.map((plo: any) => (
                          <Badge key={plo.ploId} variant="outline" className="text-[10px] border-card-border text-secondary-text">
                            {plo.ploCode} ({plo.weight}%)
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-primary-text">
                      {mapping.plos.reduce((sum: number, plo: any) => sum + plo.weight, 0)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

export default CLOAttainmentsPage;
