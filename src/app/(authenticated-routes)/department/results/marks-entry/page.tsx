'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BulkMarksEntry } from '@/components/assessments/BulkMarksEntry';
import { ResultModeration } from '@/components/assessments/ResultModeration';

interface CourseOffering {
  id: number;
  course: {
    code: string;
    name: string;
  };
  semester: {
    name: string;
  };
}

interface Section {
  id: number;
  name: string;
  courseOffering: CourseOffering;
}

interface Student {
  id: number;
  rollNumber: string;
  user: {
    name: string;
  };
}

interface Assessment {
  id: number;
  title: string;
  type: string;
  totalMarks: number;
  assessmentItems: AssessmentItem[];
}

interface AssessmentItem {
  id: number;
  questionNo: string;
  marks: number;
  cloId: number;
}

interface Marks {
  [studentId: number]: {
    [itemId: number]: number;
  };
}

const MarksEntryPage = () => {
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<number | null>(
    null
  );
  const [marks, setMarks] = useState<Marks>({});
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

  // Fetch students and assessments when section is selected
  useEffect(() => {
    if (!selectedSection) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch students in the section
        const studentsResponse = await fetch(
          `/api/sections/${selectedSection}/students`
        );
        if (!studentsResponse.ok) throw new Error('Failed to fetch students');
        const studentsData = await studentsResponse.json();
        setStudents(studentsData);

        // Fetch assessments for the section
        const assessmentsResponse = await fetch(
          `/api/sections/${selectedSection}/assessments`
        );
        if (!assessmentsResponse.ok)
          throw new Error('Failed to fetch assessments');
        const assessmentsData = await assessmentsResponse.json();
        setAssessments(assessmentsData);

        // Initialize marks object
        const initialMarks: Marks = {};
        studentsData.forEach((student: Student) => {
          initialMarks[student.id] = {};
          assessmentsData.forEach((assessment: Assessment) => {
            assessment.assessmentItems.forEach((item: AssessmentItem) => {
              initialMarks[student.id][item.id] = 0;
            });
          });
        });
        setMarks(initialMarks);
      } catch (err) {
        setError('Failed to load data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedSection]);

  const handleMarkChange = (
    studentId: number,
    itemId: number,
    value: number
  ) => {
    setMarks((prev: Marks) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [itemId]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!selectedSection || !selectedAssessment) return;

    setLoading(true);
    try {
      const response = await fetch('/api/assessment-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sectionId: selectedSection,
          marks: Object.entries(marks).map(([studentId, itemMarks]) => ({
            studentId: parseInt(studentId),
            assessmentId: selectedAssessment,
            items: Object.entries(itemMarks).map(([itemId, mark]) => ({
              itemId: parseInt(itemId),
              marks: mark,
              totalMarks:
                assessments
                  .find((a) => a.id === selectedAssessment)
                  ?.assessmentItems.find((item) => item.id === parseInt(itemId))
                  ?.marks || 0,
            })),
          })),
        }),
      });

      if (!response.ok) throw new Error('Failed to save marks');

      alert('Marks saved successfully!');
      router.refresh();
    } catch (err) {
      setError('Failed to save marks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedAssessmentData = assessments.find(
    (a) => a.id === selectedAssessment
  );

  return (
    <div className='p-6'>
      <h1 className='text-2xl font-bold mb-6'>Marks Entry</h1>

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
      ) : selectedSection && selectedAssessment && selectedAssessmentData ? (
        <div className='space-y-6'>
          <BulkMarksEntry
            sectionId={selectedSection}
            assessmentId={selectedAssessment}
            assessment={selectedAssessmentData}
            students={students}
            onSuccess={() => {
              // Refresh data or show success message
              router.refresh();
            }}
          />

          <div className='mt-8'>
            <h2 className='text-xl font-semibold mb-4'>Result Moderation</h2>
            <ResultModeration
              sectionId={selectedSection}
              assessmentId={selectedAssessment}
              students={students}
            />
          </div>
        </div>
      ) : (
        <div className='text-center text-gray-500 py-4'>
          Select a section and assessment to enter marks
        </div>
      )}
    </div>
  );
};

export default MarksEntryPage;
