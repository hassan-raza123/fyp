'use client';

import React, { useState, useEffect } from 'react';
import { PLOAttainments } from '@/components/assessments/PLOAttainments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
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
  const [programs, setPrograms] = useState<Program[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch programs
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
        } else {
          console.error('Invalid programs data format:', result);
          setError('Invalid programs data format received from server');
        }
      } catch (err) {
        console.error('Error fetching programs:', err);
        setError('Failed to load programs');
        toast.error('Failed to load programs');
      } finally {
        setLoading(false);
      }
    };
    fetchPrograms();
  }, []);

  // Fetch semesters
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
        } else {
          console.error('Invalid semesters data format:', result);
          setError('Invalid semesters data format received from server');
        }
      } catch (err) {
        console.error('Error fetching semesters:', err);
        setError('Failed to load semesters');
        toast.error('Failed to load semesters');
      }
    };
    fetchSemesters();
  }, []);

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">PLO Attainments</h1>
        <p className="text-muted-foreground">
          Track and analyze Program Learning Outcome achievements
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="p-6 mb-6">
        <CardHeader>
          <CardTitle>Select Program and Semester</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="program">Program *</Label>
              <Select
                value={selectedProgram}
                onValueChange={setSelectedProgram}
                disabled={loading || !programs.length}
              >
                <SelectTrigger id="program">
                  <SelectValue placeholder="Select a program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id.toString()}>
                      {program.code} - {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {programs.length === 0 && !loading && (
                <p className="text-sm text-muted-foreground">
                  No programs found
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="semester">Semester *</Label>
              <Select
                value={selectedSemester}
                onValueChange={setSelectedSemester}
                disabled={loading || !semesters.length}
              >
                <SelectTrigger id="semester">
                  <SelectValue placeholder="Select a semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((semester) => (
                    <SelectItem
                      key={semester.id}
                      value={semester.id.toString()}
                    >
                      {semester.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {semesters.length === 0 && !loading && (
                <p className="text-sm text-muted-foreground">
                  No semesters found
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card className="p-6">
          <div className="text-center py-4">Loading data...</div>
        </Card>
      ) : selectedProgram && selectedSemester ? (
        <PLOAttainments
          programId={parseInt(selectedProgram)}
          semesterId={parseInt(selectedSemester)}
        />
      ) : (
        <Card className="p-6">
          <div className="text-center text-muted-foreground py-4">
            {!selectedProgram || !selectedSemester
              ? 'Please select a program and semester to view PLO attainments'
              : 'No data available'}
          </div>
        </Card>
      )}
    </div>
  );
};

export default PLOAttainmentsPage;
