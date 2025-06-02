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
}

interface AssessmentResult {
  id: number;
  studentId: number;
  assessmentId: number;
  status: 'pending' | 'evaluated' | 'published' | 'draft';
  remarks: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  items: {
    itemId: number;
    marks: number;
  }[];
}

const ResultEvaluationPage = () => {
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [results, setResults] = useState<Record<number, AssessmentResult[]>>(
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

  // Fetch students, assessments, and results when section is selected
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

        // Fetch results for each student
        const resultsData: Record<number, AssessmentResult[]> = {};
        for (const student of studentsData) {
          const resultsResponse = await fetch(
            `/api/students/${student.id}/results?sectionId=${selectedSection}`
          );
          if (!resultsResponse.ok) throw new Error('Failed to fetch results');
          const studentResults = await resultsResponse.json();
          resultsData[student.id] = studentResults;
        }
        setResults(resultsData);
      } catch (err) {
        setError('Failed to load data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedSection]);

  const handleStatusChange = async (
    studentId: number,
    resultId: number,
    newStatus: 'pending' | 'evaluated' | 'published' | 'draft'
  ) => {
    try {
      const response = await fetch(`/api/assessment-results/${resultId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      // Update local state
      setResults((prev) => ({
        ...prev,
        [studentId]: prev[studentId].map((result) =>
          result.id === resultId ? { ...result, status: newStatus } : result
        ),
      }));
    } catch (err) {
      setError('Failed to update status');
      console.error(err);
    }
  };

  const handleRemarksChange = async (
    studentId: number,
    resultId: number,
    remarks: string
  ) => {
    try {
      const response = await fetch(`/api/assessment-results/${resultId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ remarks }),
      });

      if (!response.ok) throw new Error('Failed to update remarks');

      // Update local state
      setResults((prev) => ({
        ...prev,
        [studentId]: prev[studentId].map((result) =>
          result.id === resultId ? { ...result, remarks } : result
        ),
      }));
    } catch (err) {
      setError('Failed to update remarks');
      console.error(err);
    }
  };

  return (
    <div className='p-6'>
      <h2 className='text-xl font-semibold mb-4'>Result Evaluation</h2>

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
      ) : selectedSection && students.length > 0 ? (
        <div className='overflow-x-auto'>
          <table className='min-w-full bg-white border'>
            <thead>
              <tr>
                <th className='border p-2'>Roll No</th>
                <th className='border p-2'>Student Name</th>
                {assessments.map((assessment) => (
                  <th key={assessment.id} className='border p-2'>
                    {assessment.title}
                    <br />
                    <span className='text-sm text-gray-500'>
                      ({assessment.type})
                    </span>
                  </th>
                ))}
                <th className='border p-2'>Status</th>
                <th className='border p-2'>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td className='border p-2'>{student.rollNumber}</td>
                  <td className='border p-2'>{student.user.name}</td>
                  {assessments.map((assessment) => {
                    const result = results[student.id]?.find(
                      (r) => r.assessmentId === assessment.id
                    );
                    return (
                      <td key={assessment.id} className='border p-2'>
                        {result ? (
                          <div>
                            <div>
                              {result.obtainedMarks} / {result.totalMarks}
                            </div>
                            <div className='text-sm text-gray-500'>
                              {result.percentage.toFixed(1)}%
                            </div>
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </td>
                    );
                  })}
                  <td className='border p-2'>
                    {results[student.id]?.map((result) => (
                      <select
                        key={result.id}
                        value={result.status}
                        onChange={(e) =>
                          handleStatusChange(
                            student.id,
                            result.id,
                            e.target.value as
                              | 'pending'
                              | 'evaluated'
                              | 'published'
                              | 'draft'
                          )
                        }
                        className='w-full p-1 border rounded'
                      >
                        <option value='pending'>Pending</option>
                        <option value='evaluated'>Evaluated</option>
                        <option value='published'>Published</option>
                        <option value='draft'>Draft</option>
                      </select>
                    ))}
                  </td>
                  <td className='border p-2'>
                    {results[student.id]?.map((result) => (
                      <textarea
                        key={result.id}
                        value={result.remarks}
                        onChange={(e) =>
                          handleRemarksChange(
                            student.id,
                            result.id,
                            e.target.value
                          )
                        }
                        className='w-full p-1 border rounded'
                        rows={2}
                        placeholder='Add remarks...'
                      />
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : selectedSection ? (
        <div className='text-center py-4'>
          No students found in this section
        </div>
      ) : null}
    </div>
  );
};

export default ResultEvaluationPage;
