'use client';

import React, { useState, useEffect } from 'react';
import { SessionsManager } from '@/components/assessments/SessionsManager';
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

const SessionsPage = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch sections
  useEffect(() => {
    const fetchSections = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/sections');
        if (!response.ok) throw new Error('Failed to fetch sections');
        const result = await response.json();
        // Assuming /api/sections returns an array directly
        if (Array.isArray(result)) {
          setSections(result);
        } else if (result.success && Array.isArray(result.data)) {
          // Handle wrapped response if applicable
          setSections(result.data);
        } else {
          console.error('Invalid sections data format:', result);
          setError('Invalid sections data format received from server');
        }
      } catch (err) {
        console.error('Error fetching sections:', err);
        setError('Failed to load sections');
      } finally {
        setLoading(false);
      }
    };
    fetchSections();
  }, []);

  return (
    <div className='p-6'>
      <h1 className='text-2xl font-bold mb-6'>Sessions Management</h1>

      {error && (
        <Alert variant='destructive' className='mb-4'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Section Selection */}
      <div className='mb-6'>
        <label className='block text-sm font-medium mb-2'>Select Section</label>
        <Select
          value={selectedSection?.toString() || ''}
          onValueChange={(value) => setSelectedSection(Number(value))}
          disabled={loading || !sections.length}
        >
          <SelectTrigger>
            <SelectValue placeholder='Select a section' />
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

      {loading ? (
        <Loading message='Loading sections...' />
      ) : selectedSection ? (
        <SessionsManager sectionId={selectedSection} />
      ) : (
        <div className='text-center text-gray-500 py-4'>
          Select a section to view and manage sessions.
        </div>
      )}
    </div>
  );
};

export default SessionsPage;
