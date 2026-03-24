'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { PLOAttainments } from '@/components/assessments/PLOAttainments';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, GraduationCap } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  const isDarkMode = mounted && resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode
    ? 'rgba(252, 153, 40, 0.15)'
    : 'rgba(38, 40, 149, 0.15)';

  const [programs, setPrograms] = useState<Program[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<number | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchFilters = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/faculty/plo-attainments');
        if (!response.ok) throw new Error('Failed to fetch filters');
        const result = await response.json();
        if (result.success && result.data) {
          setPrograms(result.data.programs ?? []);
          setSemesters(result.data.semesters ?? []);
        } else {
          setError('Failed to load programs and semesters');
        }
      } catch (err) {
        setError('Failed to load filter options');
      } finally {
        setLoading(false);
      }
    };
    fetchFilters();
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-4">
      {/* Header - same as Results Management / admin CLO */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: iconBgColor }}
        >
          <GraduationCap className="h-5 w-5" style={{ color: primaryColor }} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-primary-text">PLO Attainments</h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Track and analyze program learning outcomes
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="rounded-lg border-card-border bg-card">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-primary-text">{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-secondary-text mb-1">Program</label>
          <Select
            value={selectedProgram?.toString() || ''}
            onValueChange={(v) => setSelectedProgram(v ? Number(v) : null)}
            disabled={loading || !programs.length}
          >
            <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
              <SelectValue placeholder="Select a program" />
            </SelectTrigger>
            <SelectContent className="bg-card border-card-border">
              {programs.map((p) => (
                <SelectItem
                  key={p.id}
                  value={p.id.toString()}
                  className="text-primary-text hover:bg-card/50"
                >
                  {p.code} - {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-xs text-secondary-text mb-1">Semester</label>
          <Select
            value={selectedSemester?.toString() || ''}
            onValueChange={(v) => setSelectedSemester(v ? Number(v) : null)}
            disabled={loading || !semesters.length}
          >
            <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
              <SelectValue placeholder="Select a semester" />
            </SelectTrigger>
            <SelectContent className="bg-card border-card-border">
              {semesters.map((s) => (
                <SelectItem
                  key={s.id}
                  value={s.id.toString()}
                  className="text-primary-text hover:bg-card/50"
                >
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px] rounded-lg border border-card-border bg-card">
          <p className="text-xs text-secondary-text">Loading...</p>
        </div>
      ) : selectedProgram && selectedSemester ? (
        <div className="rounded-lg border border-card-border bg-card overflow-hidden">
          <PLOAttainments programId={selectedProgram} semesterId={selectedSemester} apiUrl="/api/faculty/plo-attainments" />
        </div>
      ) : (
        <div className="rounded-lg border border-card-border bg-card p-8 text-center">
          <p className="text-xs text-secondary-text">
            Select a program and semester to view PLO attainments
          </p>
        </div>
      )}
    </div>
  );
};

export default PLOAttainmentsPage;
