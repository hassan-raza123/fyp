'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BulkMarksEntry } from '@/components/assessments/BulkMarksEntry';
import { ResultModeration } from '@/components/assessments/ResultModeration';
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
  assessmentItems: AssessmentItem[];
}

interface AssessmentItem {
  id: number;
  questionNo: string;
  marks: number;
  cloId: number;
}

const MarksEntryPage = () => {
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<string>('');
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

  // Fetch students and assessments when section is selected
  useEffect(() => {
    if (!selectedSection) {
      setStudents([]);
      setAssessments([]);
      setSelectedAssessment('');
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
        const section = sections.find(
          (s) => s.id.toString() === selectedSection
        );
        if (section) {
          const assessmentsResponse = await fetch(
            `/api/assessments?courseOfferingId=${section.courseOffering.id}`
          );
          if (!assessmentsResponse.ok)
            throw new Error('Failed to fetch assessments');
          const assessmentsData = await assessmentsResponse.json();
          setAssessments(Array.isArray(assessmentsData) ? assessmentsData : []);
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

  const selectedAssessmentData = assessments.find(
    (a) => a.id.toString() === selectedAssessment
  );

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Marks Entry</h1>
        <p className="text-muted-foreground">
          Enter student marks for assessments
        </p>
      </div>

      <Card className="p-6 mb-6">
        <CardHeader>
          <CardTitle>Select Section and Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="section">Section *</Label>
              <Select
                value={selectedSection}
                onValueChange={setSelectedSection}
              >
                <SelectTrigger id="section">
                  <SelectValue placeholder="Select a section" />
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

            {selectedSection && (
              <div className="space-y-2">
                <Label htmlFor="assessment">Assessment *</Label>
                <Select
                  value={selectedAssessment}
                  onValueChange={setSelectedAssessment}
                  disabled={assessments.length === 0}
                >
                  <SelectTrigger id="assessment">
                    <SelectValue placeholder="Select an assessment" />
                  </SelectTrigger>
                  <SelectContent>
                    {assessments.map((assessment) => (
                      <SelectItem
                        key={assessment.id}
                        value={assessment.id.toString()}
                      >
                        {assessment.title} ({assessment.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {assessments.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No assessments found for this section
                  </p>
                )}
              </div>
            )}
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
      ) : selectedSection && selectedAssessment && selectedAssessmentData ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Marks Entry</CardTitle>
            </CardHeader>
            <CardContent>
              <BulkMarksEntry
                sectionId={parseInt(selectedSection)}
                assessmentId={parseInt(selectedAssessment)}
                assessment={selectedAssessmentData}
                students={students.map((s) => ({
                  ...s,
                  user: {
                    name:
                      s.user.name || `${s.user.firstName} ${s.user.lastName}`,
                  },
                }))}
                onSuccess={() => {
                  toast.success('Marks saved successfully');
                  router.refresh();
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Result Moderation</CardTitle>
            </CardHeader>
            <CardContent>
              <ResultModeration
                sectionId={parseInt(selectedSection)}
                assessmentId={parseInt(selectedAssessment)}
                students={students.map((s) => ({
                  ...s,
                  user: {
                    name:
                      s.user.name || `${s.user.firstName} ${s.user.lastName}`,
                  },
                }))}
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="p-6">
          <div className="text-center text-muted-foreground py-4">
            {!selectedSection
              ? 'Please select a section to enter marks'
              : !selectedAssessment
              ? 'Please select an assessment to enter marks'
              : 'No data available'}
          </div>
        </Card>
      )}
    </div>
  );
};

export default MarksEntryPage;
