'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Download, Printer, GraduationCap, Award, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TranscriptData {
  student: {
    id: number;
    rollNumber: string;
    name: string;
    email: string;
    program: {
      id: number;
      code: string;
      name: string;
    } | null;
    department: {
      id: number;
      code: string;
      name: string;
    } | null;
    batch: {
      id: string;
      name: string;
    } | null;
  };
  semesters: Array<{
    semester: string;
    semesterId: number;
    courses: Array<{
      courseCode: string;
      courseName: string;
      creditHours: number;
      grade: string;
      gpaPoints: number;
      percentage: number;
      cloAttainments: Array<{
        cloCode: string;
        cloDescription: string;
        attainmentPercent: number;
        status: 'attained' | 'not_attained';
      }>;
    }>;
    gpa: number;
    creditHours: number;
  }>;
  overall: {
    cgpa: number;
    totalCreditHours: number;
    requiredCreditHours: number;
    completionPercentage: number;
    totalCourses: number;
  };
  cloAttainmentsSummary: {
    total: number;
    attained: number;
  };
  ploAttainmentsSummary: {
    total: number;
    attained: number;
    plos: Array<{
      ploCode: string;
      description: string;
      attainmentPercent: number;
      status: 'attained' | 'not_attained';
    }>;
  };
  generatedAt: string;
}

