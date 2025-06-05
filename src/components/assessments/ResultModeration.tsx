import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface Student {
  id: number;
  rollNumber: string;
  user: {
    name: string;
  };
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

interface ResultModerationProps {
  sectionId: number;
  assessmentId: number;
  students: Student[];
  onSuccess?: () => void;
}

export const ResultModeration: React.FC<ResultModerationProps> = ({
  sectionId,
  assessmentId,
  students,
  onSuccess,
}) => {
  const [results, setResults] = useState<Record<number, AssessmentResult[]>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/assessment-results?sectionId=${sectionId}&assessmentId=${assessmentId}`
        );
        if (!response.ok) throw new Error('Failed to fetch results');
        const data = await response.json();

        // Group results by student
        const groupedResults: Record<number, AssessmentResult[]> = {};
        data.forEach((result: AssessmentResult) => {
          if (!groupedResults[result.studentId]) {
            groupedResults[result.studentId] = [];
          }
          groupedResults[result.studentId].push(result);
        });

        setResults(groupedResults);
      } catch (error) {
        console.error('Error fetching results:', error);
        toast.error('Failed to fetch results');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [sectionId, assessmentId]);

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

      setResults((prev) => ({
        ...prev,
        [studentId]: prev[studentId].map((result) =>
          result.id === resultId ? { ...result, status: newStatus } : result
        ),
      }));

      toast.success('Status updated successfully');
    } catch (error) {
      toast.error('Failed to update status');
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

      setResults((prev) => ({
        ...prev,
        [studentId]: prev[studentId].map((result) =>
          result.id === resultId ? { ...result, remarks } : result
        ),
      }));

      toast.success('Remarks updated successfully');
    } catch (error) {
      toast.error('Failed to update remarks');
    }
  };

  if (loading) {
    return <div className='text-center py-4'>Loading results...</div>;
  }

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {/* Student List */}
        <div className='bg-white p-4 rounded-lg shadow'>
          <h3 className='text-lg font-semibold mb-4'>Students</h3>
          <div className='space-y-2'>
            {students.map((student) => (
              <div
                key={student.id}
                className={`p-3 rounded cursor-pointer ${
                  selectedStudent === student.id
                    ? 'bg-blue-100 border-blue-500'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedStudent(student.id)}
              >
                <div className='font-medium'>{student.user.name}</div>
                <div className='text-sm text-gray-500'>
                  Roll No: {student.rollNumber}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Result Details */}
        <div className='bg-white p-4 rounded-lg shadow'>
          <h3 className='text-lg font-semibold mb-4'>Result Details</h3>
          {selectedStudent && results[selectedStudent] ? (
            <div className='space-y-4'>
              {results[selectedStudent].map((result) => (
                <div key={result.id} className='border rounded p-4'>
                  <div className='grid grid-cols-2 gap-4 mb-4'>
                    <div>
                      <div className='text-sm text-gray-500'>Total Marks</div>
                      <div className='font-medium'>
                        {result.obtainedMarks} / {result.totalMarks}
                      </div>
                    </div>
                    <div>
                      <div className='text-sm text-gray-500'>Percentage</div>
                      <div className='font-medium'>
                        {result.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className='mb-4'>
                    <div className='text-sm text-gray-500 mb-1'>Status</div>
                    <Select
                      value={result.status}
                      onValueChange={(value) =>
                        handleStatusChange(
                          selectedStudent,
                          result.id,
                          value as
                            | 'pending'
                            | 'evaluated'
                            | 'published'
                            | 'draft'
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select status' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='pending'>Pending</SelectItem>
                        <SelectItem value='evaluated'>Evaluated</SelectItem>
                        <SelectItem value='published'>Published</SelectItem>
                        <SelectItem value='draft'>Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <div className='text-sm text-gray-500 mb-1'>Remarks</div>
                    <Textarea
                      value={result.remarks}
                      onChange={(e) =>
                        handleRemarksChange(
                          selectedStudent,
                          result.id,
                          e.target.value
                        )
                      }
                      placeholder='Add remarks...'
                      rows={3}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center text-gray-500'>
              Select a student to view their results
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
