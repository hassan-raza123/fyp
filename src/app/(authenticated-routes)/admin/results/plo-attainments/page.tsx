'use client';

import { useState, useEffect } from 'react';
import { PLOAttainments } from '@/components/assessments/PLOAttainments';
import { useTheme } from 'next-themes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface Program {
  id: number;
  name: string;
  code: string;
}

interface Semester {
  id: number;
  name: string;
}

const PLOAttainmentsPage = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';

  const [programs, setPrograms] = useState<Program[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchPrograms = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/programs');
        if (!response.ok) throw new Error('Failed to fetch programs');
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setPrograms(result.data);
        } else if (Array.isArray(result)) {
          setPrograms(result as Program[]);
        }
      } catch (err) {
        toast.error('Failed to load programs');
      } finally {
        setLoading(false);
      }
    };
    fetchPrograms();
  }, []);

  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const response = await fetch('/api/semesters');
        if (!response.ok) throw new Error('Failed to fetch semesters');
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setSemesters(result.data);
        } else if (Array.isArray(result)) {
          setSemesters(result as Semester[]);
        }
      } catch (err) {
        toast.error('Failed to load semesters');
      }
    };
    fetchSemesters();
  }, []);

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
          <p className="text-xs text-secondary-text">Loading PLO Attainments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-primary-text">PLO Attainments</h1>
        <p className="text-xs text-secondary-text mt-0.5">
          Track and analyze Program Learning Outcome achievements
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Select
            value={selectedProgram}
            onValueChange={setSelectedProgram}
            disabled={!programs.length}
          >
            <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
              <SelectValue placeholder="Select a program" />
            </SelectTrigger>
            <SelectContent className="bg-card border-card-border">
              {programs.map((program) => (
                <SelectItem
                  key={program.id}
                  value={program.id.toString()}
                  className="text-primary-text hover:bg-card/50"
                >
                  {program.code} - {program.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Select
            value={selectedSemester}
            onValueChange={setSelectedSemester}
            disabled={!semesters.length}
          >
            <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
              <SelectValue placeholder="Select a semester" />
            </SelectTrigger>
            <SelectContent className="bg-card border-card-border">
              {semesters.map((semester) => (
                <SelectItem
                  key={semester.id}
                  value={semester.id.toString()}
                  className="text-primary-text hover:bg-card/50"
                >
                  {semester.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      {selectedProgram && selectedSemester ? (
        <PLOAttainments
          programId={parseInt(selectedProgram)}
          semesterId={parseInt(selectedSemester)}
        />
      ) : (
        <div className="rounded-lg border border-card-border bg-card p-8">
          <div className="text-center text-xs text-secondary-text">
            Please select a program and semester to view PLO attainments
          </div>
        </div>
      )}
    </div>
  );
};

export default PLOAttainmentsPage;
