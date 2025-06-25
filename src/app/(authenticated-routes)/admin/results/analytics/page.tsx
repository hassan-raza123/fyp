'use client';

import React, { useState, useEffect } from 'react';
import { ResultAnalytics } from '@/components/assessments/ResultAnalytics';
import { BulkMarksEntry } from '@/components/assessments/BulkMarksEntry';
import { ResultModeration } from '@/components/assessments/ResultModeration';

interface Section {
  id: number;
  name: string;
  courseOffering: {
    course: {
      code: string;
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
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<number | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch sections on component mount
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await fetch('/api/sections');
        if (!response.ok) throw new Error('Failed to fetch sections');
        const data = await response.json();
        setSections(data);
      } catch (err) {
        setError('Failed to load sections');
        console.error(err);
      }
    };
    fetchSections();
  }, []);

  // Fetch assessments when section is selected
  useEffect(() => {
    if (!selectedSection) return;

    const fetchAssessments = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/sections/${selectedSection}/assessments`
        );
        if (!response.ok) throw new Error('Failed to fetch assessments');
        const data = await response.json();
        setAssessments(data);
      } catch (err) {
        setError('Failed to load assessments');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, [selectedSection]);

  return (
    <div className='p-6'>
      <h1 className='text-2xl font-bold mb-6'>Result Analytics</h1>

      {/* Section Selection */}
      <div className='mb-6'>
        <label className='block text-sm font-medium mb-2'>Select Section</label>
        <select
          className='w-full max-w-md p-2 border rounded'
          value={selectedSection || ''}
          onChange={(e) => setSelectedSection(Number(e.target.value))}
        >
          <option value=''>Select a section</option>
          {sections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.courseOffering.course.code} - {section.name} (
              {section.courseOffering.semester.name})
            </option>
          ))}
        </select>
      </div>

      {/* Assessment Selection */}
      {selectedSection && (
        <div className='mb-6'>
          <label className='block text-sm font-medium mb-2'>
            Select Assessment
          </label>
          <select
            className='w-full max-w-md p-2 border rounded'
            value={selectedAssessment || ''}
            onChange={(e) => setSelectedAssessment(Number(e.target.value))}
          >
            <option value=''>Select an assessment</option>
            {assessments.map((assessment) => (
              <option key={assessment.id} value={assessment.id}>
                {assessment.title} ({assessment.type})
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className='mb-4 p-3 bg-red-100 text-red-700 rounded'>{error}</div>
      )}

      {loading ? (
        <div className='text-center py-4'>Loading...</div>
      ) : selectedSection && selectedAssessment ? (
        <div className='space-y-6'>
          <ResultAnalytics
            sectionId={selectedSection}
            assessmentId={selectedAssessment}
          />
        </div>
      ) : (
        <div className='text-center text-gray-500 py-4'>
          Select a section and assessment to view analytics
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
