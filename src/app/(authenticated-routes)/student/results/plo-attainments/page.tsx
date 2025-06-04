'use client';

import React, { useState, useEffect } from 'react';
import { PLOAttainments } from '@/components/assessments/PLOAttainments';
import { Loading } from '@/components/ui/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
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
  const [programs, setPrograms] = useState<Program[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<number | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
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
          // Handle direct array response
          setPrograms(result as Program[]);
        } else {
          console.error('Invalid programs data format:', result);
          setError('Invalid programs data format received from server');
        }
      } catch (err) {
        console.error('Error fetching programs:', err);
        setError('Failed to load programs');
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
          // Handle direct array response
          setSemesters(result as Semester[]);
        } else {
          console.error('Invalid semesters data format:', result);
          setError('Invalid semesters data format received from server');
        }
      } catch (err) {
        console.error('Error fetching semesters:', err);
        setError('Failed to load semesters');
      }
    };
    fetchSemesters();
  }, []);

  return (
    <div className='p-6'>
      <h1 className='text-2xl font-bold mb-6'>PLO Attainments</h1>

      {error && (
        <Alert variant='destructive' className='mb-4'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Program and Semester Selection */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
        <div>
          <label className='block text-sm font-medium mb-2'>
            Select Program
          </label>
          <Select
            value={selectedProgram?.toString() || ''}
            onValueChange={(value) => setSelectedProgram(Number(value))}
            disabled={loading || !programs.length}
          >
            <SelectTrigger>
              <SelectValue placeholder='Select a program' />
            </SelectTrigger>
            <SelectContent>
              {programs.map((program) => (
                <SelectItem key={program.id} value={program.id.toString()}>
                  {program.code} - {program.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className='block text-sm font-medium mb-2'>
            Select Semester
          </label>
          <Select
            value={selectedSemester?.toString() || ''}
            onValueChange={(value) => setSelectedSemester(Number(value))}
            disabled={loading || !semesters.length}
          >
            <SelectTrigger>
              <SelectValue placeholder='Select a semester' />
            </SelectTrigger>
            <SelectContent>
              {semesters.map((semester) => (
                <SelectItem key={semester.id} value={semester.id.toString()}>
                  {semester.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <Loading message='Loading data...' />
      ) : selectedProgram && selectedSemester ? (
        <PLOAttainments
          programId={selectedProgram}
          semesterId={selectedSemester}
        />
      ) : (
        <div className='text-center text-gray-500 py-4'>
          Select a program and semester to view PLO attainments
        </div>
      )}
    </div>
  );
};

export default PLOAttainmentsPage;
