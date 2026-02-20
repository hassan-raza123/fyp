'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { PenLine } from 'lucide-react';
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
  const [selectedAssessment, setSelectedAssessment] = useState<string>('');
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
          <PenLine className="h-5 w-5" style={{ color: primaryColor }} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-primary-text">Marks Entry</h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Enter student marks for assessments
          </p>
        </div>
      </div>

      <Card className="rounded-lg border border-card-border bg-card p-6">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-sm font-bold text-primary-text">Select Section and Assessment</CardTitle>
        </CardHeader>
        <CardContent className="p-0 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="section" className="text-xs text-primary-text">Section *</Label>
              <Select
                value={selectedSection}
                onValueChange={setSelectedSection}
              >
                <SelectTrigger id="section" className="h-8 text-xs bg-card border-card-border text-primary-text">
                  <SelectValue placeholder="Select a section" />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  {sections.map((section) => (
                    <SelectItem key={section.id} value={section.id.toString()} className="text-primary-text hover:bg-card/50">
                      {section.courseOffering.course.code} - {section.name} (
                      {section.courseOffering.semester.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSection && (
              <div className="space-y-2">
                <Label htmlFor="assessment" className="text-xs text-primary-text">Assessment *</Label>
                <Select
                  value={selectedAssessment}
                  onValueChange={setSelectedAssessment}
                  disabled={assessments.length === 0}
                >
                  <SelectTrigger id="assessment" className="h-8 text-xs bg-card border-card-border text-primary-text">
                    <SelectValue placeholder="Select an assessment" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-card-border">
                    {assessments.map((assessment) => (
                      <SelectItem
                        key={assessment.id}
                        value={assessment.id.toString()}
                        className="text-primary-text hover:bg-card/50"
                      >
                        {assessment.title} ({assessment.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {assessments.length === 0 && (
                  <p className="text-xs text-secondary-text">
                    No assessments found for this section
                  </p>
                )}
              </div>
            )}
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
      ) : selectedSection && selectedAssessment && selectedAssessmentData ? (
        <div className="space-y-6">
          <Card className="rounded-lg border border-card-border bg-card">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold text-primary-text">Bulk Marks Entry</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
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

          <Card className="rounded-lg border border-card-border bg-card">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold text-primary-text">Result Moderation</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
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
        <div className="rounded-lg border border-card-border bg-card p-8">
          <div className="text-center text-xs text-secondary-text py-4">
            {!selectedSection
              ? 'Please select a section to enter marks'
              : !selectedAssessment
              ? 'Please select an assessment to enter marks'
              : 'No data available'}
          </div>
        </div>
      )}
    </div>
  );
};

export default MarksEntryPage;