const TranscriptPage = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<TranscriptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isDarkMode = mounted && resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const primaryColorDark = isDarkMode ? 'var(--orange-dark)' : 'var(--blue-dark)';
  const iconBgColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchTranscript();
  }, []);

  const fetchTranscript = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/student/transcript', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch transcript');
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch transcript');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load transcript'
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // For now, just trigger print which can be saved as PDF
    // In future, can implement actual PDF generation using jsPDF
    window.print();
    toast.info('Use browser print dialog to save as PDF');
  };

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-page">
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
          <p className="text-xs text-secondary-text">Loading transcript...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-bold text-primary-text">Academic Transcript</h1>
          <p className="text-xs text-secondary-text mt-0.5">Your academic record</p>
        </div>
        <div className="rounded-lg border border-card-border bg-card p-4">
          <p className="text-sm text-primary-text">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4 print:p-4">
      {/* Header Actions - Hidden in print */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-lg font-bold text-primary-text">Academic Transcript</h1>
          <p className="text-xs text-secondary-text mt-0.5">Your official academic record</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadPDF}
            className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 flex items-center gap-1.5 border border-card-border bg-transparent text-primary-text hover:bg-hover-bg"
          >
            <Download className="h-3.5 w-3.5" />
            Download PDF
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 flex items-center gap-1.5 border border-card-border bg-transparent text-primary-text hover:bg-hover-bg"
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </button>
        </div>
      </div>

      {/* Transcript Content */}
      <div className="space-y-6 print:space-y-4">
        {/* Student Information */}
        <Card className="bg-card border border-card-border print:border-0 print:shadow-none">
          <CardHeader>
            <div className="text-center">
              <h2 className="text-lg font-bold text-primary-text mb-2">ACADEMIC TRANSCRIPT</h2>
              <p className="text-xs text-secondary-text">
                {data.student.department?.name || 'University'}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-muted-text">Student Name</p>
                <p className="text-sm font-semibold text-primary-text">{data.student.name}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-text">Roll Number</p>
                <p className="text-sm font-semibold text-primary-text">{data.student.rollNumber}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-text">Program</p>
                <p className="text-sm font-semibold text-primary-text">
                  {data.student.program?.code} - {data.student.program?.name}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-text">Batch</p>
                <p className="text-sm font-semibold text-primary-text">{data.student.batch?.name}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-text">Email</p>
                <p className="text-sm font-semibold text-primary-text">{data.student.email}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-text">Generated On</p>
                <p className="text-sm font-semibold text-primary-text">
                  {new Date(data.generatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overall Summary */}
        <Card className="bg-card border border-card-border print:border-0 print:shadow-none">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-primary-text">Overall Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg border border-card-border bg-card">
                <p className="text-[10px] text-muted-text">CGPA</p>
                <p className="text-lg font-bold text-primary-text">{data.overall.cgpa.toFixed(2)}</p>
              </div>
              <div className="text-center p-4 rounded-lg border border-card-border bg-card">
                <p className="text-[10px] text-muted-text">Credit Hours</p>
                <p className="text-lg font-bold text-primary-text">
                  {data.overall.totalCreditHours} / {data.overall.requiredCreditHours}
                </p>
              </div>
              <div className="text-center p-4 rounded-lg border border-card-border bg-card">
                <p className="text-[10px] text-muted-text">Completion</p>
                <p className="text-lg font-bold text-primary-text">
                  {data.overall.completionPercentage.toFixed(1)}%
                </p>
              </div>
              <div className="text-center p-4 rounded-lg border border-card-border bg-card">
                <p className="text-[10px] text-muted-text">Total Courses</p>
                <p className="text-lg font-bold text-primary-text">{data.overall.totalCourses}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Semester-wise Grades */}
        {data.semesters.map((semester) => (
          <Card key={semester.semesterId} className="bg-card border border-card-border print:border-0 print:shadow-none print:break-inside-avoid">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-bold text-primary-text">{semester.semester}</CardTitle>
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-xs text-muted-text">GPA: </span>
                    <span className="text-sm font-bold text-primary-text">{semester.gpa.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-text">Credits: </span>
                    <span className="text-sm font-bold text-primary-text">{semester.creditHours}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-card-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-semibold text-primary-text">Course Code</TableHead>
                      <TableHead className="text-xs font-semibold text-primary-text">Course Name</TableHead>
                      <TableHead className="text-center text-xs font-semibold text-primary-text">Credits</TableHead>
                      <TableHead className="text-center text-xs font-semibold text-primary-text">Grade</TableHead>
                      <TableHead className="text-center text-xs font-semibold text-primary-text">GPA Points</TableHead>
                      <TableHead className="text-center text-xs font-semibold text-primary-text">Percentage</TableHead>
                      <TableHead className="text-center text-xs font-semibold text-primary-text">CLOs</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {semester.courses.map((course, idx) => (
                      <TableRow key={idx} className="hover:bg-hover-bg transition-colors">
                        <TableCell className="text-xs font-medium text-primary-text">
                          {course.courseCode}
                        </TableCell>
                        <TableCell className="text-xs text-secondary-text">{course.courseName}</TableCell>
                        <TableCell className="text-center text-xs text-primary-text">
                          {course.creditHours}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="font-semibold text-[10px] border border-card-border text-primary-text">
                            {course.grade}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-xs text-primary-text">
                          {course.gpaPoints.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center text-xs text-primary-text">
                          {course.percentage.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-center">
                          {course.cloAttainments.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {course.cloAttainments.map((clo) => (
                                <Badge
                                  key={clo.cloCode}
                                  variant={
                                    clo.status === 'attained'
                                      ? 'success'
                                      : 'destructive'
                                  }
                                  className="text-[10px] px-1.5 py-0.5"
                                >
                                  {clo.cloCode} ({clo.attainmentPercent.toFixed(0)}%)
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-secondary-text">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* CLO Attainments Summary */}
        <Card className="bg-card border border-card-border print:border-0 print:shadow-none print:break-inside-avoid">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-primary-text flex items-center gap-2">
              <Target className="h-5 w-5" />
              CLO Attainments Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-lg border border-card-border bg-card">
                <p className="text-[10px] text-muted-text">Total CLOs</p>
                <p className="text-lg font-bold text-primary-text">
                  {data.cloAttainmentsSummary.total}
                </p>
              </div>
              <div className="text-center p-4 rounded-lg border border-card-border bg-card">
                <p className="text-[10px] text-muted-text">Attained CLOs</p>
                <p className="text-lg font-bold text-primary-text">
                  {data.cloAttainmentsSummary.attained}
                </p>
                <p className="text-xs text-secondary-text mt-1">
                  (
                  {data.cloAttainmentsSummary.total > 0
                    ? (
                        (data.cloAttainmentsSummary.attained /
                          data.cloAttainmentsSummary.total) *
                        100
                      ).toFixed(1)
                    : 0}
                  %)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PLO Attainments Summary */}
        {data.ploAttainmentsSummary.plos.length > 0 && (
          <Card className="bg-card border border-card-border print:border-0 print:shadow-none print:break-inside-avoid">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-primary-text flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                PLO Attainments Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-4 rounded-lg border border-card-border bg-card">
                  <p className="text-[10px] text-muted-text">Total PLOs</p>
                  <p className="text-lg font-bold text-primary-text">
                    {data.ploAttainmentsSummary.total}
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg border border-card-border bg-card">
                  <p className="text-[10px] text-muted-text">Attained PLOs</p>
                  <p className="text-lg font-bold text-primary-text">
                    {data.ploAttainmentsSummary.attained}
                  </p>
                  <p className="text-xs text-secondary-text mt-1">
                    (
                    {data.ploAttainmentsSummary.total > 0
                      ? (
                          (data.ploAttainmentsSummary.attained /
                            data.ploAttainmentsSummary.total) *
                          100
                        ).toFixed(1)
                      : 0}
                    %)
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-card-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-semibold text-primary-text">PLO Code</TableHead>
                      <TableHead className="text-xs font-semibold text-primary-text">Description</TableHead>
                      <TableHead className="text-center text-xs font-semibold text-primary-text">Attainment</TableHead>
                      <TableHead className="text-center text-xs font-semibold text-primary-text">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {data.ploAttainmentsSummary.plos.map((plo) => (
                    <TableRow key={plo.ploCode}>
                      <TableCell className="text-xs font-medium text-primary-text">
                        {plo.ploCode}
                      </TableCell>
                      <TableCell className="text-xs text-secondary-text">{plo.description}</TableCell>
                      <TableCell className="text-center text-xs text-primary-text">
                        {plo.attainmentPercent.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            plo.status === 'attained' ? 'success' : 'destructive'
                          }
                        >
                          {plo.status === 'attained' ? 'Attained' : 'Not Attained'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-secondary-text print:mt-8">
          <p>This is an unofficial transcript generated on {new Date(data.generatedAt).toLocaleString()}</p>
          <p className="mt-2">For official transcript, please contact the registrar's office</p>
        </div>
      </div>
    </div>
  );
};

export default TranscriptPage;

