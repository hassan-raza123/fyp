'use client';

import { useState, useEffect } from 'react';
import { Target } from 'lucide-react';
import { CLOAttainments } from '@/components/assessments/CLOAttainments';
import { useTheme } from 'next-themes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface Section {
  id: number;
  name: string;
  courseOffering: {
    course: {
      id: number;
      code: string;
      name: string;
    };
    semester: {
      name: string;
    };
  };
}

const CLOAttainmentsPage = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode
    ? 'rgba(252, 153, 40, 0.15)'
    : 'rgba(38, 40, 149, 0.15)';

  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
        toast.error('Failed to load sections');
      } finally {
        setLoading(false);
      }
    };
    fetchSections();
  }, []);

  const selectedSectionData = sections.find(
    (section) => section.id.toString() === selectedSection
  );

  if (!mounted) return null;

  if (loading) {
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
          <p className="text-xs text-secondary-text">Loading CLO Attainments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header - CLO style */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: iconBgColor }}
        >
          <Target className="h-5 w-5" style={{ color: primaryColor }} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-primary-text">CLO Attainments</h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Calculate and analyze Course Learning Outcome achievement percentages
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Select
            value={selectedSection}
            onValueChange={setSelectedSection}
            disabled={loading}
          >
            <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
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
      </div>

      {/* Content */}
      {selectedSection && selectedSectionData ? (
        <CLOAttainments
          sectionId={parseInt(selectedSection)}
          courseId={selectedSectionData.courseOffering.course.id}
        />
      ) : (
        <div className="rounded-lg border border-card-border bg-card p-8">
          <div className="text-center text-xs text-secondary-text">
            Please select a section to view CLO attainments
          </div>
        </div>
      )}
    </div>
  );
};

export default CLOAttainmentsPage;
