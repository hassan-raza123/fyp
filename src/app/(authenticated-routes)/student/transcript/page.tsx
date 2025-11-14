'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Download, Printer, GraduationCap, Award, Target } from 'lucide-react';
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
  const [data, setData] = useState<TranscriptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transcript...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-6 space-y-6 print:p-4">
      {/* Header Actions - Hidden in print */}
      <div className="flex justify-between items-center print:hidden">
        <h1 className="text-3xl font-bold">Academic Transcript</h1>
        <div className="flex gap-2">
          <Button onClick={handleDownloadPDF} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button onClick={handlePrint} variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Transcript Content */}
      <div className="space-y-6 print:space-y-4">
        {/* Student Information */}
        <Card className="print:border-0 print:shadow-none">
          <CardHeader>
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">ACADEMIC TRANSCRIPT</h2>
              <p className="text-muted-foreground">
                {data.student.department?.name || 'University'}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Student Name</p>
                <p className="font-semibold">{data.student.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Roll Number</p>
                <p className="font-semibold">{data.student.rollNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Program</p>
                <p className="font-semibold">
                  {data.student.program?.code} - {data.student.program?.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Batch</p>
                <p className="font-semibold">{data.student.batch?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-semibold">{data.student.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Generated On</p>
                <p className="font-semibold">
                  {new Date(data.generatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overall Summary */}
        <Card className="print:border-0 print:shadow-none">
          <CardHeader>
            <CardTitle>Overall Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-muted-foreground">CGPA</p>
                <p className="text-3xl font-bold">{data.overall.cgpa.toFixed(2)}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Credit Hours</p>
                <p className="text-3xl font-bold">
                  {data.overall.totalCreditHours} / {data.overall.requiredCreditHours}
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Completion</p>
                <p className="text-3xl font-bold">
                  {data.overall.completionPercentage.toFixed(1)}%
                </p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Courses</p>
                <p className="text-3xl font-bold">{data.overall.totalCourses}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Semester-wise Grades */}
        {data.semesters.map((semester) => (
          <Card key={semester.semesterId} className="print:border-0 print:shadow-none print:break-inside-avoid">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{semester.semester}</CardTitle>
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">GPA: </span>
                    <span className="font-bold">{semester.gpa.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Credits: </span>
                    <span className="font-bold">{semester.creditHours}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course Code</TableHead>
                    <TableHead>Course Name</TableHead>
                    <TableHead className="text-center">Credits</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                    <TableHead className="text-center">GPA Points</TableHead>
                    <TableHead className="text-center">Percentage</TableHead>
                    <TableHead className="text-center">CLOs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {semester.courses.map((course, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        {course.courseCode}
                      </TableCell>
                      <TableCell>{course.courseName}</TableCell>
                      <TableCell className="text-center">
                        {course.creditHours}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-semibold">
                          {course.grade}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {course.gpaPoints.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
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
                                className="text-xs"
                              >
                                {clo.cloCode} ({clo.attainmentPercent.toFixed(0)}%)
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}

        {/* CLO Attainments Summary */}
        <Card className="print:border-0 print:shadow-none print:break-inside-avoid">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              CLO Attainments Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Total CLOs</p>
                <p className="text-2xl font-bold">
                  {data.cloAttainmentsSummary.total}
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Attained CLOs</p>
                <p className="text-2xl font-bold">
                  {data.cloAttainmentsSummary.attained}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
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
          <Card className="print:border-0 print:shadow-none print:break-inside-avoid">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                PLO Attainments Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total PLOs</p>
                  <p className="text-2xl font-bold">
                    {data.ploAttainmentsSummary.total}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Attained PLOs</p>
                  <p className="text-2xl font-bold">
                    {data.ploAttainmentsSummary.attained}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PLO Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">Attainment</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.ploAttainmentsSummary.plos.map((plo) => (
                    <TableRow key={plo.ploCode}>
                      <TableCell className="font-medium">
                        {plo.ploCode}
                      </TableCell>
                      <TableCell>{plo.description}</TableCell>
                      <TableCell className="text-center">
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
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground print:mt-8">
          <p>This is an unofficial transcript generated on {new Date(data.generatedAt).toLocaleString()}</p>
          <p className="mt-2">For official transcript, please contact the registrar's office</p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          .print\\:border-0 {
            border: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:p-4 {
            padding: 1rem !important;
          }
          .print\\:space-y-4 > * + * {
            margin-top: 1rem !important;
          }
          .print\\:break-inside-avoid {
            break-inside: avoid !important;
          }
          .print\\:mt-8 {
            margin-top: 2rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default TranscriptPage;

