'use client';

import React, { useState, useEffect } from 'react';
import { ResultAnalytics } from '@/components/assessments/ResultAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Section {
  id: number;
  name: string;
  courseOffering: {
    course: {
      code: string;
      name: string;
    };
    semester: {
      name: string;
    };
  };
}

interface Assessment {
  id: number;
  title: string;
  type: string;
  totalMarks: number;
}

const AnalyticsPage = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch sections on component mount
  useEffect(() => {
    const fetchSections = async () => {
      setLoading(true);
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
      } finally {
        setLoading(false);
      }
    };
    fetchSections();
  }, []);

  // Fetch assessments when section is selected
  useEffect(() => {
    if (!selectedSection) {
      setAssessments([]);
      setSelectedAssessment('');
      return;
    }

    const fetchAssessments = async () => {
      setLoading(true);
      try {
        const section = sections.find((s) => s.id.toString() === selectedSection);
        if (section) {
          const response = await fetch(
            `/api/assessments?courseOfferingId=${section.courseOffering.id}`
          );
          if (!response.ok) throw new Error('Failed to fetch assessments');
          const data = await response.json();
          setAssessments(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        setError('Failed to load assessments');
        console.error(err);
        toast.error('Failed to load assessments');
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, [selectedSection, sections]);

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Result Analytics</h1>
        <p className="text-muted-foreground">
          View detailed analytics and performance metrics for assessments
        </p>
      </div>

      <Card className="p-6 mb-6">
        <CardHeader>
          <CardTitle>Select Section and Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="section">Section *</Label>
              <Select
                value={selectedSection}
                onValueChange={setSelectedSection}
                disabled={loading}
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
                  disabled={loading || assessments.length === 0}
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
                {assessments.length === 0 && !loading && (
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
      ) : selectedSection && selectedAssessment ? (
        <ResultAnalytics
          sectionId={parseInt(selectedSection)}
          assessmentId={parseInt(selectedAssessment)}
        />
      ) : (
        <Card className="p-6">
          <div className="text-center text-muted-foreground py-4">
            {!selectedSection || !selectedAssessment
              ? 'Please select a section and assessment to view analytics'
              : 'No data available'}
          </div>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsPage;
