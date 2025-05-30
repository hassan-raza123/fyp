'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

const MarksEntryPage = () => {
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [marks, setMarks] = useState<Record<string, Record<number, number>>>(
    {}
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
        const initialMarks: Record<string, Record<number, number>> = {};
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
    setMarks((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [itemId]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!selectedSection) return;

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
            assessmentId: assessments[0].id, // Assuming we're submitting for the first assessment
            items: Object.entries(itemMarks).map(([itemId, mark]) => ({
              itemId: parseInt(itemId),
              marks: mark,
              totalMarks:
                assessments[0].assessmentItems.find(
                  (item) => item.id === parseInt(itemId)
                )?.marks || 0,
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

  const hasAssessmentsWithItems =
    assessments.length > 0 &&
    assessments.some(
      (assessment) =>
        assessment.assessmentItems && assessment.assessmentItems.length > 0
    );

  return (
    <div className='p-6'>
      <h2 className='text-xl font-semibold mb-4'>Marks Entry</h2>

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
      ) : selectedSection && students.length > 0 && hasAssessmentsWithItems ? (
        <div className='overflow-x-auto'>
          <table className='min-w-full bg-white border'>
            <thead>
              <tr>
                <th className='border p-2'>Roll No</th>
                <th className='border p-2'>Student Name</th>
                {assessments.map((assessment) => (
                  <React.Fragment key={assessment.id}>
                    <th
                      colSpan={assessment.assessmentItems.length}
                      className='border p-2 text-center'
                    >
                      {assessment.title} ({assessment.type})
                    </th>
                  </React.Fragment>
                ))}
              </tr>
              <tr>
                <th className='border p-2'></th>
                <th className='border p-2'></th>
                {assessments.map((assessment) =>
                  assessment.assessmentItems.map((item) => (
                    <th key={item.id} className='border p-2'>
                      Q{item.questionNo} ({item.marks})
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td className='border p-2'>{student.rollNumber}</td>
                  <td className='border p-2'>{student.user.name}</td>
                  {assessments.map((assessment) =>
                    assessment.assessmentItems.map((item) => (
                      <td key={item.id} className='border p-2'>
                        <input
                          type='number'
                          min='0'
                          max={item.marks}
                          value={marks[student.id]?.[item.id] || 0}
                          onChange={(e) =>
                            handleMarkChange(
                              student.id,
                              item.id,
                              Number(e.target.value)
                            )
                          }
                          className='w-20 p-1 border rounded'
                        />
                      </td>
                    ))
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          <div className='mt-4'>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50'
            >
              {loading ? 'Saving...' : 'Save Marks'}
            </button>
          </div>
        </div>
      ) : selectedSection && students.length > 0 && !hasAssessmentsWithItems ? (
        <div className='text-center py-4 text-red-600 font-semibold'>
          No assessments or assessment items found for this section.
          <br />
          Please create at least one assessment and add questions/items to it
          before entering marks.
        </div>
      ) : selectedSection ? (
        <div className='text-center py-4'>
          No students found in this section
        </div>
      ) : null}
    </div>
  );
};

export default MarksEntryPage;
