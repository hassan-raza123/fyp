'use client';

import React, { useState, useEffect } from 'react';
import { CLOAttainments } from '@/components/assessments/CLOAttainments';

interface Section {
  id: number;
  name: string;
  courseOffering: {
    course: {
      id: number;
      code: string;
    };
    semester: {
      name: string;
    };
  };
}

const CLOAttainmentsPage = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
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

  const selectedSectionData = sections.find(
    (section) => section.id === selectedSection
  );

  return (
    <div className='p-6'>
      <h1 className='text-2xl font-bold mb-6'>CLO Attainments</h1>

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

      {error && (
        <div className='mb-4 p-3 bg-red-100 text-red-700 rounded'>{error}</div>
      )}

      {loading ? (
        <div className='text-center py-4'>Loading...</div>
      ) : selectedSection && selectedSectionData ? (
        <CLOAttainments
          sectionId={selectedSection}
          courseId={selectedSectionData.courseOffering.course.id}
        />
      ) : (
        <div className='text-center text-gray-500 py-4'>
          Select a section to view CLO attainments
        </div>
      )}
    </div>
  );
};

export default CLOAttainmentsPage;
