'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { BarChart3 } from 'lucide-react';
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
    id: number;
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
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode
    ? 'rgba(252, 153, 40, 0.15)'
    : 'rgba(38, 40, 149, 0.15)';

  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted) return null;

  return (
    <div className="space-y-4">
      {/* Header - CLO style */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: iconBgColor }}
        >
          <BarChart3 className="h-5 w-5" style={{ color: primaryColor }} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-primary-text">Result Analytics</h1>
          <p className="text-xs text-secondary-text mt-0.5">
            View detailed analytics and performance metrics for assessments
          </p>
        </div>
      </div>

      <Card className="rounded-lg border border-card-border bg-card p-6">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-sm font-bold text-primary-text">Select Section and Assessment</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="section" className="text-xs text-primary-text">Section *</Label>
              <Select
                value={selectedSection}
                onValueChange={setSelectedSection}
                disabled={loading}
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
                  disabled={loading || assessments.length === 0}
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
                {assessments.length === 0 && !loading && (
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
          <p className="text-xs text-secondary-text" style={{ color: 'var(--error)' }}>{error}</p>
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
      ) : selectedSection && selectedAssessment ? (
        <ResultAnalytics
          sectionId={parseInt(selectedSection)}
          assessmentId={parseInt(selectedAssessment)}
        />
      ) : (
        <div className="rounded-lg border border-card-border bg-card p-8">
          <div className="text-center text-xs text-secondary-text py-4">
            {!selectedSection || !selectedAssessment
              ? 'Please select a section and assessment to view analytics'
              : 'No data available'}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
