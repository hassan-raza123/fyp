'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface CourseOffering {
  id: number;
  course: {
    code: string;
    name: string;
  };
  semester: {
    name: string;
  };
}

interface Section {
  id: number;
  name: string;
  courseOffering: CourseOffering;
}

interface Student {
  id: number;
  rollNumber: string;
  user: {
    firstName: string;
    lastName: string;
    name?: string;
  };
}

interface Assessment {
  id: number;
  title: string;
  type: string;
  totalMarks: number;
}

interface AssessmentResult {
  id: number;
  studentId: number;
  assessmentId: number;
  status: 'pending' | 'evaluated' | 'published' | 'draft';
  remarks: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
}

const ResultEvaluationPage = () => {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode
    ? 'rgba(252, 153, 40, 0.15)'
    : 'rgba(38, 40, 149, 0.15)';

  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [results, setResults] = useState<Record<number, AssessmentResult[]>>(
    {}
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch sections on component mount
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await fetch('/api/sections?status=active', {
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch sections');
        const data = await response.json();
        if (data.success) {
          setSections(data.data);
        } else {
          setSections(data);
        }
      } catch (err) {
        setError('Failed to load sections');
        console.error(err);
        toast.error('Failed to load sections');
      }
    };
    fetchSections();
  }, []);

  // Fetch students, assessments, and results when section is selected
  useEffect(() => {
    if (!selectedSection) {
      setStudents([]);
      setAssessments([]);
      setResults({});
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch students in the section
        const studentsResponse = await fetch(
          `/api/sections/${selectedSection}/students`
        );
        if (!studentsResponse.ok) throw new Error('Failed to fetch students');
        const studentsData = await studentsResponse.json();
        setStudents(studentsData);

        // Fetch assessments for the section's course offering
        const section = sections.find((s) => s.id.toString() === selectedSection);
        if (section) {
          const assessmentsResponse = await fetch(
            `/api/assessments?courseOfferingId=${section.courseOffering.id}`
          );
          if (!assessmentsResponse.ok)
            throw new Error('Failed to fetch assessments');
          const assessmentsData = await assessmentsResponse.json();
          setAssessments(Array.isArray(assessmentsData) ? assessmentsData : []);

          // Fetch results for each student
          const resultsData: Record<number, AssessmentResult[]> = {};
          for (const student of studentsData) {
            try {
              const resultsResponse = await fetch(
                `/api/assessment-results?studentId=${student.id}&sectionId=${selectedSection}`
              );
              if (resultsResponse.ok) {
                const studentResults = await resultsResponse.json();
                if (studentResults.success) {
                  resultsData[student.id] = studentResults.data || [];
                } else {
                  resultsData[student.id] = Array.isArray(studentResults)
                    ? studentResults
                    : [];
                }
              }
            } catch (err) {
              console.error(`Error fetching results for student ${student.id}:`, err);
              resultsData[student.id] = [];
            }
          }
          setResults(resultsData);
        }
      } catch (err) {
        setError('Failed to load data');
        console.error(err);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedSection, sections]);

  const handleStatusChange = async (
    studentId: number,
    resultId: number,
    newStatus: 'pending' | 'evaluated' | 'published' | 'draft'
  ) => {
    try {
      const response = await fetch(`/api/assessment-results/${resultId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      // Update local state
      setResults((prev) => ({
        ...prev,
        [studentId]: prev[studentId].map((result) =>
          result.id === resultId ? { ...result, status: newStatus } : result
        ),
      }));

      toast.success('Status updated successfully');
    } catch (err) {
      setError('Failed to update status');
      console.error(err);
      toast.error('Failed to update status');
    }
  };

  const handleRemarksChange = async (
    studentId: number,
    resultId: number,
    remarks: string
  ) => {
    try {
      const response = await fetch(`/api/assessment-results/${resultId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ remarks }),
      });

      if (!response.ok) throw new Error('Failed to update remarks');

      // Update local state
      setResults((prev) => ({
        ...prev,
        [studentId]: prev[studentId].map((result) =>
          result.id === resultId ? { ...result, remarks } : result
        ),
      }));

      toast.success('Remarks updated successfully');
    } catch (err) {
      setError('Failed to update remarks');
      console.error(err);
      toast.error('Failed to update remarks');
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClass = 'text-[10px] px-1.5 py-0.5';
    switch (status) {
      case 'published':
        return <Badge className={`bg-[var(--success-green)] text-white ${baseClass}`} variant="secondary">Published</Badge>;
      case 'evaluated':
        return <Badge className={`bg-[var(--primary-500)] text-white ${baseClass}`} variant="secondary">Evaluated</Badge>;
      case 'pending':
        return <Badge className={`bg-[var(--gray-500)] text-white ${baseClass}`} variant="secondary">Pending</Badge>;
      case 'draft':
        return <Badge className={`bg-[var(--gray-400)] text-white ${baseClass}`} variant="secondary">Draft</Badge>;
      default:
        return <Badge className={baseClass} variant="secondary">{status}</Badge>;
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-4">
      {/* Header - CLO style */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: iconBgColor }}
        >
          <ClipboardCheck className="h-5 w-5" style={{ color: primaryColor }} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-primary-text">Result Evaluation</h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Review and moderate assessment results
          </p>
        </div>
      </div>

      <Card className="rounded-lg border border-card-border bg-card p-6">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-sm font-bold text-primary-text">Select Section</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-2">
            <Label htmlFor="section" className="text-xs text-primary-text">Section *</Label>
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger id="section" className="h-8 text-xs bg-card border-card-border text-primary-text">
                <SelectValue placeholder="Select a section" />
              </SelectTrigger>
              <SelectContent className="bg-card border-card-border">
                {sections.map((section) => (
                  <SelectItem
                    key={section.id}
                    value={section.id.toString()}
                    className="text-primary-text hover:bg-card/50"
                  >
                    {section.courseOffering.course.code} - {section.name} (
                    {section.courseOffering.semester.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-card-border bg-card p-4" style={{ borderColor: 'var(--error-opacity-20)' }}>
          <p className="text-xs" style={{ color: 'var(--error)' }}>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-card-border bg-card p-8 flex flex-col items-center justify-center gap-3">
          <div
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderTopColor: primaryColor, borderRightColor: 'transparent', borderBottomColor: primaryColor, borderLeftColor: 'transparent' }}
          />
          <p className="text-xs text-secondary-text">Loading...</p>
        </div>
      ) : selectedSection && students.length > 0 ? (
        <Card className="rounded-lg border border-card-border bg-card overflow-hidden">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold text-primary-text">Assessment Results</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="overflow-x-auto rounded-lg border border-card-border">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-card-border">
                    <TableHead className="text-xs font-semibold text-primary-text">Roll No</TableHead>
                    <TableHead className="text-xs font-semibold text-primary-text">Student Name</TableHead>
                    {assessments.map((assessment) => (
                      <TableHead key={assessment.id} className="text-xs font-semibold text-primary-text">
                        <div>{assessment.title}</div>
                        <div className="text-[10px] text-secondary-text font-normal">
                          {assessment.type}
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="text-xs font-semibold text-primary-text">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-primary-text">Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id} className="hover:bg-hover-bg transition-colors">
                      <TableCell className="text-xs font-medium text-primary-text">
                        {student.rollNumber}
                      </TableCell>
                      <TableCell className="text-xs text-primary-text">
                        {student.user.name ||
                          `${student.user.firstName} ${student.user.lastName}`}
                      </TableCell>
                      {assessments.map((assessment) => {
                        const result = results[student.id]?.find(
                          (r) => r.assessmentId === assessment.id
                        );
                        return (
                          <TableCell key={assessment.id} className="text-xs text-primary-text">
                            {result ? (
                              <div>
                                <div className="font-medium">
                                  {result.obtainedMarks} / {result.totalMarks}
                                </div>
                                <div className="text-[10px] text-secondary-text">
                                  {result.percentage.toFixed(1)}%
                                </div>
                              </div>
                            ) : (
                              <span className="text-secondary-text">N/A</span>
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-xs">
                        {results[student.id]?.map((result) => (
                          <Select
                            key={result.id}
                            value={result.status}
                            onValueChange={(value: any) =>
                              handleStatusChange(
                                student.id,
                                result.id,
                                value
                              )
                            }
                          >
                            <SelectTrigger className="w-[140px] h-8 text-xs bg-card border-card-border text-primary-text">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-card-border">
                              <SelectItem value="pending" className="text-primary-text hover:bg-card/50">Pending</SelectItem>
                              <SelectItem value="evaluated" className="text-primary-text hover:bg-card/50">Evaluated</SelectItem>
                              <SelectItem value="published" className="text-primary-text hover:bg-card/50">Published</SelectItem>
                              <SelectItem value="draft" className="text-primary-text hover:bg-card/50">Draft</SelectItem>
                            </SelectContent>
                          </Select>
                        ))}
                      </TableCell>
                      <TableCell className="text-xs">
                        {results[student.id]?.map((result) => (
                          <Textarea
                            key={result.id}
                            value={result.remarks || ''}
                            onChange={(e) =>
                              handleRemarksChange(
                                student.id,
                                result.id,
                                e.target.value
                              )
                            }
                            placeholder="Add remarks..."
                            rows={2}
                            className="min-w-[200px] text-xs bg-card border-card-border text-primary-text placeholder:text-secondary-text"
                          />
                        ))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : selectedSection ? (
        <div className="rounded-lg border border-card-border bg-card p-8">
          <div className="text-center text-xs text-secondary-text py-4">
            No students found in this section
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-card-border bg-card p-8">
          <div className="text-center text-xs text-secondary-text py-4">
            Please select a section to view results
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultEvaluationPage;
