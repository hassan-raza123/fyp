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
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { GraduationCap, TrendingUp, TrendingDown, Minus, Download } from 'lucide-react';
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

interface Program {
  id: number;
  name: string;
  code: string;
}

interface Semester {
  id: number;
  name: string;
}

interface ContributingCLO {
  cloId: number;
  cloCode: string;
  cloDescription: string;
  weight: number;
  studentAttainment: number;
  classAttainment: number;
}

interface PLOAttainment {
  ploId: number;
  ploCode: string;
  description: string;
  studentAttainment: {
    percentage: number;
    status: 'attained' | 'not_attained';
  };
  classAttainment: {
    percentage: number;
    status: 'attained' | 'not_attained';
  };
  threshold: number;
  contributingClos: ContributingCLO[];
}

interface PLOAttainmentsData {
  program: {
    id: number;
    code: string;
    name: string;
  };
  semester: string | null;
  overallProgress: {
    totalPLOs: number;
    attainedPLOs: number;
    remainingPLOs: number;
    progressPercentage: number;
  };
  ploAttainments: PLOAttainment[];
}

const PLOAttainmentsPage = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<number | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PLOAttainmentsData | null>(null);
  const [expandedPLO, setExpandedPLO] = useState<number | null>(null);

  // Fetch programs and semesters
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [programsRes, semestersRes] = await Promise.all([
          fetch('/api/programs', { credentials: 'include' }),
          fetch('/api/semesters', { credentials: 'include' }),
        ]);

        if (programsRes.ok) {
          const programsResult = await programsRes.json();
          if (programsResult.success) {
            setPrograms(programsResult.data);
            // Auto-select student's program if available
            if (programsResult.data.length > 0) {
              setSelectedProgram(programsResult.data[0].id);
            }
          }
        }

        if (semestersRes.ok) {
          const semestersResult = await semestersRes.json();
          if (semestersResult.success) {
            setSemesters(semestersResult.data);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch PLO attainments when program/semester changes
  useEffect(() => {
    if (!selectedProgram) return;

    const fetchPLOAttainments = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({
          programId: selectedProgram.toString(),
        });
        if (selectedSemester !== 'all') {
          params.append('semesterId', selectedSemester);
        }

        const response = await fetch(
          `/api/student/plo-attainments?${params.toString()}`,
          {
            credentials: 'include',
          }
        );
        if (!response.ok) throw new Error('Failed to fetch PLO attainments');
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch PLO attainments');
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load PLO attainments'
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPLOAttainments();
  }, [selectedProgram, selectedSemester]);

  const getStatusBadge = (status: 'attained' | 'not_attained') => {
    return (
      <Badge variant={status === 'attained' ? 'success' : 'destructive'}>
        {status === 'attained' ? 'Attained' : 'Not Attained'}
      </Badge>
    );
  };

  const getComparisonIcon = (
    studentPercent: number,
    classPercent: number
  ) => {
    if (studentPercent > classPercent)
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (studentPercent < classPercent)
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const exportToCSV = () => {
    if (!data || data.ploAttainments.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = [
      'PLO Code',
      'Description',
      'Your Attainment %',
      'Class Average %',
      'Status',
      'Threshold',
    ];

    const rows = data.ploAttainments.map((plo) => [
      plo.ploCode,
      plo.description,
      plo.studentAttainment.percentage.toFixed(2),
      plo.classAttainment.percentage.toFixed(2),
      plo.studentAttainment.status === 'attained' ? 'Attained' : 'Not Attained',
      plo.threshold.toString(),
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `plo_attainments_${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('PLO attainments exported successfully');
  };

  // Prepare chart data
  const chartData =
    data?.ploAttainments.map((plo) => ({
      ploCode: plo.ploCode,
      student: plo.studentAttainment.percentage,
      class: plo.classAttainment.percentage,
      threshold: plo.threshold,
    })) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-primary-text">My PLO Attainments</h1>
          <p className="text-xs text-secondary-text mt-0.5">View Program Learning Outcomes achievement</p>
        </div>
        {data && data.ploAttainments.length > 0 && (
          <button
            onClick={exportToCSV}
            className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 flex items-center gap-1.5 border border-card-border bg-transparent text-primary-text hover:bg-hover-bg"
          >
            <Download className="h-3.5 w-3.5" />
            Export to CSV
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg text-xs text-white bg-[var(--error)]">{error}</div>
      )}

      {/* Program and Semester Selection */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
        <div>
          <Label htmlFor="program-select">Select Program</Label>
          <Select
            value={selectedProgram?.toString() || ''}
            onValueChange={(value) => setSelectedProgram(parseInt(value))}
            disabled={loading || !programs.length}
          >
            <SelectTrigger id="program-select" className="mt-2">
              <SelectValue placeholder='Select a program' />
            </SelectTrigger>
            <SelectContent>
              {programs.map((program) => (
                <SelectItem key={program.id} value={program.id.toString()}>
                  {program.code} - {program.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="semester-select">Select Semester (Optional)</Label>
          <Select
            value={selectedSemester}
            onValueChange={setSelectedSemester}
            disabled={loading || !semesters.length}
          >
            <SelectTrigger id="semester-select" className="mt-2">
              <SelectValue placeholder='All Semesters' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Semesters</SelectItem>
              {semesters.map((semester) => (
                <SelectItem key={semester.id} value={semester.id.toString()}>
                  {semester.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className='text-center py-4'>Loading PLO attainments...</div>
      ) : data && data.ploAttainments.length > 0 ? (
        <div className="space-y-6">
          {/* Program Info */}
          <Card>
            <CardHeader>
              <CardTitle>
                {data.program.code} - {data.program.name}
              </CardTitle>
              {data.semester && (
                <p className="text-sm text-muted-foreground">
                  Semester: {data.semester}
                </p>
              )}
            </CardHeader>
          </Card>

          {/* Overall Progress Summary */}
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <Card>
              <CardHeader>
                <CardTitle className='text-sm font-medium text-muted-foreground'>
                  Total PLOs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-3xl font-bold'>{data.overallProgress.totalPLOs}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className='text-sm font-medium text-muted-foreground'>
                  Attained PLOs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-3xl font-bold text-green-600'>
                  {data.overallProgress.attainedPLOs}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className='text-sm font-medium text-muted-foreground'>
                  Remaining PLOs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-3xl font-bold text-orange-600'>
                  {data.overallProgress.remainingPLOs}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className='text-sm font-medium text-muted-foreground'>
                  Overall Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-3xl font-bold'>
                  {data.overallProgress.progressPercentage.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle>PLO Attainment Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="ploCode" />
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

          {/* PLO Details */}
          <div className="space-y-4">
            {data.ploAttainments.map((plo) => (
              <Card key={plo.ploId}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        {plo.ploCode}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {plo.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {plo.studentAttainment.percentage.toFixed(1)}%
                      </div>
                      <div className="mt-1">
                        {getStatusBadge(plo.studentAttainment.status)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Your Attainment</p>
                      <p className="text-lg font-semibold">
                        {plo.studentAttainment.percentage.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Class Average</p>
                      <p className="text-lg font-semibold">
                        {plo.classAttainment.percentage.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Comparison</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getComparisonIcon(
                          plo.studentAttainment.percentage,
                          plo.classAttainment.percentage
                        )}
                        <span className="text-sm">
                          {plo.studentAttainment.percentage >
                          plo.classAttainment.percentage
                            ? 'Above Average'
                            : plo.studentAttainment.percentage <
                              plo.classAttainment.percentage
                            ? 'Below Average'
                            : 'At Average'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 p-3 bg-gray-50 rounded">
                    <p className="text-sm text-muted-foreground">
                      Threshold: {plo.threshold}%
                    </p>
                  </div>

                  {/* Contributing CLOs */}
                  {plo.contributingClos.length > 0 && (
                    <div>
                      <button
                        onClick={() =>
                          setExpandedPLO(
                            expandedPLO === plo.ploId ? null : plo.ploId
                          )
                        }
                        className="text-sm text-primary hover:underline mb-2"
                      >
                        {expandedPLO === plo.ploId ? 'Hide' : 'Show'}{' '}
                        Contributing CLOs ({plo.contributingClos.length})
                      </button>

                      {expandedPLO === plo.ploId && (
                        <div className="mt-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>CLO Code</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Weight</TableHead>
                                <TableHead>Your Attainment</TableHead>
                                <TableHead>Class Average</TableHead>
                                <TableHead>Contribution</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {plo.contributingClos.map((clo) => {
                                const contribution =
                                  (clo.studentAttainment * clo.weight) /
                                  plo.contributingClos.reduce(
                                    (sum, c) => sum + c.weight,
                                    0
                                  );
                                return (
                                  <TableRow key={clo.cloId}>
                                    <TableCell className="font-medium">
                                      {clo.cloCode}
                                    </TableCell>
                                    <TableCell className="max-w-md truncate">
                                      {clo.cloDescription}
                                    </TableCell>
                                    <TableCell>{clo.weight}</TableCell>
                                    <TableCell>
                                      {clo.studentAttainment.toFixed(1)}%
                                    </TableCell>
                                    <TableCell>
                                      {clo.classAttainment.toFixed(1)}%
                                    </TableCell>
                                    <TableCell>
                                      {contribution.toFixed(2)}%
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
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
      ) : selectedProgram ? (
        <div className='text-center text-gray-500 py-4'>
          No PLO attainments data available
        </div>
      ) : (
        <div className='text-center text-gray-500 py-4'>
          Select a program to view PLO attainments
        </div>
      )}
    </div>
  );
};

export default PLOAttainmentsPage;
