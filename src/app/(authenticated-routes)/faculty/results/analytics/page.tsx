'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { ResultAnalytics } from '@/components/assessments/ResultAnalytics';
import { BarChart3 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Section {
  id: number;
  name: string;
  courseOffering: {
    course: { code: string };
    semester: { name: string };
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
  const isDarkMode = mounted && resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode
    ? 'rgba(252, 153, 40, 0.15)'
    : 'rgba(38, 40, 149, 0.15)';

  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await fetch('/api/sections');
        if (!response.ok) throw new Error('Failed to fetch sections');
        const data = await response.json();
        setSections(Array.isArray(data) ? data : data?.data ?? []);
      } catch (err) {
        setError('Failed to load sections');
        console.error(err);
      }
    };
    fetchSections();
  }, []);

  useEffect(() => {
    if (!selectedSection) return;
    setLoading(true);
    fetch(`/api/sections/${selectedSection}/assessments`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed'))))
      .then((data) => setAssessments(Array.isArray(data) ? data : []))
      .catch(() => setAssessments([]))
      .finally(() => setLoading(false));
  }, [selectedSection]);

  if (!mounted) return null;

  return (
    <div className="space-y-4">
      {/* Header - same as Results Management / admin CLO */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: iconBgColor }}
        >
          <BarChart3 className="h-5 w-5" style={{ color: primaryColor }} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-primary-text">Analytics</h1>
          <p className="text-xs text-secondary-text mt-0.5">
            View detailed analytics and performance metrics
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[200px] max-w-md">
          <label className="block text-xs text-secondary-text mb-1">Section</label>
          <Select
            value={selectedSection?.toString() ?? ''}
            onValueChange={(v) => setSelectedSection(v ? Number(v) : null)}
          >
            <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
              <SelectValue placeholder="Select a section" />
            </SelectTrigger>
            <SelectContent className="bg-card border-card-border">
              {sections.map((s) => (
                <SelectItem
                  key={s.id}
                  value={s.id.toString()}
                  className="text-primary-text hover:bg-card/50"
                >
                  {s.courseOffering.course.code} - {s.name} ({s.courseOffering.semester.name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedSection && (
          <div className="min-w-[200px] max-w-md">
            <label className="block text-xs text-secondary-text mb-1">Assessment</label>
            <Select
              value={selectedAssessment?.toString() ?? ''}
              onValueChange={(v) => setSelectedAssessment(v ? Number(v) : null)}
              disabled={loading}
            >
              <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
                <SelectValue placeholder="Select an assessment" />
              </SelectTrigger>
              <SelectContent className="bg-card border-card-border">
                {assessments.map((a) => (
                  <SelectItem
                    key={a.id}
                    value={a.id.toString()}
                    className="text-primary-text hover:bg-card/50"
                  >
                    {a.title} ({a.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-card-border bg-card p-3 text-xs text-secondary-text">
          {error}
        </div>
      )}

      {loading && !assessments.length ? (
        <div className="flex items-center justify-center min-h-[200px] bg-page rounded-lg border border-card-border">
          <p className="text-xs text-secondary-text">Loading...</p>
        </div>
      ) : selectedSection && selectedAssessment ? (
        <div className="rounded-lg border border-card-border bg-card overflow-hidden">
          <ResultAnalytics sectionId={selectedSection} assessmentId={selectedAssessment} />
        </div>
      ) : (
        <div className="rounded-lg border border-card-border bg-card p-8 text-center">
          <p className="text-xs text-secondary-text">
            Select a section and assessment to view analytics
          </p>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
