'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Section {
  id: number;
  name: string;
  courseOffering: {
    course: {
      id: number;
      code: string;
      name: string;
    };
    semester: {
      id: number;
      name: string;
    };
  };
}

interface CLOAttainment {
  clo: {
    id: number;
    code: string;
    description: string;
    bloomLevel: string | null;
  };
  studentAttainment: {
    percentage: number;
    obtainedMarks: number;
    totalMarks: number;
    status: 'attained' | 'not_attained';
  };
  classAttainment: {
    percentage: number;
    threshold: number;
    status: 'attained' | 'not_attained';
    calculatedAt: string;
  } | null;
  assessmentBreakdown: Array<{
    assessmentId: number;
    assessmentTitle: string;
    assessmentType: string;
    dueDate: string | null;
    totalMarks: number;
    obtainedMarks: number;
    percentage: number;
  }>;
}

interface CLOAttainmentsData {
  section: {
    id: number;
    name: string;
    course: {
      id: number;
      code: string;
      name: string;
    };
    semester: {
      id: number;
      name: string;
    };
  };
  cloAttainments: CLOAttainment[];
}

const CLOAttainmentsPage = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CLOAttainmentsData | null>(null);
  const [expandedCLO, setExpandedCLO] = useState<number | null>(null);

  // Fetch sections on component mount
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await fetch('/api/student/sections', {
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch sections');
        const result = await response.json();
        if (result.success) {
          setSections(result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch sections');
        }
      } catch (err) {
        setError('Failed to load sections');
        console.error(err);
      }
    };
    fetchSections();
  }, []);

  // Fetch CLO attainments when section is selected
  useEffect(() => {
    if (!selectedSection) {
      setData(null);
      return;
    }

    const fetchCLOAttainments = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `/api/student/clo-attainments?sectionId=${selectedSection}`,
          {
            credentials: 'include',
          }
        );
        if (!response.ok) throw new Error('Failed to fetch CLO attainments');
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch CLO attainments');
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load CLO attainments'
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCLOAttainments();
  }, [selectedSection]);

  const selectedSectionData = sections.find(
    (section) => section.id === selectedSection
  );

  const getStatusBadge = (status: 'attained' | 'not_attained') => {
    return (
      <Badge variant={status === 'attained' ? 'success' : 'destructive'}>
        {status === 'attained' ? 'Attained' : 'Not Attained'}
      </Badge>
    );
  };

  const getComparisonIcon = (
    studentPercent: number,
    classPercent: number | null
  ) => {
    if (!classPercent) return <Minus className="h-4 w-4 text-gray-400" />;
    if (studentPercent > classPercent)
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (studentPercent < classPercent)
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  // Prepare chart data
  const chartData =
    data?.cloAttainments.map((attainment) => ({
      cloCode: attainment.clo.code,
      student: attainment.studentAttainment.percentage,
      class: attainment.classAttainment?.percentage || 0,
      threshold: attainment.classAttainment?.threshold || 60,
    })) || [];

  return (
    <div className='p-6'>
      <h1 className='text-2xl font-bold mb-6'>My CLO Attainments</h1>

      {/* Section Selection */}
      <div className='mb-6'>
        <Label htmlFor="section-select" className="block mb-2">
          Select Section
        </Label>
        <Select
          value={selectedSection?.toString() || ''}
          onValueChange={(value) => setSelectedSection(parseInt(value))}
        >
          <SelectTrigger id="section-select" className="w-full max-w-md">
            <SelectValue placeholder='Select a section' />
          </SelectTrigger>
          <SelectContent>
            {sections.map((section) => (
              <SelectItem key={section.id} value={section.id.toString()}>
                {section.courseOffering.course.code} - {section.name} (
                {section.courseOffering.semester.name})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className='mb-4 p-3 bg-red-100 text-red-700 rounded'>{error}</div>
      )}

      {loading ? (
        <div className='text-center py-4'>Loading CLO attainments...</div>
      ) : data && data.cloAttainments.length > 0 ? (
        <div className="space-y-6">
          {/* Section Info */}
          <Card>
            <CardHeader>
              <CardTitle>
                {data.section.course.code} - {data.section.course.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Section: {data.section.name} • Semester: {data.section.semester.name}
              </p>
            </CardHeader>
          </Card>

          {/* Overall Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Overall CLO Attainment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total CLOs</p>
                  <p className="text-2xl font-bold">{data.cloAttainments.length}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Attained CLOs</p>
                  <p className="text-2xl font-bold">
                    {
                      data.cloAttainments.filter(
                        (a) => a.studentAttainment.status === 'attained'
                      ).length
                    }
                  </p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Average Attainment</p>
                  <p className="text-2xl font-bold">
                    {(
                      data.cloAttainments.reduce(
                        (sum, a) => sum + a.studentAttainment.percentage,
                        0
                      ) / data.cloAttainments.length
                    ).toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Chart */}
              <div className="h-[400px] mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="cloCode" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="student" name="Your Attainment" fill="#4f46e5" />
                    <Bar dataKey="class" name="Class Average" fill="#10b981" />
                    <Bar dataKey="threshold" name="Threshold" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* CLO Details */}
          <div className="space-y-4">
            {data.cloAttainments.map((attainment) => (
              <Card key={attainment.clo.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        {attainment.clo.code}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {attainment.clo.description}
                      </p>
                      {attainment.clo.bloomLevel && (
                        <Badge variant="outline" className="mt-2">
                          {attainment.clo.bloomLevel}
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {attainment.studentAttainment.percentage.toFixed(1)}%
                      </div>
                      <div className="mt-1">
                        {getStatusBadge(attainment.studentAttainment.status)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Your Marks</p>
                      <p className="text-lg font-semibold">
                        {attainment.studentAttainment.obtainedMarks.toFixed(1)} /{' '}
                        {attainment.studentAttainment.totalMarks.toFixed(1)}
                      </p>
                    </div>
                    {attainment.classAttainment && (
                      <>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Class Average
                          </p>
                          <p className="text-lg font-semibold">
                            {attainment.classAttainment.percentage.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Comparison
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {getComparisonIcon(
                              attainment.studentAttainment.percentage,
                              attainment.classAttainment.percentage
                            )}
                            <span className="text-sm">
                              {attainment.studentAttainment.percentage >
                              attainment.classAttainment.percentage
                                ? 'Above Average'
                                : attainment.studentAttainment.percentage <
                                  attainment.classAttainment.percentage
                                ? 'Below Average'
                                : 'At Average'}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {attainment.classAttainment && (
                    <div className="mb-4 p-3 bg-gray-50 rounded">
                      <p className="text-sm text-muted-foreground">
                        Threshold: {attainment.classAttainment.threshold}% • Last
                        Calculated:{' '}
                        {new Date(
                          attainment.classAttainment.calculatedAt
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {/* Assessment Breakdown */}
                  {attainment.assessmentBreakdown.length > 0 && (
                    <div>
                      <button
                        onClick={() =>
                          setExpandedCLO(
                            expandedCLO === attainment.clo.id
                              ? null
                              : attainment.clo.id
                          )
                        }
                        className="text-sm text-primary hover:underline mb-2"
                      >
                        {expandedCLO === attainment.clo.id
                          ? 'Hide'
                          : 'Show'}{' '}
                        Assessment Breakdown ({attainment.assessmentBreakdown.length})
                      </button>

                      {expandedCLO === attainment.clo.id && (
                        <div className="mt-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Assessment</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Marks</TableHead>
                                <TableHead>Percentage</TableHead>
                                <TableHead>Contribution</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {attainment.assessmentBreakdown.map((assessment) => (
                                <TableRow key={assessment.assessmentId}>
                                  <TableCell className="font-medium">
                                    {assessment.assessmentTitle}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      {assessment.assessmentType.replace(/_/g, ' ')}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {assessment.obtainedMarks.toFixed(1)} /{' '}
                                    {assessment.totalMarks.toFixed(1)}
                                  </TableCell>
                                  <TableCell>
                                    {assessment.percentage.toFixed(1)}%
                                  </TableCell>
                                  <TableCell>
                                    {(
                                      (assessment.totalMarks /
                                        attainment.studentAttainment.totalMarks) *
                                      100
                                    ).toFixed(1)}%
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : selectedSection ? (
        <div className='text-center text-gray-500 py-4'>
          No CLO attainments data available for this section
        </div>
      ) : (
        <div className='text-center text-gray-500 py-4'>
          Select a section to view CLO attainments
        </div>
      )}
    </div>
  );
};

export default CLOAttainmentsPage;
