'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
            className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border text-primary-text hover:bg-[var(--hover-bg)]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="bg-card border border-card-border p-1 rounded-lg">
          <TabsTrigger value="dashboard" className="text-xs data-[state=active]:bg-[var(--hover-bg)] data-[state=active]:text-primary-text rounded-md">Dashboard</TabsTrigger>
          <TabsTrigger value="details" disabled={!selectedCLO} className="text-xs rounded-md">CLO Details</TabsTrigger>
          <TabsTrigger value="analysis" disabled={!selectedCourse} className="text-xs rounded-md">Analysis</TabsTrigger>
          <TabsTrigger value="plo-mappings" disabled={!selectedCourse} className="text-xs rounded-md">CLO-PLO Mappings</TabsTrigger>
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
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total CLOs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {selectedCourseData.totalCLOs}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Attained CLOs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {selectedCourseData.attainedCLOs}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Average Attainment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {selectedCourseData.averageAttainment.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Attainment Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {selectedCourseData.totalCLOs > 0
                        ? (
                            (selectedCourseData.attainedCLOs /
                              selectedCourseData.totalCLOs) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* CLO Attainment Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>CLO Attainment Overview</CardTitle>
                </CardHeader>
                <CardContent>
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
                    <p className="text-muted-foreground text-center py-8">
                      No CLO attainment data available
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* CLOs List */}
              <Card>
                <CardHeader>
                  <CardTitle>CLOs List</CardTitle>
                  <CardDescription>
                    Click on a CLO to view detailed information
                  </CardDescription>
                </CardHeader>
                <CardContent>
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
                              <span className="text-muted-foreground">N/A</span>
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCLO(clo.id);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {!selectedCourse && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Select a course to view CLO attainments
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {cloDetails ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{cloDetails.clo.code}</CardTitle>
                  <CardDescription>{cloDetails.clo.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Course</p>
                      <p className="font-semibold">
                        {cloDetails.clo.course.code} - {cloDetails.clo.course.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Bloom's Level</p>
                      <p className="font-semibold">{cloDetails.clo.bloomLevel}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Latest Attainment
                      </p>
                      <p className="font-semibold">
                        {cloDetails.attainments[0]?.attainmentPercent.toFixed(1) ||
                          'N/A'}
                        %
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      {getStatusBadge(
                        cloDetails.attainments[0]?.status || 'not_calculated'
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Attainments History */}
              <Card>
                <CardHeader>
                  <CardTitle>Attainment History</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>

              {/* Assessment Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Assessment-wise Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>

              {/* Student Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Student-wise Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Select a CLO from the dashboard to view details
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          {selectedCourseData && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Trend Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Historical trend analysis coming soon...
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Section Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Section-wise comparison coming soon...
                  </p>
                </CardContent>
              </Card>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Calculate CLO Attainments</DialogTitle>
            <DialogDescription>
              Calculate CLO attainments for a course offering
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
                  {courses.flatMap((course) =>
                    course.courseOfferings.map((co) => (
                      <SelectItem
                        key={co.id}
                        value={co.id.toString()}
                      >
                        {course.course.code} - {co.semester.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="threshold">Threshold (%)</Label>
              <Input
                id="threshold"
                type="number"
                min="0"
                max="100"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value) || 60)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum percentage required for CLO attainment (default: 60%)
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
            <Button onClick={handleCalculate} disabled={calculating || !selectedCourseOffering}>
              {calculating ? 'Calculating...' : 'Calculate'}
            </Button>
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
      <Card>
        <CardContent className="py-12 text-center">Loading mappings...</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>CLO-PLO Mappings</CardTitle>
        <CardDescription>
          View how CLOs map to Program Learning Outcomes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {mappings.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No CLO-PLO mappings found
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CLO Code</TableHead>
                <TableHead>CLO Description</TableHead>
                <TableHead>Mapped PLOs</TableHead>
                <TableHead>Total Weight</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map((mapping) => (
                <TableRow key={mapping.clo.id}>
                  <TableCell className="font-medium">
                    {mapping.clo.code}
                  </TableCell>
                  <TableCell className="max-w-md truncate">
                    {mapping.clo.description}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {mapping.plos.map((plo: any) => (
                        <Badge key={plo.ploId} variant="outline">
                          {plo.ploCode} ({plo.weight}%)
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {mapping.plos.reduce(
                      (sum: number, plo: any) => sum + plo.weight,
                      0
                    )}
                    %
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default CLOAttainmentsPage;
