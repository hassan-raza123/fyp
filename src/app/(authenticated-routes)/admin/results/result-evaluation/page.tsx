'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
        const response = await fetch('/api/sections?status=active');
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
    switch (status) {
      case 'published':
        return <Badge variant="default">Published</Badge>;
      case 'evaluated':
        return <Badge variant="default">Evaluated</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Result Evaluation</h1>
        <p className="text-muted-foreground">
          Review and moderate assessment results
        </p>
      </div>

      <Card className="p-6 mb-6">
        <CardHeader>
          <CardTitle>Select Section</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="section">Section *</Label>
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger id="section">
                <SelectValue placeholder="Select a section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section) => (
                  <SelectItem
                    key={section.id}
                    value={section.id.toString()}
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
        <Card className="p-4 mb-6 border-red-200 bg-red-50">
          <p className="text-red-700">{error}</p>
        </Card>
      )}

      {loading ? (
        <Card className="p-6">
          <div className="text-center py-4">Loading...</div>
        </Card>
      ) : selectedSection && students.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Assessment Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Student Name</TableHead>
                    {assessments.map((assessment) => (
                      <TableHead key={assessment.id}>
                        <div>{assessment.title}</div>
                        <div className="text-xs text-muted-foreground font-normal">
                          {assessment.type}
                        </div>
                      </TableHead>
                    ))}
                    <TableHead>Status</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.rollNumber}
                      </TableCell>
                      <TableCell>
                        {student.user.name ||
                          `${student.user.firstName} ${student.user.lastName}`}
                      </TableCell>
                      {assessments.map((assessment) => {
                        const result = results[student.id]?.find(
                          (r) => r.assessmentId === assessment.id
                        );
                        return (
                          <TableCell key={assessment.id}>
                            {result ? (
                              <div>
                                <div className="font-medium">
                                  {result.obtainedMarks} / {result.totalMarks}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {result.percentage.toFixed(1)}%
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell>
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
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="evaluated">Evaluated</SelectItem>
                              <SelectItem value="published">Published</SelectItem>
                              <SelectItem value="draft">Draft</SelectItem>
                            </SelectContent>
                          </Select>
                        ))}
                      </TableCell>
                      <TableCell>
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
                            className="min-w-[200px]"
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
        <Card className="p-6">
          <div className="text-center text-muted-foreground py-4">
            No students found in this section
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="text-center text-muted-foreground py-4">
            Please select a section to view results
          </div>
        </Card>
      )}
    </div>
  );
};

export default ResultEvaluationPage;
